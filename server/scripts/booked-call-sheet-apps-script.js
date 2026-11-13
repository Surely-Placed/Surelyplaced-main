// Book a call webhook — paste into Apps Script on the BOOKED CALLS spreadsheet (or same workbook, new tab).
// Deploy → Web app → Anyone → copy /exec URL into BOOKED_CALL_SHEET_WEBHOOK_URL

var SPREADSHEET_ID = '1HAc4LQi_-0L1d3BCXV4bTkrsWQfA2KuUeSAU8W-VKmY';
var SHEET_NAME = 'Booked Calls';
var HEADERS = [
  'name',
  'mobile',
  'email',
  'preferred_datetime',
  'timezone',
  'query',
  'zoom_meeting_id',
  'zoom_join_url',
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

function appendBookedCallRow(sheet, row) {
  row = row || {};
  sheet.appendRow([
    String(row.name || '').trim(),
    formatPhoneCell(row.mobile || row.phone),
    String(row.email || '').trim(),
    String(row.preferred_datetime || row.preferredDatetime || '').trim(),
    String(row.timezone || '').trim(),
    String(row.query || row.message || '').trim(),
    String(row.zoom_meeting_id || row.zoomMeetingId || '').trim(),
    String(row.zoom_join_url || row.zoomJoinUrl || '').trim(),
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
    appendBookedCallRow(sheet, rows[i] || {});
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
      message: 'Surely Placed book-a-call webhook is live. Use POST.'
    })
  ).setMimeType(ContentService.MimeType.JSON);
}
