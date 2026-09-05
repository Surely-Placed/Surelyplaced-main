// Enrollment requests webhook — paste into Apps Script on the ENROLLMENT spreadsheet only.
// Deploy → Web app → Anyone → copy /exec URL into GOOGLE_SHEETS_WEBHOOK_URL

var SPREADSHEET_ID = '1-hfCSO9-iY4IwYCuH54Ng6xdxFfPYAIX4_Bxd1tT8Fo';
var SHEET_NAME = 'Enrollment Requests';
var HEADERS = [
  'full_name',
  'email',
  'whatsapp',
  'visa_status',
  'months_of_authorization_left',
  'created_at'
];

function getTargetSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
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

function appendEnrollmentRow(sheet, row) {
  row = row || {};
  sheet.appendRow([
    String(row.full_name || row.fullName || '').trim(),
    String(row.email || '').trim(),
    formatPhoneCell(row.whatsapp || row.phone),
    String(row.visa_status || row.visaStatus || '').trim(),
    String(row.months_of_authorization_left || row.monthsOfAuthorizationLeft || '').trim(),
    String(row.created_at || row.createdAt || '').trim()
  ]);
}

function doPost(e) {
  var sheet = getTargetSheet();
  ensureHeaders(sheet);

  var parsed = JSON.parse(e.postData.contents || '{}');
  var rows = Array.isArray(parsed) ? parsed : [parsed];
  var i;

  for (i = 0; i < rows.length; i++) {
    appendEnrollmentRow(sheet, rows[i] || {});
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
      sheetName: SHEET_NAME,
      message: 'Surely Placed enrollment webhook is live. Use POST.'
    })
  ).setMimeType(ContentService.MimeType.JSON);
}
