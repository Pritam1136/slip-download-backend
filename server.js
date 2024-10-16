const express = require("express");
const cors = require("cors");
const path = require("path");
const { SendOtp, verifyOtp, SheetData } = require("./MethodHandler/Handler");
const cron = require("node-cron");
const { checkAndSendEmails } = require("./MethodHandler/CheckAndSendEmails");

const app = express();
const port = 5000;

app.use(express.json());
app.use(cors());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "../client/dist")));

// Send OTP to email
app.post("/api/send-otp", SendOtp);

// Verify OTP and return JWT token
app.post("/api/verify-otp", verifyOtp);

// Protected route
app.get("/api/sheet-data", SheetData);

// Serve React app for any other route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
});

// Schedule the task to run at the start of every month
cron.schedule("0 8 * * *", () => {
  console.log("Running salary email check for the month...");
  checkAndSendEmails();
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
