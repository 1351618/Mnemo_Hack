function getOrCreateSettingsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("settings");
  if (!sheet) {
    sheet = ss.insertSheet("settings");
    sheet.appendRow(["lang-native", ""]);
    sheet.appendRow(["lang-1", ""]);
    sheet.appendRow(["lang-2", ""]);
  }
  return sheet;
}

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // данные
  const dataSheet = ss.getSheets()[0];
  const data = dataSheet.getDataRange().getValues();

  // настройки
  const settingsSheet = getOrCreateSettingsSheet();
  const settings = settingsSheet.getDataRange().getValues();

  return ContentService.createTextOutput(
    JSON.stringify({ data, settings }),
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const params = JSON.parse(e.postData.contents);

  if (params.action === "update") {
    const sheet = ss.getSheets()[0];
    sheet.getRange(params.row, 1).setValue(params.interval);
    sheet.getRange(params.row, 2).setValue(params.date);
    sheet.getRange(params.row, params.col).setValue(params.value);
  }

  if (params.action === "add") {
    const sheet = ss.getSheets()[0];
    sheet.appendRow(params.data);
  }

  if (params.action === "save-settings") {
    const sheet = getOrCreateSettingsSheet();
    sheet.getRange(1, 2).setValue(params["lang-native"]);
    sheet.getRange(2, 2).setValue(params["lang-1"]);
    sheet.getRange(3, 2).setValue(params["lang-2"]);
  }

  if (params.action === "update-known") {
    const sheet = ss.getSheets()[0];
    const data = sheet.getDataRange().getValues();

    params.data.forEach((word) => {
      const rowIndex = data.findIndex((r) => r[6] === word.number);
      if (rowIndex === -1) return;
      const row = rowIndex + 1;
      sheet.getRange(row, 4).setValue(word.knownCode);
      sheet.getRange(row, 6).setValue(word.knownNum);
      sheet.getRange(row, 8).setValue(word.knownLang0);
      sheet.getRange(row, 10).setValue(word.knownLang1);
      sheet.getRange(row, 12).setValue(word.knownLang2);
    });
  }

  return ContentService.createTextOutput("OK");
}
