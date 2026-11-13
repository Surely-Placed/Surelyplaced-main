function formatIcsUtc(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function escapeIcsText(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * @param {object} opts
 * @param {string} opts.uid
 * @param {string} opts.title
 * @param {string|Date} opts.startIso
 * @param {number} opts.durationMinutes
 * @param {string} [opts.description]
 * @param {string} [opts.location]
 */
export function buildIcsEvent({
  uid,
  title,
  startIso,
  durationMinutes = 30,
  description = '',
  location = '',
}) {
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) {
    throw new Error('Invalid start time for calendar invite');
  }
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const dtStamp = formatIcsUtc(new Date());
  const dtStart = formatIcsUtc(start);
  const dtEnd = formatIcsUtc(end);

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Surely Placed//Book a Call//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${escapeIcsText(uid)}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(title)}`,
    description ? `DESCRIPTION:${escapeIcsText(description)}` : null,
    location ? `LOCATION:${escapeIcsText(location)}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

export function buildGoogleCalendarUrlFromIso({
  title,
  startIso,
  durationMinutes = 30,
  description = '',
  location = '',
}) {
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) {
    return null;
  }
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const formatGCal = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

  const text = encodeURIComponent(title || 'Surely Placed — Strategy Call');
  const dates = `${formatGCal(start)}/${formatGCal(end)}`;
  const details = encodeURIComponent(description);
  const loc = encodeURIComponent(location || '');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${loc}`;
}

export function formatPreferredCallLabel(preferredDatetime, timezoneLabel) {
  const when = new Date(preferredDatetime);
  if (Number.isNaN(when.getTime())) {
    return timezoneLabel || '';
  }
  const formatted = when.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  });
  return timezoneLabel ? `${formatted} (${timezoneLabel})` : formatted;
}
