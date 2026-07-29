import db, { table } from '../db.js';
import { config } from '../config.js';
import {
  createRegistrationMeeting,
  deleteZoomMeeting,
  ensureMeetingHostGate,
  getMeetingLiveStatus,
  getZoomMeetingId,
  isZoomAuthConfigured,
  isZoomMeetingNotFoundError,
  updateMeetingRegistrationCap,
} from './zoom.js';

const LIVE_CACHE_MS = 12_000;
let liveCache = { at: 0, payload: null, meetingId: null };

export function clearWebinarLiveCache() {
  liveCache = { at: 0, payload: null, meetingId: null };
}

function serializeEvent(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startsAt: row.starts_at,
    datetimeLabel: row.datetime_label,
    seatsTotal: row.seats_total,
    seatsLeft: row.seats_left,
    priceCents: row.price_cents,
    currency: row.currency,
    zoomMeetingId: row.zoom_meeting_id,
    zoomStartUrl: row.zoom_start_url,
    active: row.active,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getActiveWebinarEvent() {
  return table('webinar_events').where({ active: true }).orderBy('updated_at', 'desc').first();
}

export async function listWebinarEvents() {
  await reconcileDeletedZoomMeetings();
  return table('webinar_events').orderBy('created_at', 'desc');
}

export async function listWebinarEventsPaginated({ page = 1, pageSize = 10 } = {}) {
  await reconcileDeletedZoomMeetings();
  const safePage = Math.max(1, Number(page) || 1);
  const safeSize = Math.min(100, Math.max(1, Number(pageSize) || 10));
  const offset = (safePage - 1) * safeSize;

  const countRow = await table('webinar_events').count({ total: '*' }).first();
  const total = Number(countRow?.total) || 0;

  const rows = await table('webinar_events')
    .orderBy('created_at', 'desc')
    .limit(safeSize)
    .offset(offset);

  return {
    webinars: rows.map(serializeEvent),
    pagination: {
      page: safePage,
      pageSize: safeSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeSize) || 1),
    },
  };
}

/** Delete a webinar event by id. Also removes the Zoom meeting when present. */
export async function deleteWebinarEvent(eventId) {
  const row = await table('webinar_events').where({ id: eventId }).first();
  if (!row) {
    const error = new Error('Webinar event not found');
    error.statusCode = 404;
    throw error;
  }

  let zoomDeleted = false;
  if (row.zoom_meeting_id) {
    if (!isZoomAuthConfigured()) {
      const error = new Error(
        'Zoom OAuth is not configured — cannot delete the linked Zoom meeting. Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET.'
      );
      error.statusCode = 503;
      throw error;
    }
    await deleteZoomMeeting(row.zoom_meeting_id);
    zoomDeleted = true;
  }

  clearWebinarLiveCache();
  await table('webinar_events').where({ id: eventId }).del();

  return {
    deleted: true,
    id: eventId,
    zoomDeleted,
    zoomMeetingId: row.zoom_meeting_id || null,
    wasActive: Boolean(row.active),
  };
}

/** Remove local webinar rows whose Zoom meeting was deleted in Zoom. */
export async function deleteWebinarByZoomMeetingId(meetingId) {
  if (!meetingId) return 0;
  clearWebinarLiveCache();
  const deleted = await table('webinar_events')
    .where({ zoom_meeting_id: String(meetingId) })
    .del();
  if (deleted) {
    console.warn(`Removed webinar_events tied to deleted Zoom meeting ${meetingId}`);
  }
  return deleted;
}

/**
 * Check each event's Zoom meeting; delete local rows for meetings gone from Zoom.
 * Skips when Zoom auth is missing or errors are scope/network (not 404).
 */
export async function reconcileDeletedZoomMeetings() {
  if (!isZoomAuthConfigured()) return { removed: 0 };

  const rows = await table('webinar_events')
    .whereNotNull('zoom_meeting_id')
    .where('zoom_meeting_id', '!=', '');

  let removed = 0;
  for (const row of rows) {
    try {
      await getMeetingLiveStatus(row.zoom_meeting_id);
    } catch (error) {
      if (isZoomMeetingNotFoundError(error)) {
        await table('webinar_events').where({ id: row.id }).del();
        removed += 1;
        console.warn(
          `Deleted local webinar "${row.title}" (${row.id}) — Zoom meeting ${row.zoom_meeting_id} no longer exists`
        );
      }
      // Scope / auth / network errors: leave the row alone
    }
  }

  if (removed) clearWebinarLiveCache();
  return { removed };
}

/**
 * Sync seats + start time from Zoom registrants / meeting details into DB,
 * then return public webinar payload for the landing page.
 */
export async function getPublicWebinarConfig({ forceRefresh = false } = {}) {
  const event = await getActiveWebinarEvent();
  if (!event) {
    const latest = await table('webinar_events').orderBy('updated_at', 'desc').first();
    if (latest) {
      return {
        id: latest.id,
        title: latest.title,
        datetimeLabel: latest.datetime_label || 'Date TBD',
        startsAt: latest.starts_at || null,
        seatsTotal: latest.seats_total,
        seatsLeft: latest.seats_left,
        seatsFilled: Math.max(0, latest.seats_total - latest.seats_left),
        priceCents: latest.price_cents,
        currency: latest.currency,
        active: false,
        syncedFromZoom: false,
        zoomMeetingId: latest.zoom_meeting_id || null,
        serverTime: new Date().toISOString(),
      };
    }

    return {
      title: 'Live Career Webinar',
      datetimeLabel: 'Date TBD',
      startsAt: null,
      seatsTotal: 25,
      seatsLeft: 5,
      seatsFilled: 20,
      priceCents: 1999,
      currency: 'USD',
      active: false,
      syncedFromZoom: false,
      serverTime: new Date().toISOString(),
    };
  }

  const meetingId = event.zoom_meeting_id || getZoomMeetingId() || null;
  let seatsTotal = event.seats_total;
  let seatsLeft = event.seats_left;
  let startsAt = event.starts_at;
  let seatsFilled = Math.max(0, seatsTotal - seatsLeft);
  let syncedFromZoom = false;
  let zoomRegistrants = null;

  if (meetingId && isZoomAuthConfigured()) {
    const cacheHit =
      !forceRefresh &&
      liveCache.payload &&
      liveCache.meetingId === String(meetingId) &&
      Date.now() - liveCache.at < LIVE_CACHE_MS;

    let live = cacheHit ? liveCache.payload : null;
    if (!live) {
      try {
        live = await getMeetingLiveStatus(meetingId);
        liveCache = { at: Date.now(), payload: live, meetingId: String(meetingId) };
      } catch (error) {
        if (isZoomMeetingNotFoundError(error)) {
          await deleteWebinarByZoomMeetingId(meetingId);
          // Re-resolve config after deletion (next active / waitlist mode)
          return getPublicWebinarConfig({ forceRefresh: true });
        }
        console.error('Zoom live sync failed:', error.message);
      }
    }

    if (live) {
      syncedFromZoom = true;
      zoomRegistrants = live.registrantCount;
      seatsFilled = live.registrantCount;
      if (live.seatsTotal && live.seatsTotal > 0) {
        seatsTotal = live.seatsTotal;
      }
      seatsLeft = Math.max(0, seatsTotal - seatsFilled);
      if (live.startTime) {
        startsAt = live.startTime;
      }

      // Persist sync so admin dashboard stays aligned
      const needsUpdate =
        event.seats_total !== seatsTotal ||
        event.seats_left !== seatsLeft ||
        (live.startTime &&
          String(event.starts_at || '') !== String(new Date(live.startTime).toISOString()));

      if (needsUpdate) {
        await table('webinar_events')
          .where({ id: event.id })
          .update({
            seats_total: seatsTotal,
            seats_left: seatsLeft,
            starts_at: live.startTime ? new Date(live.startTime) : event.starts_at,
            updated_at: db.fn.now(),
          });
      }
    }
  }

  return {
    id: event.id,
    title: event.title,
    datetimeLabel: event.datetime_label,
    startsAt,
    seatsTotal,
    seatsLeft: Math.max(0, seatsLeft),
    seatsFilled,
    zoomRegistrants,
    priceCents: event.price_cents,
    currency: event.currency,
    active: true,
    syncedFromZoom,
    zoomMeetingId: meetingId,
    serverTime: new Date().toISOString(),
  };
}

/** Meeting ID used for registrant API: active DB event first, else env fallback. */
export async function resolveActiveZoomMeetingId() {
  const event = await getActiveWebinarEvent();
  if (event?.zoom_meeting_id) return String(event.zoom_meeting_id);
  return getZoomMeetingId() || null;
}

export async function decrementWebinarSeat(eventId) {
  if (!eventId) {
    const active = await getActiveWebinarEvent();
    if (!active) return;
    eventId = active.id;
  }

  await table('webinar_events')
    .where({ id: eventId })
    .andWhere('seats_left', '>', 0)
    .update({
      seats_left: db.raw('seats_left - 1'),
      updated_at: db.fn.now(),
    });

  clearWebinarLiveCache();
}

export async function incrementWebinarSeat(eventId) {
  if (!eventId) {
    const active = await getActiveWebinarEvent();
    if (!active) return;
    eventId = active.id;
  }

  await table('webinar_events')
    .where({ id: eventId })
    .update({
      seats_left: db.raw('LEAST(seats_total, seats_left + 1)'),
      updated_at: db.fn.now(),
    });

  clearWebinarLiveCache();
}

export async function updateWebinarSeats({ eventId, seatsTotal, seatsLeft }) {
  const event = eventId
    ? await table('webinar_events').where({ id: eventId }).first()
    : await getActiveWebinarEvent();

  if (!event) {
    const error = new Error('No webinar event found');
    error.statusCode = 404;
    throw error;
  }

  const nextTotal =
    seatsTotal !== undefined && seatsTotal !== null ? Number(seatsTotal) : event.seats_total;
  let nextLeft =
    seatsLeft !== undefined && seatsLeft !== null ? Number(seatsLeft) : event.seats_left;

  if (!Number.isFinite(nextTotal) || nextTotal < 0) {
    const error = new Error('Invalid seats_total');
    error.statusCode = 400;
    throw error;
  }
  if (!Number.isFinite(nextLeft) || nextLeft < 0) {
    const error = new Error('Invalid seats_left');
    error.statusCode = 400;
    throw error;
  }
  if (nextLeft > nextTotal) nextLeft = nextTotal;

  if (event.zoom_meeting_id && isZoomAuthConfigured()) {
    try {
      await updateMeetingRegistrationCap(event.zoom_meeting_id, nextTotal);
      const live = await getMeetingLiveStatus(event.zoom_meeting_id);
      if (live) {
        nextLeft = Math.max(0, nextTotal - live.registrantCount);
        liveCache = { at: 0, payload: null, meetingId: null };
      }
    } catch (error) {
      if (isZoomMeetingNotFoundError(error)) {
        await deleteWebinarByZoomMeetingId(event.zoom_meeting_id);
        const gone = new Error(
          'This Zoom meeting was deleted in Zoom. It has been removed from Webinar Ops.'
        );
        gone.statusCode = 410;
        throw gone;
      }
      console.error('Failed to sync seat cap to Zoom:', error.message);
    }
  }

  const [updated] = await table('webinar_events')
    .where({ id: event.id })
    .update({
      seats_total: nextTotal,
      seats_left: nextLeft,
      updated_at: db.fn.now(),
    })
    .returning('*');

  return serializeEvent(updated);
}

/**
 * Create webinar in DB + Zoom Meeting (registration required). Deactivates other events.
 */
export async function createWebinarEvent({
  title,
  description,
  startsAt,
  datetimeLabel,
  seatsTotal = 25,
  seatsLeft,
  priceCents = 1999,
  createZoom = true,
  timezone = 'America/New_York',
  durationMinutes = 90,
}) {
  if (!title?.trim()) {
    const error = new Error('Title is required');
    error.statusCode = 400;
    throw error;
  }

  const total = Number(seatsTotal) || 25;
  const left = seatsLeft !== undefined && seatsLeft !== null ? Number(seatsLeft) : total;

  let zoomMeetingId = null;
  let zoomStartUrl = null;
  let zoomMeta = {};

  if (createZoom) {
    if (!isZoomAuthConfigured()) {
      const error = new Error(
        'Zoom OAuth not configured. Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET.'
      );
      error.statusCode = 400;
      throw error;
    }
    const startIso = startsAt
      ? new Date(startsAt).toISOString().replace(/\.\d{3}Z$/, 'Z')
      : undefined;
    const zoom = await createRegistrationMeeting({
      topic: title.trim(),
      startTimeIso: startIso,
      durationMinutes,
      timezone,
      seatsTotal: total,
    });
    zoomMeetingId = zoom.meetingId;
    zoomStartUrl = zoom.startUrl;
    zoomMeta = { zoom_join_url: zoom.joinUrl, zoom_topic: zoom.topic };
    try {
      await ensureMeetingHostGate(zoomMeetingId);
    } catch (err) {
      console.error('Zoom host-gate enforce failed:', err.message);
    }
  }

  await table('webinar_events').where({ active: true }).update({
    active: false,
    updated_at: db.fn.now(),
  });

  const [row] = await table('webinar_events')
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      starts_at: startsAt ? new Date(startsAt) : null,
      datetime_label: datetimeLabel?.trim() || null,
      seats_total: total,
      seats_left: Math.min(left, total),
      price_cents: Number(priceCents) || 1999,
      currency: 'USD',
      zoom_meeting_id: zoomMeetingId,
      zoom_start_url: zoomStartUrl,
      active: true,
      metadata: {
        plan_slug: 'webinar-live',
        ...zoomMeta,
        site_url: config.siteUrl,
      },
    })
    .returning('*');

  await syncWebinarPlanPrice(row.price_cents);

  try {
    const { notifyWaitlistOfNewWebinar } = await import('./webinarWaitlist.js');
    await notifyWaitlistOfNewWebinar(serializeEvent(row));
  } catch (err) {
    console.error('Waitlist notify on create failed:', err.message);
  }

  return serializeEvent(row);
}

export async function updateWebinarEvent(eventId, patch = {}) {
  const event = await table('webinar_events').where({ id: eventId }).first();
  if (!event) {
    const error = new Error('Webinar not found');
    error.statusCode = 404;
    throw error;
  }

  const updates = { updated_at: db.fn.now() };
  if (patch.title !== undefined) updates.title = String(patch.title).trim();
  if (patch.description !== undefined) updates.description = patch.description;
  if (patch.datetimeLabel !== undefined) updates.datetime_label = patch.datetimeLabel;
  if (patch.startsAt !== undefined) updates.starts_at = patch.startsAt ? new Date(patch.startsAt) : null;
  if (patch.active !== undefined) {
    if (patch.active) {
      await table('webinar_events').whereNot({ id: eventId }).update({ active: false });
    }
    updates.active = Boolean(patch.active);
  }
  if (patch.seatsTotal !== undefined || patch.seatsLeft !== undefined) {
    const total = patch.seatsTotal !== undefined ? Number(patch.seatsTotal) : event.seats_total;
    let left = patch.seatsLeft !== undefined ? Number(patch.seatsLeft) : event.seats_left;
    if (left > total) left = total;
    updates.seats_total = total;
    updates.seats_left = left;
  }
  if (patch.priceCents !== undefined && patch.priceCents !== null) {
    const cents = Number(patch.priceCents);
    if (!Number.isFinite(cents) || cents < 0) {
      const error = new Error('Invalid price');
      error.statusCode = 400;
      throw error;
    }
    updates.price_cents = Math.round(cents);
  }

  const [updated] = await table('webinar_events')
    .where({ id: event.id })
    .update(updates)
    .returning('*');

  if (updates.price_cents !== undefined) {
    await syncWebinarPlanPrice(updates.price_cents);
  }

  return serializeEvent(updated);
}

async function syncWebinarPlanPrice(priceCents) {
  const cents = Math.round(Number(priceCents));
  if (!Number.isFinite(cents) || cents < 0) return;
  await table('plans')
    .where({ slug: 'webinar-live' })
    .update({
      amount_minor: cents,
      updated_at: db.fn.now(),
    });
}

function mapAttendeeRow(row) {
  return {
    orderId: row.order_id,
    status: row.order_status,
    amountMinor: row.amount_minor,
    currency: row.currency || 'USD',
    orderedAt: row.ordered_at,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerContact: row.customer_contact,
    paymentId: row.paypal_payment_id,
    paymentStatus: row.payment_status,
    registration: row.metadata?.registration || {},
    zoom: row.metadata?.zoom || null,
  };
}

function applyWebinarOrderFilter(query) {
  return query.where(function whereWebinar() {
    this.where('plans.slug', 'webinar-live').orWhereRaw(
      `orders.metadata->>'plan_slug' = ?`,
      ['webinar-live']
    );
  });
}

export async function listWebinarAttendees({ page = 1, pageSize = 20, status } = {}) {
  const { DB_SCHEMA } = await import('../db-schema.js');
  const safePage = Math.max(1, Number(page) || 1);
  const safeSize = Math.min(100, Math.max(1, Number(pageSize) || 20));
  const offset = (safePage - 1) * safeSize;

  const base = () =>
    applyWebinarOrderFilter(
      db
        .withSchema(DB_SCHEMA)
        .from('orders')
        .join('customers', 'customers.id', 'orders.customer_id')
        .join('plans', 'plans.id', 'orders.plan_id')
        .leftJoin('payments', 'payments.order_id', 'orders.id')
    );

  let countQuery = base().countDistinct({ total: 'orders.id' });
  if (status) countQuery = countQuery.andWhere('orders.status', status);
  const countRow = await countQuery.first();
  const totalCount = Number(countRow?.total) || 0;

  let rowsQuery = base();
  if (status) rowsQuery = rowsQuery.andWhere('orders.status', status);
  const rows = await rowsQuery
    .select(
      'orders.id as order_id',
      'orders.status as order_status',
      'orders.amount_minor',
      'orders.currency',
      'orders.metadata',
      'orders.created_at as ordered_at',
      'orders.updated_at as updated_at',
      'customers.name as customer_name',
      'customers.email as customer_email',
      'customers.contact as customer_contact',
      'payments.paypal_payment_id',
      'payments.status as payment_status'
    )
    .orderBy('orders.created_at', 'desc')
    .limit(safeSize)
    .offset(offset);

  const paidRow = await base().where('orders.status', 'paid').countDistinct({ paid: 'orders.id' }).first();

  return {
    attendees: rows.map(mapAttendeeRow),
    pagination: {
      page: safePage,
      pageSize: safeSize,
      total: totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / safeSize) || 1),
    },
    paidCount: Number(paidRow?.paid) || 0,
  };
}

/** Remove all webinar events + non-paid webinar orders (and their payment rows). */
export async function clearWebinarTestData() {
  const { DB_SCHEMA } = await import('../db-schema.js');

  const events = await table('webinar_events').select('id', 'zoom_meeting_id', 'title');
  let zoomDeleted = 0;
  const zoomErrors = [];

  if (isZoomAuthConfigured()) {
    for (const event of events) {
      if (!event.zoom_meeting_id) continue;
      try {
        await deleteZoomMeeting(event.zoom_meeting_id);
        zoomDeleted += 1;
      } catch (error) {
        zoomErrors.push({
          meetingId: event.zoom_meeting_id,
          title: event.title,
          message: error.message,
        });
      }
    }
  } else if (events.some((e) => e.zoom_meeting_id)) {
    zoomErrors.push({
      meetingId: null,
      title: null,
      message: 'Zoom OAuth is not configured — linked Zoom meetings were not deleted.',
    });
  }

  const webinarOrderIds = await applyWebinarOrderFilter(
    db.withSchema(DB_SCHEMA).from('orders').join('plans', 'plans.id', 'orders.plan_id')
  )
    .andWhereNot('orders.status', 'paid')
    .select('orders.id');

  const ids = webinarOrderIds.map((r) => r.id);
  let deletedOrders = 0;
  if (ids.length) {
    await table('payments').whereIn('order_id', ids).del();
    deletedOrders = await table('orders').whereIn('id', ids).del();
  }

  const deletedEvents = await table('webinar_events').del();
  if (deletedEvents) clearWebinarLiveCache();
  let deletedWaitlist = 0;
  try {
    deletedWaitlist = await table('webinar_waitlist').del();
  } catch {
    deletedWaitlist = 0;
  }

  return {
    deletedOrders: Number(deletedOrders) || ids.length,
    deletedEvents: Number(deletedEvents) || 0,
    deletedWaitlist: Number(deletedWaitlist) || 0,
    zoomDeleted,
    zoomErrors,
  };
}

export { serializeEvent };
