const { google } = require("googleapis");
const sheets = google.sheets("v4");
const dotenv = require("dotenv");

dotenv.config();

async function getAuthToken() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      type: process.env.GOOGLE_SERVICE_ACCOUNT_TYPE,
      project_id: process.env.GOOGLE_SERVICE_ACCOUNT_PROJECT_ID,
      private_key_id: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(
        /\\n/g,
        "\n"
      ),
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_ID,
      auth_uri: process.env.GOOGLE_SERVICE_ACCOUNT_AUTH_URI,
      token_uri: process.env.GOOGLE_SERVICE_ACCOUNT_TOKEN_URI,
      auth_provider_x509_cert_url:
        process.env.GOOGLE_SERVICE_ACCOUNT_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url:
        process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_X509_CERT_URL,
    },
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
    console.error("Error fetching data:", error);
    throw new Error("Error fetching data");
  }
}

module.exports = { getSpreadSheetValues };
