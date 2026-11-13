import { config } from '../config.js';

const ZOOM_TOKEN_URL = 'https://zoom.us/oauth/token';
const ZOOM_API_BASE = 'https://api.zoom.us/v2';

let cachedToken = null;
let cachedTokenExpiresAt = 0;

/** Env Meeting ID fallback (optional once admin dashboard creates meetings). */
export function getZoomMeetingId() {
  return config.zoom.meetingId || config.zoom.webinarId || '';
}

/** Zoom OAuth credentials only (meeting created from admin dashboard). */
export function isZoomAuthConfigured() {
  return Boolean(config.zoom.accountId && config.zoom.clientId && config.zoom.clientSecret);
}

export function isZoomConfigured() {
  return isZoomAuthConfigured() && Boolean(getZoomMeetingId());
}

export function splitFullName(fullName) {
  const parts = String(fullName || 'Guest')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const firstName = parts[0] || 'Guest';
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : firstName;
  return { firstName, lastName };
}

/**
 * Force Zoom Web Client (browser) — never the desktop/mobile app deep link.
 * By default STRIPS registrant `tk` so the buyer must sign into Zoom with the
 * same email they paid/registered with. Unique tk links would bypass that check.
 */
export function toZoomWebClientJoinUrl(joinUrl, { requireSignedInRegistrant = true } = {}) {
  if (!joinUrl) return null;
  try {
    const url = new URL(String(joinUrl));
    const pwd = url.searchParams.get('pwd') || '';
    const tk = url.searchParams.get('tk') || '';

    const idMatch =
      url.pathname.match(/\/(?:j|w|wc\/join)\/(\d+)/i) ||
      url.pathname.match(/\/(\d{9,})(?:\/|$)/);
    const meetingId = idMatch?.[1];
    if (!meetingId) return String(joinUrl);

    // Always use web client path (browser), not /j/ or /w/ which prompt the app
    const web = new URL(`https://${url.host}/wc/join/${meetingId}`);
    if (pwd) web.searchParams.set('pwd', pwd);
    // Omit tk so Zoom requires sign-in as an approved registrant email
    if (!requireSignedInRegistrant && tk) {
      web.searchParams.set('tk', tk);
    }
    web.searchParams.set('fromPWA', '1');
    return web.toString();
  } catch {
    return String(joinUrl);
  }
}

async function getAccessToken() {
  if (cachedToken && Date.now() < cachedTokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const basic = Buffer.from(`${config.zoom.clientId}:${config.zoom.clientSecret}`).toString(
    'base64'
  );
  const url = `${ZOOM_TOKEN_URL}?grant_type=account_credentials&account_id=${encodeURIComponent(
    config.zoom.accountId
  )}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.reason || body?.error || response.statusText;
    throw new Error(`Zoom OAuth failed (${response.status}): ${message}`);
  }

  cachedToken = body.access_token;
  cachedTokenExpiresAt = Date.now() + (Number(body.expires_in) || 3600) * 1000;
  return cachedToken;
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function clearZoomTokenCache() {
  cachedToken = null;
  cachedTokenExpiresAt = 0;
}

function formatZoomDeleteError(status, body) {
  const message = body?.message || body?.reason || body?.error || `HTTP ${status}`;
  if (/does not contain scopes/i.test(String(message)) && /delete/i.test(String(message))) {
    return (
      'Zoom OAuth app is missing delete permission. In Zoom Marketplace → your Server-to-Server OAuth app → Scopes, add meeting:delete:meeting:admin, activate/save the app, then delete again. ' +
      `(${message})`
    );
  }
  return `Zoom meeting delete failed (${status}): ${message}`;
}

/**
 * Register a paid attendee on a Zoom Pro Meeting (registration required).
 * Uses Meeting registrant API — no Webinar add-on needed.
 * Returns { registrantId, joinUrl, meetingId, topic, startTime }.
 */
export async function addMeetingRegistrant({
  email,
  firstName,
  lastName,
  meetingId,
}) {
  const resolvedMeetingId = meetingId || getZoomMeetingId();
  if (!isZoomAuthConfigured()) {
    throw new Error('Zoom is not configured (missing ZOOM_ACCOUNT_ID / CLIENT_ID / CLIENT_SECRET)');
  }
  if (!resolvedMeetingId) {
    throw new Error('No Zoom meeting ID — create a webinar from the admin dashboard');
  }
  if (!email) {
    throw new Error('Email is required for Zoom registration');
  }

  const token = await getAccessToken();
  const url = `${ZOOM_API_BASE}/meetings/${encodeURIComponent(resolvedMeetingId)}/registrants`;

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: String(email).trim().toLowerCase(),
          first_name: firstName,
          last_name: lastName,
          auto_approve: true,
        }),
      });

      const body = await response.json().catch(() => ({}));

      if (response.status === 201 || response.ok) {
        let joinUrl = body.join_url || null;
        const registrantId = body.registrant_id;

        // If Zoom left them pending (manual approval meetings), approve explicitly
        if (registrantId && !joinUrl) {
          try {
            joinUrl = await approveMeetingRegistrant({
              meetingId: resolvedMeetingId,
              registrantId,
              token,
            });
          } catch (approveErr) {
            console.error('Zoom registrant approve failed:', approveErr.message);
          }
        }

        if (!joinUrl) {
          throw new Error(
            'Zoom registration succeeded but no join_url was returned. Check meeting registration settings.'
          );
        }

        return {
          registrantId,
          joinUrl,
          meetingId: body.id || resolvedMeetingId,
          topic: body.topic,
          startTime: body.start_time,
        };
      }

      if (response.status === 429 || response.status >= 500) {
        lastError = new Error(
          `Zoom meeting registrant API ${response.status}: ${body?.message || body?.error || response.statusText}`
        );
        await sleep(400 * attempt);
        continue;
      }

      throw new Error(
        `Zoom meeting registrant API ${response.status}: ${body?.message || JSON.stringify(body)}`
      );
    } catch (err) {
      lastError = err;
      if (attempt < 3 && /fetch|network|ECONNRESET|ETIMEDOUT/i.test(String(err?.message))) {
        await sleep(400 * attempt);
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('Zoom meeting registration failed');
}

async function approveMeetingRegistrant({ meetingId, registrantId, token }) {
  const response = await fetch(
    `${ZOOM_API_BASE}/meetings/${encodeURIComponent(meetingId)}/registrants/status`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'approve',
        registrants: [{ id: registrantId }],
      }),
    }
  );

  if (!response.ok && response.status !== 204) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      `Zoom approve registrant failed (${response.status}): ${body?.message || response.statusText}`
    );
  }

  // Re-fetch registrant for join_url
  const listRes = await fetch(
    `${ZOOM_API_BASE}/meetings/${encodeURIComponent(meetingId)}/registrants/${encodeURIComponent(registrantId)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const listBody = await listRes.json().catch(() => ({}));
  if (listRes.ok && listBody?.join_url) return listBody.join_url;
  return null;
}

/**
 * Create a Zoom Pro Meeting with registration required (manual approval on Zoom UI).
 * Paid users are registered via API with auto_approve + unique join_url only.
 */
export async function createRegistrationMeeting({
  topic,
  startTimeIso,
  durationMinutes = 90,
  timezone = 'America/New_York',
  seatsTotal,
}) {
  if (!isZoomAuthConfigured()) {
    throw new Error('Zoom OAuth is not configured');
  }

  const token = await getAccessToken();
  const settings = {
    host_video: true,
    participant_video: false,
    // Attendees cannot join until the host starts the meeting
    join_before_host: false,
    mute_upon_entry: true,
    waiting_room: true,
    // Registration required + Zoom sign-in required.
    // Customers get browser join WITHOUT registrant tk, so they must sign into Zoom
    // with the same email we registered via API after payment.
    approval_type: 1,
    registration_type: 1,
    registrants_confirmation_email: false,
    meeting_authentication: true,
    allow_multiple_devices: false,
  };

  const total = Number(seatsTotal);
  if (Number.isFinite(total) && total > 0) {
    settings.registrants_restrict_number = total;
  }

  const response = await fetch(`${ZOOM_API_BASE}/users/me/meetings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic: topic || 'Surely Placed Live Webinar',
      type: 2,
      start_time: startTimeIso,
      duration: durationMinutes,
      timezone,
      settings,
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `Zoom create meeting failed (${response.status}): ${body?.message || JSON.stringify(body)}`
    );
  }

  return {
    meetingId: String(body.id),
    startUrl: body.start_url || null,
    joinUrl: body.join_url || null,
    topic: body.topic,
    startTime: body.start_time,
  };
}

/**
 * One-off consultation / book-a-call meeting (no registrant API).
 */
export async function createConsultationMeeting({
  topic,
  startTimeIso,
  durationMinutes = 30,
  timezone = 'UTC',
}) {
  if (!isZoomAuthConfigured()) {
    throw new Error('Zoom OAuth is not configured');
  }

  const token = await getAccessToken();
  const response = await fetch(`${ZOOM_API_BASE}/users/me/meetings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic: topic || 'Surely Placed — Strategy Call',
      type: 2,
      start_time: startTimeIso,
      duration: durationMinutes,
      timezone: timezone || 'UTC',
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        waiting_room: true,
        approval_type: 2,
        auto_recording: 'none',
      },
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `Zoom create consultation meeting failed (${response.status}): ${body?.message || JSON.stringify(body)}`
    );
  }

  return {
    meetingId: String(body.id),
    startUrl: body.start_url || null,
    joinUrl: body.join_url || null,
    topic: body.topic,
    startTime: body.start_time,
  };
}

export class ZoomMeetingNotFoundError extends Error {
  constructor(meetingId, detail = '') {
    super(`Zoom meeting deleted or not found: ${meetingId}${detail ? ` (${detail})` : ''}`);
    this.name = 'ZoomMeetingNotFoundError';
    this.code = 'ZOOM_MEETING_NOT_FOUND';
    this.meetingId = String(meetingId);
    this.statusCode = 404;
  }
}

export function isZoomMeetingNotFoundError(error) {
  if (!error) return false;
  if (error.code === 'ZOOM_MEETING_NOT_FOUND' || error.name === 'ZoomMeetingNotFoundError') {
    return true;
  }
  const msg = String(error.message || '');
  return (
    /\b404\b/.test(msg) &&
    /meeting/i.test(msg) &&
    /not found|does not exist|deleted/i.test(msg)
  ) || /\b3001\b/.test(msg);
}

/** Fetch Zoom meeting start time + registration cap. */
export async function getMeetingLiveStatus(meetingId) {
  if (!isZoomAuthConfigured() || !meetingId) {
    return null;
  }

  const token = await getAccessToken();
  const meetingRes = await fetch(`${ZOOM_API_BASE}/meetings/${encodeURIComponent(meetingId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meeting = await meetingRes.json().catch(() => ({}));
  if (!meetingRes.ok) {
    // Zoom uses 404 / code 3001 when a meeting was deleted in the Zoom dashboard
    if (meetingRes.status === 404 || meeting?.code === 3001) {
      throw new ZoomMeetingNotFoundError(meetingId, meeting?.message || meetingRes.statusText);
    }
    throw new Error(
      `Zoom get meeting failed (${meetingRes.status}): ${meeting?.message || meetingRes.statusText}`
    );
  }

  let registrantCount = 0;
  let nextPageToken = '';
  do {
    const qs = new URLSearchParams({ page_size: '300', status: 'approved' });
    if (nextPageToken) qs.set('next_page_token', nextPageToken);
    const regRes = await fetch(
      `${ZOOM_API_BASE}/meetings/${encodeURIComponent(meetingId)}/registrants?${qs}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const regBody = await regRes.json().catch(() => ({}));
    if (!regRes.ok) {
      throw new Error(
        `Zoom registrants failed (${regRes.status}): ${regBody?.message || regRes.statusText}`
      );
    }
    if (typeof regBody.total_records === 'number' && !nextPageToken) {
      registrantCount = regBody.total_records;
      break;
    }
    registrantCount += Array.isArray(regBody.registrants) ? regBody.registrants.length : 0;
    nextPageToken = regBody.next_page_token || '';
  } while (nextPageToken);

  const restrict = Number(meeting?.settings?.registrants_restrict_number) || null;

  return {
    meetingId: String(meeting.id || meetingId),
    topic: meeting.topic || null,
    startTime: meeting.start_time || null,
    timezone: meeting.timezone || null,
    duration: meeting.duration || null,
    registrantCount,
    seatsTotal: restrict && restrict > 0 ? restrict : null,
  };
}

/** Push seat cap + host-gate settings into Zoom. */
export async function updateMeetingRegistrationCap(meetingId, seatsTotal) {
  if (!isZoomAuthConfigured() || !meetingId) return;
  const total = Number(seatsTotal);
  if (!Number.isFinite(total) || total < 1) return;

  const token = await getAccessToken();
  const response = await fetch(`${ZOOM_API_BASE}/meetings/${encodeURIComponent(meetingId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      settings: {
        registrants_restrict_number: total,
        approval_type: 1,
        join_before_host: false,
        waiting_room: true,
        registrants_confirmation_email: false,
        meeting_authentication: true,
        allow_multiple_devices: false,
      },
    }),
  });

  if (!response.ok && response.status !== 204) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 404 || body?.code === 3001) {
      throw new ZoomMeetingNotFoundError(meetingId, body?.message || response.statusText);
    }
    throw new Error(
      `Zoom update meeting failed (${response.status}): ${body?.message || response.statusText}`
    );
  }
}

/** Ensure attendees cannot join before the host starts. */
export async function ensureMeetingHostGate(meetingId) {
  if (!isZoomAuthConfigured() || !meetingId) return;

  const token = await getAccessToken();
  const response = await fetch(`${ZOOM_API_BASE}/meetings/${encodeURIComponent(meetingId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      settings: {
        join_before_host: false,
        waiting_room: true,
        approval_type: 1,
        registrants_confirmation_email: false,
        meeting_authentication: true,
        allow_multiple_devices: false,
      },
    }),
  });

  if (!response.ok && response.status !== 204) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 404 || body?.code === 3001) {
      throw new ZoomMeetingNotFoundError(meetingId, body?.message || response.statusText);
    }
    throw new Error(
      `Zoom host-gate update failed (${response.status}): ${body?.message || response.statusText}`
    );
  }
}

/** Delete a Zoom meeting. Ignores already-deleted meetings. */
export async function deleteZoomMeeting(meetingId, { retried = false } = {}) {
  if (!isZoomAuthConfigured() || !meetingId) return { deleted: false };

  const normalizedId = String(meetingId).replace(/\s+/g, '');
  const token = await getAccessToken();
  const response = await fetch(`${ZOOM_API_BASE}/meetings/${encodeURIComponent(normalizedId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok || response.status === 204 || response.status === 404) {
    try {
      await getMeetingLiveStatus(normalizedId);
      throw new Error(
        `Zoom meeting ${normalizedId} still exists after delete. Confirm meeting:delete:meeting:admin is enabled on your Zoom OAuth app.`
      );
    } catch (error) {
      if (isZoomMeetingNotFoundError(error)) {
        return { deleted: true, meetingId: normalizedId };
      }
      // DELETE succeeded — do not block on transient verification errors.
      if (response.ok || response.status === 204 || response.status === 404) {
        return { deleted: true, meetingId: normalizedId };
      }
      throw error;
    }
  }

  const body = await response.json().catch(() => ({}));
  if (body?.code === 3001) {
    return { deleted: true, meetingId: normalizedId };
  }

  const errMessage = formatZoomDeleteError(response.status, body);
  if (!retried && /does not contain scopes/i.test(String(body?.message || ''))) {
    clearZoomTokenCache();
    return deleteZoomMeeting(normalizedId, { retried: true });
  }

  throw new Error(errMessage);
}

/**
 * Remove a meeting registrant (cleanup / refund / ops delete).
 * Tries DELETE first, then cancel via status API if scopes lack delete.
 */
export async function deleteMeetingRegistrant({ meetingId, registrantId }) {
  if (!isZoomAuthConfigured()) {
    throw new Error('Zoom is not configured');
  }
  if (!meetingId || !registrantId) {
    throw new Error('meetingId and registrantId are required');
  }

  const token = await getAccessToken();
  const deleteRes = await fetch(
    `${ZOOM_API_BASE}/meetings/${encodeURIComponent(meetingId)}/registrants/${encodeURIComponent(registrantId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (deleteRes.status === 204 || deleteRes.status === 200 || deleteRes.status === 404) {
    return { deleted: deleteRes.status !== 404, method: 'delete' };
  }

  // Fallback: cancel registrant (often allowed with meeting:write scopes)
  const cancelRes = await fetch(
    `${ZOOM_API_BASE}/meetings/${encodeURIComponent(meetingId)}/registrants/status`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'cancel',
        registrants: [{ id: registrantId }],
      }),
    }
  );

  if (cancelRes.status === 204 || cancelRes.status === 200 || cancelRes.ok) {
    return { deleted: true, method: 'cancel' };
  }

  const deleteBody = await deleteRes.json().catch(() => ({}));
  const cancelBody = await cancelRes.json().catch(() => ({}));
  throw new Error(
    `Zoom remove registrant failed (delete ${deleteRes.status}: ${deleteBody?.message || deleteRes.statusText}; cancel ${cancelRes.status}: ${cancelBody?.message || cancelRes.statusText})`
  );
}

/** @deprecated Use addMeetingRegistrant — Pro plan uses Meetings, not Webinar add-on. */
export async function addWebinarRegistrant(args) {
  const result = await addMeetingRegistrant(args);
  return {
    ...result,
    webinarId: result.meetingId,
  };
}
