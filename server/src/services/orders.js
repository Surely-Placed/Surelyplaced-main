import db, { table, trxTable } from '../db.js';
import { config, PAYMENT_CURRENCY } from '../config.js';
import { capturePayPalOrder, createPayPalOrder, isPayPalConfigured } from './paypal.js';
import { sendPaymentEmails, sendZoomRegistrationFailureAlert, sendWebinarJoinOtpEmail } from '../mail.js';
import {
  addMeetingRegistrant,
  deleteMeetingRegistrant,
  isZoomAuthConfigured,
  splitFullName,
  toZoomWebClientJoinUrl,
} from './zoom.js';
import {
  decrementWebinarSeat,
  incrementWebinarSeat,
  clearWebinarLiveCache,
  getActiveWebinarEvent,
  resolveActiveZoomMeetingId,
} from './webinarEvents.js';
import { syncPaidWebinarRegistrationToSheet } from './googleSheets.js';
import { logWebinarRegistrantToSheet } from './sheetLogger.js';
import crypto from 'crypto';

const IDEMPOTENCY_TTL_HOURS = 24;
const WEBINAR_PLAN_SLUG = 'webinar-live';

function createJoinAccessToken() {
  return crypto.randomBytes(24).toString('base64url');
}

function buildPortalJoinUrl(joinAccessToken) {
  const siteUrl = (config.siteUrl || config.frontendOrigin || 'https://www.surelyplaced.com').replace(
    /\/$/,
    ''
  );
  return `${siteUrl}/webinar/join?token=${encodeURIComponent(joinAccessToken)}`;
}

function isWebinarOrder(plan, order) {
  return plan?.slug === WEBINAR_PLAN_SLUG || order?.metadata?.plan_slug === WEBINAR_PLAN_SLUG;
}

function getZoomMeta(order) {
  return order?.metadata?.zoom || null;
}

/**
 * Register paid webinar buyers on Zoom once. Idempotent via order.metadata.zoom.
 * Never registers unless order.status is already 'paid'.
 */
export async function ensureZoomRegistration(result) {
  const { order, plan, customer } = result || {};
  if (!order || !isWebinarOrder(plan, order)) {
    return result;
  }

  if (order.status !== 'paid') {
    console.warn(
      'Skipping Zoom registration — order is not paid',
      order.id,
      order.status
    );
    return result;
  }

  const existing = getZoomMeta(order);
  if (existing?.registrant_id && existing?.join_url) {
    return result;
  }

  if (!isZoomAuthConfigured()) {
    console.warn(
      'Zoom OAuth not configured — skipping registrant for order',
      order.id,
      '(set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET)'
    );
    return result;
  }

  const meetingId = await resolveActiveZoomMeetingId();
  if (!meetingId) {
    console.warn(
      'No Zoom meeting ID on active webinar — create one from /sp-webinar-ops admin dashboard'
    );
    return result;
  }

  const { firstName, lastName } = splitFullName(customer?.name);

  try {
    const zoomResult = await addMeetingRegistrant({
      email: customer?.email,
      firstName,
      lastName,
      meetingId,
    });

    const zoomMeta = {
      registrant_id: zoomResult.registrantId,
      join_url: zoomResult.joinUrl,
      meeting_id: String(zoomResult.meetingId || meetingId),
      topic: zoomResult.topic || null,
      start_time: zoomResult.startTime || null,
      registered_at: new Date().toISOString(),
      // Portal token — customer email uses this; Zoom URL stays server-side
      join_access_token: createJoinAccessToken(),
      device_id: null,
      device_bound_at: null,
    };

    const nextMetadata = {
      ...(order.metadata || {}),
      zoom: zoomMeta,
    };

    await table('orders').where({ id: order.id }).update({
      metadata: nextMetadata,
      updated_at: db.fn.now(),
    });

    clearWebinarLiveCache();
    return getOrderById(order.id);
  } catch (err) {
    console.error('Zoom registration failed for order', order.id, err?.message || err);

    const failureMeta = {
      ...(order.metadata || {}),
      zoom: {
        ...(existing || {}),
        error: String(err?.message || err),
        failed_at: new Date().toISOString(),
      },
    };

    try {
      await table('orders').where({ id: order.id }).update({
        metadata: failureMeta,
        updated_at: db.fn.now(),
      });
    } catch (metaError) {
      console.error('Failed to store Zoom error on order:', metaError.message);
    }

    try {
      await sendZoomRegistrationFailureAlert({
        order,
        plan,
        customer,
        errorMessage: String(err?.message || err),
      });
    } catch (alertError) {
      console.error('Zoom failure alert email failed:', alertError.message);
    }

    return getOrderById(order.id);
  }
}

async function finalizePaidOrder(orderId) {
  let result = await getOrderById(orderId);
  if (result?.order?.status !== 'paid') {
    console.warn('finalizePaidOrder skipped — order not paid:', orderId, result?.order?.status);
    return result;
  }

  result = await ensureZoomRegistration(result);

  if (isWebinarOrder(result.plan, result.order) && !result.order?.metadata?.seat_decremented) {
    try {
      const active = await getActiveWebinarEvent();
      await decrementWebinarSeat(active?.id);
      await table('orders')
        .where({ id: orderId })
        .update({
          metadata: {
            ...(result.order.metadata || {}),
            seat_decremented: true,
            webinar_event_id: active?.id || null,
          },
          updated_at: db.fn.now(),
        });
      result = await getOrderById(orderId);
    } catch (seatError) {
      console.error('Seat decrement failed:', seatError.message);
    }
  }

  try {
    await sendPaymentEmails(result);
  } catch (mailError) {
    console.error('Payment email failed:', mailError.message);
  }

  if (
    isWebinarOrder(result.plan, result.order) &&
    !result.order?.metadata?.google_sheets_synced_at
  ) {
    try {
      await syncPaidWebinarRegistrationToSheet(result);
      await table('orders')
        .where({ id: orderId })
        .update({
          metadata: {
            ...(result.order.metadata || {}),
            google_sheets_synced_at: new Date().toISOString(),
          },
          updated_at: db.fn.now(),
        });
      result = await getOrderById(orderId);
    } catch (sheetError) {
      console.error('Google Sheets sync failed:', sheetError.message);
    }
  }

  if (isWebinarOrder(result.plan, result.order)) {
    void logWebinarRegistrantToSheet(result).catch((err) => {
      console.error('[sheetLogger] Real-time sync failed:', err?.message || err);
    });
  }

  return result;
}

export async function getIdempotentResponse(key, route) {
  if (!key) return null;
  const row = await table('idempotency_keys')
    .where({ key, route })
    .andWhere('expires_at', '>', new Date())
    .first();
  if (!row) return null;
  return { statusCode: row.status_code, body: row.response_body };
}

export async function saveIdempotentResponse(key, route, statusCode, body) {
  const expiresAt = new Date(Date.now() + IDEMPOTENCY_TTL_HOURS * 60 * 60 * 1000);
  await table('idempotency_keys')
    .insert({
      key,
      route,
      status_code: statusCode,
      response_body: body,
      expires_at: expiresAt,
    })
    .onConflict('key')
    .merge({
      route,
      status_code: statusCode,
      response_body: body,
      expires_at: expiresAt,
      updated_at: db.fn.now(),
    });
}

export async function getPlanBySlug(slug) {
  return table('plans').where({ slug, active: true }).first();
}

/**
 * Block re-registration: same email cannot pay again for the same active webinar.
 */
export async function assertWebinarEmailAvailable(email, activeEvent) {
  if (!activeEvent) return;
  const normalized = String(email || '')
    .trim()
    .toLowerCase();
  if (!normalized) return;

  const { DB_SCHEMA } = await import('../db-schema.js');
  const eventId = String(activeEvent.id);
  const meetingId = activeEvent.zoom_meeting_id ? String(activeEvent.zoom_meeting_id) : null;

  const rows = await db
    .withSchema(DB_SCHEMA)
    .from('orders')
    .join('customers', 'customers.id', 'orders.customer_id')
    .join('plans', 'plans.id', 'orders.plan_id')
    .where('customers.email', normalized)
    .where('orders.status', 'paid')
    .where(function whereWebinarPlan() {
      this.where('plans.slug', WEBINAR_PLAN_SLUG).orWhereRaw(
        `orders.metadata->>'plan_slug' = ?`,
        [WEBINAR_PLAN_SLUG]
      );
    })
    .select('orders.id', 'orders.metadata');

  const already = rows.some((row) => {
    const meta = row.metadata || {};
    if (meta.webinar_event_id && String(meta.webinar_event_id) === eventId) return true;
    if (meetingId && meta.zoom?.meeting_id && String(meta.zoom.meeting_id) === meetingId) {
      return true;
    }
    return false;
  });

  if (already) {
    const error = new Error(
      'This email is already registered for the current webinar. Check your inbox for the Zoom join link.'
    );
    error.statusCode = 409;
    throw error;
  }
}

function serializeCreateOrderResponse(order, plan, customer, amountMinor) {
  return {
    orderId: order.id,
    paypalOrderId: order.paypal_order_id,
    clientId: config.paypal.clientId,
    mode: config.paypal.mode === 'live' ? 'live' : 'sandbox',
    provider: 'paypal',
    amount: amountMinor ?? order.amount_minor,
    currency: order.currency,
    plan: {
      slug: plan.slug,
      name: plan.name,
    },
    customer: {
      name: customer.name,
      email: customer.email,
      contact: customer.contact,
    },
  };
}

function buildRegistrationSummary(registration) {
  if (!registration) return '';
  return [
    registration.country && `Country: ${registration.country}`,
    registration.status && `Status: ${registration.status}`,
    registration.visa && `Visa: ${registration.visa}`,
    registration.experience && `Experience: ${registration.experience}`,
  ]
    .filter(Boolean)
    .join(' · ');
}

export async function createOrder({
  planSlug,
  name,
  email,
  contact,
  website,
  serviceRequirement,
  registration,
  idempotencyKey,
}) {
  const plan = await getPlanBySlug(planSlug);
  if (!plan) {
    const error = new Error(`Plan not found: ${planSlug}`);
    error.statusCode = 404;
    throw error;
  }

  // Replay same Idempotency-Key → return existing order (no second PayPal charge)
  if (idempotencyKey) {
    const existingByKey = await table('orders').where({ idempotency_key: idempotencyKey }).first();
    if (existingByKey) {
      const [existingPlan, existingCustomer] = await Promise.all([
        table('plans').where({ id: existingByKey.plan_id }).first(),
        table('customers').where({ id: existingByKey.customer_id }).first(),
      ]);
      return serializeCreateOrderResponse(existingByKey, existingPlan || plan, existingCustomer, existingByKey.amount_minor);
    }
  }

  let activeWebinar = null;
  if (plan.slug === WEBINAR_PLAN_SLUG) {
    activeWebinar = await getActiveWebinarEvent();
    if (!activeWebinar) {
      const error = new Error(
        'No webinar is scheduled right now. Join the waitlist to get notified.'
      );
      error.statusCode = 409;
      throw error;
    }
    if (activeWebinar.seats_left <= 0) {
      const error = new Error('This webinar is sold out');
      error.statusCode = 409;
      throw error;
    }
    await assertWebinarEmailAvailable(email, activeWebinar);
    if (activeWebinar.price_cents > 0) {
      plan.amount_minor = activeWebinar.price_cents;
    }
  }

  if (!plan.amount_minor || plan.amount_minor <= 0) {
    const error = new Error(`Plan ${planSlug} is not available for purchase`);
    error.statusCode = 400;
    throw error;
  }

  const currency = (plan.currency || PAYMENT_CURRENCY).toUpperCase();
  if (currency !== PAYMENT_CURRENCY) {
    const error = new Error(`Only ${PAYMENT_CURRENCY} payments are supported`);
    error.statusCode = 400;
    throw error;
  }

  const registrationSummary = buildRegistrationSummary(registration);

  const [customer] = await table('customers')
    .insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      contact: contact?.trim() || null,
      website: website?.trim() || null,
      service_requirement: registrationSummary || serviceRequirement?.trim() || null,
    })
    .returning('*');

  if (!isPayPalConfigured()) {
    const error = new Error(
      'PayPal is not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.'
    );
    error.statusCode = 503;
    throw error;
  }

  const receipt = `sp_${Date.now()}`;
  const paypalOrder = await createPayPalOrder({
    amountMinor: plan.amount_minor,
    currency,
    receipt,
    notes: {
      plan_slug: plan.slug,
      customer_email: customer.email,
      site: 'surelyplaced',
    },
  });

  let order;
  try {
    [order] = await table('orders')
      .insert({
        plan_id: plan.id,
        customer_id: customer.id,
        paypal_order_id: paypalOrder.id,
        status: 'created',
        amount_minor: plan.amount_minor,
        currency,
        idempotency_key: idempotencyKey || null,
        metadata: {
          plan_slug: plan.slug,
          plan_name: plan.name,
          registration: registration || {},
          webinar_event_id: activeWebinar?.id || null,
          payment_provider: 'paypal',
        },
      })
      .returning('*');
  } catch (insertError) {
    // Unique idempotency_key race: another request won — return that order
    if (idempotencyKey && /idempotency_key|unique/i.test(String(insertError.message))) {
      const raced = await table('orders').where({ idempotency_key: idempotencyKey }).first();
      if (raced) {
        const [p, c] = await Promise.all([
          table('plans').where({ id: raced.plan_id }).first(),
          table('customers').where({ id: raced.customer_id }).first(),
        ]);
        return serializeCreateOrderResponse(raced, p || plan, c, raced.amount_minor);
      }
    }
    throw insertError;
  }

  return serializeCreateOrderResponse(order, plan, customer, plan.amount_minor);
}

/**
 * Free webinar registration — same customer/order storage and post-registration
 * pipeline as paid checkout (Zoom, seats, email, Google Sheets), without PayPal.
 */
export async function registerWebinarFree({ name, email, contact, registration }) {
  const plan = await getPlanBySlug(WEBINAR_PLAN_SLUG);
  if (!plan) {
    const error = new Error(`Plan not found: ${WEBINAR_PLAN_SLUG}`);
    error.statusCode = 404;
    throw error;
  }

  const activeWebinar = await getActiveWebinarEvent();
  if (!activeWebinar) {
    const error = new Error(
      'No webinar is scheduled right now. Join the waitlist to get notified.'
    );
    error.statusCode = 409;
    throw error;
  }
  if (activeWebinar.seats_left <= 0) {
    const error = new Error('This webinar is sold out');
    error.statusCode = 409;
    throw error;
  }
  await assertWebinarEmailAvailable(email, activeWebinar);

  const currency = (plan.currency || PAYMENT_CURRENCY).toUpperCase();
  const registrationSummary = buildRegistrationSummary(registration);

  const [customer] = await table('customers')
    .insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      contact: contact?.trim() || null,
      service_requirement: registrationSummary || null,
    })
    .returning('*');

  const [order] = await table('orders')
    .insert({
      plan_id: plan.id,
      customer_id: customer.id,
      status: 'paid',
      amount_minor: 0,
      currency,
      metadata: {
        plan_slug: plan.slug,
        plan_name: plan.name,
        registration: registration || {},
        webinar_event_id: activeWebinar.id,
        payment_provider: 'free',
      },
    })
    .returning('*');

  return finalizePaidOrder(order.id);
}

export async function getOrderById(orderId) {
  const order = await table('orders').where({ id: orderId }).first();
  if (!order) return null;

  const [plan, customer, payment] = await Promise.all([
    table('plans').where({ id: order.plan_id }).first(),
    table('customers').where({ id: order.customer_id }).first(),
    table('payments').where({ order_id: order.id }).first(),
  ]);

  return { order, plan, customer, payment };
}

export async function verifyOrderPayment({ orderId, paypalOrderId }) {
  const order = await table('orders').where({ id: orderId }).first();
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  if (order.paypal_order_id !== paypalOrderId) {
    const error = new Error('Order mismatch');
    error.statusCode = 400;
    throw error;
  }

  if (order.status === 'paid') {
    let result = await getOrderById(order.id);
    const hadZoom = Boolean(getZoomMeta(result.order)?.registrant_id);
    if (isWebinarOrder(result.plan, result.order) && !hadZoom) {
      result = await ensureZoomRegistration(result);
      const hasZoomNow = Boolean(getZoomMeta(result.order)?.registrant_id);
      if (hasZoomNow) {
        try {
          await sendPaymentEmails(result);
        } catch (mailError) {
          console.error('Payment email failed after Zoom retry:', mailError.message);
        }
      }
    }
    return result;
  }

  let capture;
  try {
    capture = await capturePayPalOrder(paypalOrderId);
  } catch (err) {
    const error = new Error(err.message || 'PayPal capture failed');
    error.statusCode = 400;
    throw error;
  }

  const paypalCaptureId = capture.captureId;
  if (!paypalCaptureId) {
    const error = new Error('PayPal capture id missing');
    error.statusCode = 400;
    throw error;
  }

  await db.transaction(async (trx) => {
    await trxTable(trx, 'orders').where({ id: order.id }).update({
      status: 'paid',
      updated_at: trx.fn.now(),
      metadata: {
        ...(order.metadata || {}),
        payment_provider: 'paypal',
      },
    });

    const existingPayment = await trxTable(trx, 'payments')
      .where({ paypal_payment_id: paypalCaptureId })
      .first();

    if (!existingPayment) {
      await trxTable(trx, 'payments').insert({
        order_id: order.id,
        paypal_payment_id: paypalCaptureId,
        status: 'captured',
        method: 'paypal',
        amount_minor: order.amount_minor,
        currency: order.currency,
        raw_payload: {
          provider: 'paypal',
          paypal_order_id: paypalOrderId,
          paypal_capture_id: paypalCaptureId,
          capture,
        },
      });
    }
  });

  return finalizePaidOrder(order.id);
}

async function markOrderPaidFromWebhook(order, paymentEntity, orderEntity) {
  if (order.status === 'paid') {
    let result = await getOrderById(order.id);
    const hadZoom = Boolean(getZoomMeta(result.order)?.registrant_id);
    if (isWebinarOrder(result.plan, result.order) && !hadZoom) {
      result = await ensureZoomRegistration(result);
      const hasZoomNow = Boolean(getZoomMeta(result.order)?.registrant_id);
      if (hasZoomNow) {
        try {
          await sendPaymentEmails(result);
        } catch (mailError) {
          console.error('Payment email failed after Zoom retry:', mailError.message);
        }
      }
    }
    return result;
  }

  const paymentId = paymentEntity?.id;

  await db.transaction(async (trx) => {
    await trxTable(trx, 'orders').where({ id: order.id }).update({
      status: 'paid',
      updated_at: trx.fn.now(),
    });

    if (!paymentId) return;

    const existingPayment = await trxTable(trx, 'payments')
      .where({ paypal_payment_id: paymentId })
      .first();

    if (!existingPayment) {
      await trxTable(trx, 'payments').insert({
        order_id: order.id,
        paypal_payment_id: paymentId,
        status: paymentEntity?.status || 'captured',
        method: paymentEntity?.method || null,
        amount_minor: paymentEntity?.amount || orderEntity?.amount || order.amount_minor,
        currency: (paymentEntity?.currency || orderEntity?.currency || order.currency || PAYMENT_CURRENCY).toUpperCase(),
        raw_payload: paymentEntity || orderEntity || {},
      });
    }
  });

  return finalizePaidOrder(order.id);
}

export async function handleWebhookEvent(event) {
  if (event?.event_type) {
    return handlePayPalWebhookEvent(event);
  }

  const error = new Error('Invalid webhook payload: missing event_type');
  error.statusCode = 400;
  throw error;
}

async function findOrderForPayPalResource(resource, eventType) {
  const paypalOrderId =
    resource?.supplementary_data?.related_ids?.order_id ||
    resource?.custom_id || // sometimes unused
    (String(eventType || '').startsWith('CHECKOUT.ORDER') ? resource?.id : null) ||
    null;

  if (paypalOrderId) {
    const byOrder = await table('orders').where({ paypal_order_id: String(paypalOrderId) }).first();
    if (byOrder) return { order: byOrder, paypalOrderId: String(paypalOrderId) };
  }

  // Capture / refund resources often include related order id only under supplementary_data
  const relatedOrderId = resource?.supplementary_data?.related_ids?.order_id;
  if (relatedOrderId) {
    const byRelated = await table('orders')
      .where({ paypal_order_id: String(relatedOrderId) })
      .first();
    if (byRelated) return { order: byRelated, paypalOrderId: String(relatedOrderId) };
  }

  return { order: null, paypalOrderId: paypalOrderId ? String(paypalOrderId) : null };
}

async function updateOrderPaymentStatus(order, status, extraMetadata = {}) {
  const nextMetadata = {
    ...(order.metadata || {}),
    payment_provider: 'paypal',
    paypal_webhook: {
      ...(order.metadata?.paypal_webhook || {}),
      ...extraMetadata,
      updated_at: new Date().toISOString(),
    },
  };

  await table('orders').where({ id: order.id }).update({
    status,
    metadata: nextMetadata,
    updated_at: db.fn.now(),
  });
}

/**
 * Important PayPal webhook events for Orders v2 CAPTURE checkout.
 * Subscribe these in PayPal Dashboard → Webhooks.
 * Note: CHECKOUT.PAYMENT-APPROVAL.REVERSED is not always listed in the UI — skip if missing.
 */
export const PAYPAL_WEBHOOK_EVENTS = [
  'PAYMENT.CAPTURE.COMPLETED',
  'PAYMENT.CAPTURE.DENIED',
  'PAYMENT.CAPTURE.DECLINED',
  'PAYMENT.CAPTURE.PENDING',
  'PAYMENT.CAPTURE.REFUNDED',
  'PAYMENT.CAPTURE.REVERSED',
  'CHECKOUT.ORDER.APPROVED',
  'CHECKOUT.ORDER.COMPLETED',
];

async function handlePayPalWebhookEvent(event) {
  const eventType = event.event_type;
  const eventId = event.id ? String(event.id) : null;

  if (eventId) {
    const existing = await table('payment_events').where({ event_id: eventId }).first();
    if (existing) return { duplicate: true };
  }

  const resource = event.resource || {};
  const { order, paypalOrderId } = await findOrderForPayPalResource(resource, eventType);
  const captureId =
    String(eventType || '').startsWith('PAYMENT.CAPTURE.') && resource?.id
      ? String(resource.id)
      : null;

  await table('payment_events').insert({
    event_id: eventId || `${eventType}:${Date.now()}`,
    event_type: eventType,
    paypal_payment_id: captureId,
    paypal_order_id: paypalOrderId,
    payload: event,
  });

  // Buyer approved — capture is done by /verify; do NOT mark paid or Zoom-register here
  if (eventType === 'CHECKOUT.ORDER.APPROVED') {
    if (order && order.status !== 'paid') {
      await updateOrderPaymentStatus(order, order.status || 'created', {
        last_event: eventType,
        paypal_status: resource?.status || 'APPROVED',
      });
    }
    return { processed: true, eventType };
  }

  // Money captured successfully — only real PayPal capture events grant webinar seats
  if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
    if (!order) return { processed: true, orderMissing: true, eventType };
    if (!captureId) {
      console.warn('PAYMENT.CAPTURE.COMPLETED missing capture id — ignoring for paid/Zoom');
      return { processed: true, eventType, skipped: true };
    }
    const captureStatus = String(resource?.status || '').toUpperCase();
    if (captureStatus && captureStatus !== 'COMPLETED') {
      console.warn('PAYMENT.CAPTURE.COMPLETED with non-COMPLETED status:', captureStatus);
      return { processed: true, eventType, skipped: true };
    }
    await markOrderPaidFromWebhook(
      order,
      {
        id: captureId,
        status: 'captured',
        method: 'paypal',
        amount: order.amount_minor,
        currency: order.currency,
      },
      { id: paypalOrderId }
    );
    return { processed: true, eventType };
  }

  // Order completed — only mark paid if a COMPLETED capture id is present on the resource
  if (eventType === 'CHECKOUT.ORDER.COMPLETED') {
    if (!order) return { processed: true, orderMissing: true, eventType };
    const orderCaptureId =
      captureId ||
      resource?.purchase_units?.[0]?.payments?.captures?.find(
        (c) => String(c?.status || '').toUpperCase() === 'COMPLETED'
      )?.id ||
      null;
    if (!orderCaptureId) {
      console.warn(
        'CHECKOUT.ORDER.COMPLETED without COMPLETED capture — waiting for verify or CAPTURE.COMPLETED'
      );
      return { processed: true, eventType, skipped: true };
    }
    await markOrderPaidFromWebhook(
      order,
      {
        id: String(orderCaptureId),
        status: 'captured',
        method: 'paypal',
        amount: order.amount_minor,
        currency: order.currency,
      },
      { id: paypalOrderId }
    );
    return { processed: true, eventType };
  }

  // Capture waiting (e.g. echeck / review)
  if (eventType === 'PAYMENT.CAPTURE.PENDING') {
    if (order && order.status !== 'paid') {
      await updateOrderPaymentStatus(order, 'created', {
        last_event: eventType,
        paypal_status: 'PENDING',
        capture_id: captureId,
        reason: resource?.status_details?.reason || null,
      });
    }
    return { processed: true, eventType };
  }

  // Capture failed / denied / approval reversed before capture
  if (
    eventType === 'PAYMENT.CAPTURE.DENIED' ||
    eventType === 'PAYMENT.CAPTURE.DECLINED' ||
    eventType === 'CHECKOUT.PAYMENT-APPROVAL.REVERSED'
  ) {
    if (order && order.status !== 'paid') {
      await updateOrderPaymentStatus(order, 'failed', {
        last_event: eventType,
        paypal_status: 'DENIED',
        capture_id: captureId,
        reason: resource?.status_details?.reason || resource?.reason_code || null,
      });
    }
    return { processed: true, eventType };
  }

  // Refund / chargeback-style reverse after paid
  if (eventType === 'PAYMENT.CAPTURE.REFUNDED' || eventType === 'PAYMENT.CAPTURE.REVERSED') {
    if (order) {
      await updateOrderPaymentStatus(order, 'refunded', {
        last_event: eventType,
        paypal_status: eventType === 'PAYMENT.CAPTURE.REFUNDED' ? 'REFUNDED' : 'REVERSED',
        capture_id: captureId,
        refund_id: resource?.id || null,
      });

      // Keep payment row but mark refunded in payload trail
      if (captureId) {
        const payment = await table('payments')
          .where({ order_id: order.id })
          .orderBy('created_at', 'desc')
          .first();
        if (payment) {
          await table('payments')
            .where({ id: payment.id })
            .update({
              status: eventType === 'PAYMENT.CAPTURE.REFUNDED' ? 'refunded' : 'reversed',
              raw_payload: {
                ...(payment.raw_payload || {}),
                last_webhook: eventType,
                refund_or_reverse: resource,
              },
              updated_at: db.fn.now(),
            });
        }
      }
    }
    return { processed: true, eventType };
  }

  console.log('PayPal webhook ignored (no handler):', eventType);
  return { processed: true, ignored: true, eventType };
}

/**
 * Ops: remove a webinar registration (DB + Zoom registrant + restore seat).
 * Does not refund PayPal — use for test cleanup / manual removals.
 */
export async function deleteWebinarAttendee(orderId) {
  const order = await table('orders').where({ id: orderId }).first();
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  const plan = await table('plans').where({ id: order.plan_id }).first();
  if (!isWebinarOrder(plan, order)) {
    const error = new Error('Order is not a webinar registration');
    error.statusCode = 400;
    throw error;
  }

  const zoom = getZoomMeta(order);
  let zoomDeleted = false;
  if (zoom?.meeting_id && zoom?.registrant_id && isZoomAuthConfigured()) {
    try {
      await deleteMeetingRegistrant({
        meetingId: zoom.meeting_id,
        registrantId: zoom.registrant_id,
      });
      zoomDeleted = true;
    } catch (err) {
      console.error('Zoom registrant delete failed:', err.message);
    }
  }

  if (order.metadata?.seat_decremented && order.metadata?.webinar_event_id) {
    try {
      await incrementWebinarSeat(order.metadata.webinar_event_id);
    } catch (err) {
      console.error('Seat restore failed:', err.message);
    }
  }

  await table('payments').where({ order_id: order.id }).del();
  await table('orders').where({ id: order.id }).del();
  clearWebinarLiveCache();

  return {
    deletedOrderId: order.id,
    zoomDeleted,
    email: null,
  };
}

/**
 * Send a one-time code to the paid registration email before releasing Zoom access.
 * OTP is required on every join. Device must match the first locked device (if any).
 */
export async function requestWebinarJoinOtp({ token, email, deviceId }) {
  const accessToken = String(token || '').trim();
  const normalizedEmail = String(email || '')
    .trim()
    .toLowerCase();
  const device = String(deviceId || '')
    .trim()
    .slice(0, 128);

  if (!accessToken || accessToken.length < 16) {
    const error = new Error('Invalid join link');
    error.statusCode = 400;
    throw error;
  }
  if (!normalizedEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) {
    const error = new Error('Enter the email you used when registering');
    error.statusCode = 400;
    throw error;
  }
  if (!device || device.length < 8) {
    const error = new Error('Device id is required');
    error.statusCode = 400;
    throw error;
  }

  const { DB_SCHEMA } = await import('../db-schema.js');
  const row = await db
    .withSchema(DB_SCHEMA)
    .from('orders')
    .join('customers', 'customers.id', 'orders.customer_id')
    .where('orders.status', 'paid')
    .whereRaw(`orders.metadata->'zoom'->>'join_access_token' = ?`, [accessToken])
    .select('orders.*', 'customers.email as customer_email', 'customers.name as customer_name')
    .first();

  if (!row) {
    const error = new Error('Join link not found or expired');
    error.statusCode = 404;
    throw error;
  }

  const paidEmail = String(row.customer_email || '')
    .trim()
    .toLowerCase();
  if (paidEmail !== normalizedEmail) {
    const error = new Error(
      'That email does not match this registration. Use the same email you used when registering.'
    );
    error.statusCode = 403;
    throw error;
  }

  const zoom = row.metadata?.zoom || {};
  if (!zoom.join_url) {
    const error = new Error('Zoom join link is not ready yet. Contact support.');
    error.statusCode = 409;
    throw error;
  }

  const bound = zoom.device_id ? String(zoom.device_id) : null;
  if (bound && bound !== device) {
    const error = new Error(
      'This webinar join link is already locked to another device. Contact support if you need to switch devices.'
    );
    error.statusCode = 403;
    throw error;
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpHash = crypto.createHash('sha256').update(`${accessToken}:${otp}`).digest('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await table('orders')
    .where({ id: row.id })
    .update({
      metadata: {
        ...(row.metadata || {}),
        zoom: {
          ...zoom,
          join_otp_hash: otpHash,
          join_otp_expires_at: expiresAt,
          join_otp_attempts: 0,
        },
      },
      updated_at: db.fn.now(),
    });

  await sendWebinarJoinOtpEmail({
    to: paidEmail,
    name: row.customer_name,
    otp,
  });

  return {
    ok: true,
    message: 'We sent a new 6-digit code to your registration email. Enter it to open Zoom.',
    expiresInSeconds: 600,
  };
}

/**
 * Single-device lock + OTP required on every join before Zoom URL is released.
 */
export async function claimWebinarJoin({ token, deviceId, email, otp }) {
  const accessToken = String(token || '').trim();
  const device = String(deviceId || '').trim().slice(0, 128);
  const normalizedEmail = String(email || '')
    .trim()
    .toLowerCase();
  const code = String(otp || '')
    .trim()
    .replace(/\s+/g, '');

  if (!accessToken || accessToken.length < 16) {
    const error = new Error('Invalid join link');
    error.statusCode = 400;
    throw error;
  }
  if (!device || device.length < 8) {
    const error = new Error('Device id is required');
    error.statusCode = 400;
    throw error;
  }
  if (!normalizedEmail) {
    const error = new Error('Enter the email you used when registering');
    error.statusCode = 400;
    throw error;
  }
  if (!/^\d{6}$/.test(code)) {
    const error = new Error('Enter the 6-digit code we emailed you');
    error.statusCode = 400;
    throw error;
  }

  const { DB_SCHEMA } = await import('../db-schema.js');

  return db.transaction(async (trx) => {
    const order = await trx
      .withSchema(DB_SCHEMA)
      .from('orders')
      .where('status', 'paid')
      .whereRaw(`metadata->'zoom'->>'join_access_token' = ?`, [accessToken])
      .forUpdate()
      .first();

    if (!order) {
      const error = new Error('Join link not found or expired');
      error.statusCode = 404;
      throw error;
    }

    const customer = await trx
      .withSchema(DB_SCHEMA)
      .from('customers')
      .where({ id: order.customer_id })
      .first();

    const paidEmail = String(customer?.email || '')
      .trim()
      .toLowerCase();
    if (paidEmail !== normalizedEmail) {
      const error = new Error(
        'That email does not match this registration. Use the same email you used when registering.'
      );
      error.statusCode = 403;
      throw error;
    }

    const zoom = order.metadata?.zoom || {};
    if (!zoom.join_url) {
      const error = new Error('Zoom join link is not ready yet. Contact support.');
      error.statusCode = 409;
      throw error;
    }

    const bound = zoom.device_id ? String(zoom.device_id) : null;
    if (bound && bound !== device) {
      const error = new Error(
        'This webinar join link is already locked to another device. Contact support if you need to switch devices.'
      );
      error.statusCode = 403;
      throw error;
    }

    const expiresAt = zoom.join_otp_expires_at ? new Date(zoom.join_otp_expires_at).getTime() : 0;
    if (!zoom.join_otp_hash || !expiresAt || Date.now() > expiresAt) {
      const error = new Error('Code expired. Request a new code.');
      error.statusCode = 400;
      throw error;
    }

    const attempts = Number(zoom.join_otp_attempts) || 0;
    if (attempts >= 5) {
      const error = new Error('Too many attempts. Request a new code.');
      error.statusCode = 429;
      throw error;
    }

    const expected = crypto.createHash('sha256').update(`${accessToken}:${code}`).digest('hex');
    if (expected !== zoom.join_otp_hash) {
      await trx
        .withSchema(DB_SCHEMA)
        .from('orders')
        .where({ id: order.id })
        .update({
          metadata: {
            ...(order.metadata || {}),
            zoom: {
              ...zoom,
              join_otp_attempts: attempts + 1,
            },
          },
          updated_at: trx.fn.now(),
        });
      const error = new Error('Incorrect code. Check your registration email inbox.');
      error.statusCode = 403;
      throw error;
    }

    const nextZoom = {
      ...zoom,
      device_id: device,
      device_bound_at: zoom.device_bound_at || new Date().toISOString(),
      verified_email: paidEmail,
      verified_at: new Date().toISOString(),
      // Clear OTP so the same code cannot be reused; every join needs a fresh code
      join_otp_hash: null,
      join_otp_expires_at: null,
      join_otp_attempts: 0,
    };

    await trx
      .withSchema(DB_SCHEMA)
      .from('orders')
      .where({ id: order.id })
      .update({
        metadata: {
          ...(order.metadata || {}),
          zoom: nextZoom,
        },
        updated_at: trx.fn.now(),
      });

    return {
      ok: true,
      mode: 'browser',
      joinUrl: toZoomWebClientJoinUrl(zoom.join_url, { requireSignedInRegistrant: true }),
      bound: true,
      firstClaim: !bound,
      paidEmail,
      mustSignInAs: paidEmail,
    };
  });
}

/** Ops: clear device lock so attendee can open join link on a new device. */
export async function resetWebinarJoinDevice(orderId) {
  const order = await table('orders').where({ id: orderId }).first();
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }
  const zoom = order.metadata?.zoom;
  if (!zoom?.join_access_token && !zoom?.join_url) {
    const error = new Error('Order has no Zoom join access');
    error.statusCode = 400;
    throw error;
  }

  const nextZoom = {
    ...zoom,
    join_access_token: zoom.join_access_token || createJoinAccessToken(),
    device_id: null,
    device_bound_at: null,
    verified_email: null,
    verified_at: null,
    join_otp_hash: null,
    join_otp_expires_at: null,
    join_otp_attempts: 0,
  };

  await table('orders')
    .where({ id: order.id })
    .update({
      metadata: { ...(order.metadata || {}), zoom: nextZoom },
      updated_at: db.fn.now(),
    });

  return {
    ok: true,
    orderId: order.id,
    portalJoinUrl: buildPortalJoinUrl(nextZoom.join_access_token),
  };
}

export { buildPortalJoinUrl };
