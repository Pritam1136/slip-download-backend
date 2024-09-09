// googleSheetsService.js
const { google } = require("googleapis");
const sheets = google.sheets("v4");

async function getAuthToken() {
  const auth = new google.auth.GoogleAuth({
    keyFile: "./salary-slip-download.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return await auth.getClient();
}

async function getSpreadSheetValues({ spreadsheetId, sheetName }) {
  try {
    const auth = await getAuthToken();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetName,
      auth,
    });
    return response.data.values;
  } catch (error) {
    console.error("Error fetching data from Google Sheets:", error);
    throw error;
  }
}

module.exports = { getSpreadSheetValues };
