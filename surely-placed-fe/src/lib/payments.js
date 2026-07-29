const PAYMENTS_API_URL =
  process.env.NEXT_PUBLIC_PAYMENTS_API_URL || process.env.PAYMENTS_API_URL || 'http://localhost:8080';

function getPaymentsApiUrl() {
  return PAYMENTS_API_URL.replace(/\/$/, '');
}

function buildHeaders(idempotencyKey) {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }
  return headers;
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Payments API error (${response.status})`);
  }
  return data;
}

export async function createPaymentOrder(payload, idempotencyKey) {
  const response = await fetch(`${getPaymentsApiUrl()}/api/payments/orders`, {
    method: 'POST',
    headers: buildHeaders(idempotencyKey),
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function verifyPayment(payload, idempotencyKey) {
  const response = await fetch(`${getPaymentsApiUrl()}/api/payments/verify`, {
    method: 'POST',
    headers: buildHeaders(idempotencyKey),
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function getPaymentOrder(orderId) {
  const response = await fetch(`${getPaymentsApiUrl()}/api/payments/orders/${orderId}`);
  return parseResponse(response);
}

export async function getActiveWebinarPublic() {
  const response = await fetch(`${getPaymentsApiUrl()}/api/webinars/active`, {
    cache: 'no-store',
  });
  return parseResponse(response);
}

export async function registerForWebinar({ name, email, contact, registration }) {
  const response = await fetch(`${getPaymentsApiUrl()}/api/webinars/register`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ name, email, contact, registration }),
  });
  return parseResponse(response);
}

export async function joinWebinarWaitlist({ name, email, contact }) {
  const response = await fetch(`${getPaymentsApiUrl()}/api/webinars/waitlist`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ name, email, contact }),
  });
  return parseResponse(response);
}

export async function claimWebinarJoinAccess({ token, deviceId, email, otp }) {
  const response = await fetch(`${getPaymentsApiUrl()}/api/webinars/join`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ token, deviceId, email, otp }),
  });
  return parseResponse(response);
}

export async function requestWebinarJoinOtp({ token, email, deviceId }) {
  const response = await fetch(`${getPaymentsApiUrl()}/api/webinars/join/request-otp`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ token, email, deviceId }),
  });
  return parseResponse(response);
}

export { getPaymentsApiUrl };
