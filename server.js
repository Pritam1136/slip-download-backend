// server.js
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const { getSpreadSheetValues } = require("./googleSheetsService");
const dotenv = require("dotenv");

const app = express();
const port = 5000;
app.use(express.json());
app.use(cors());
dotenv.config();

const secretKey = process.env.SECRET_KEY;
let otpStore = {};

// Send OTP to email
app.post("/api/send-otp", (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 90000000); // Generate 8-digit OTP
  otpStore[email] = otp;

  // Create transporter for nodemailer
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Send email
  const mailOptions = {
    from: "pritamroy1136@gmail.com",
    to: email,
    subject: "Your OTP Code",
    text: `OTP Verification
  Your OTP code is ${otp}
    
  Please use this code to verify your account.
    
  If you did not request this OTP, please ignore this email. `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json({ message: "Error sending OTP" });
    }
    res.status(200).json({ message: "OTP sent to your email" });
  });
});

// Verify OTP and return JWT token
app.post("/api/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (otpStore[email] && otpStore[email] == otp) {
    // OTP is correct, generate a JWT token
    const token = jwt.sign({ email }, secretKey, { expiresIn: "1h" });
    delete otpStore[email]; // Clear OTP after successful login
    return res.status(200).json({ token });
  } else {
    return res.status(401).json({ message: "Invalid OTP" });
  }
});

// Protected route
app.get("/api/sheet-data", async (req, res) => {
  const { spreadsheetId, sheetName } = req.query;
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    const data = await getSpreadSheetValues({ spreadsheetId, sheetName });

    const filteredData = data.filter((row) => row[3] === decoded.email);
    res.json(filteredData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching data" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
