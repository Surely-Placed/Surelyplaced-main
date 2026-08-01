// Surely Placed webinar registration webhook — paste ALL of this into Apps Script Code.gs

var SPREADSHEET_ID = '1Sn9xyPaiuRlj38nMPhtU0B6j40kDgHMgsCb_QqvdHt0';
var SHEET_NAME = 'Webinar Registrations';
var HEADERS = [
  'Full Name',
  'Email',
  'Phone',
  'Country',
  'Current Status',
  'Visa Status',
  'Year Of Experience'
];

function getTargetSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(SHEET_NAME) || ss.getActiveSheet();
}

function ensureHeaders(sheet) {
  var a1 = String(sheet.getRange(1, 1).getValue() || '').trim();
  if (a1) {
    return;
  }
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
}

function formatPhoneCell(raw) {
  var phone = String(raw || '').trim();
  if (!phone) {
    return '';
  }
  return "'" + phone.replace(/^'/, '');
}

function normalizeRow(row) {
  row = row || {};
  var isFull =
    row.fullName !== undefined ||
    row.phone !== undefined ||
    row.country !== undefined ||
    row.currentStatus !== undefined ||
    row.visaStatus !== undefined ||
    row.yearOfExperience !== undefined;

  if (isFull) {
    return {
      fullName: String(row.fullName || '').trim(),
      email: String(row.email || '').trim(),
      phone: formatPhoneCell(row.phone),
      country: String(row.country || '').trim(),
      currentStatus: String(row.currentStatus || '').trim(),
      visaStatus: String(row.visaStatus || '').trim(),
      yearOfExperience: String(row.yearOfExperience || '').trim()
    };
  }

  return {
    fullName: String(row.name || row.fullName || '').trim(),
    email: String(row.email || '').trim(),
    phone: formatPhoneCell(row.contact || row.phone),
    country: '',
    currentStatus: '',
    visaStatus: '',
    yearOfExperience: ''
  };
}

function appendRegistrantRow(sheet, row) {
  var normalized = normalizeRow(row);
  sheet.appendRow([
    normalized.fullName,
    normalized.email,
    normalized.phone,
    normalized.country,
    normalized.currentStatus,
    normalized.visaStatus,
    normalized.yearOfExperience
  ]);
}

function doPost(e) {
  var sheet = getTargetSheet();
  ensureHeaders(sheet);

  var parsed = JSON.parse(e.postData.contents || '{}');
  var rows = Array.isArray(parsed) ? parsed : [parsed];
  var i;

  for (i = 0; i < rows.length; i++) {
    appendRegistrantRow(sheet, rows[i] || {});
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(
    ContentService.MimeType.JSON
  );
}

function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({
      ok: true,
      spreadsheetId: SPREADSHEET_ID,
      message: 'Surely Placed webinar registration webhook is live. Use POST.'
    })
  ).setMimeType(ContentService.MimeType.JSON);
}
