// server.js
const express = require("express");
const cors = require("cors");
const { SendOtp, verifyOtp, SheetData } = require("./MethodHandler/Handler");
const cron = require("node-cron");

const app = express();
const port = 5000;
app.use(express.json());
app.use(cors());

// Send OTP to email
app.post("/api/send-otp", SendOtp);

// Verify OTP and return JWT token
app.post("/api/verify-otp", verifyOtp);

// Protected route
app.get("/api/sheet-data", SheetData);

cron.schedule("10 * * * * *", () => {
  console.log("running a task every minute");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
