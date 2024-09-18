const { getSpreadSheetValues } = require("../googleSheetsService");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const secretKey = process.env.SECRET_KEY;
let otpStore = {};

const SendOtp = async (req, res) => {
  const { email } = req.body;

  if (email) {
    try {
      const data = await getSpreadSheetValues({
        spreadsheetId: process.env.SPREADSHEETID1,
        sheetName: process.env.SHEETNAME,
      });

      const userData = data.find((row) => row[2] === email);

      if (!userData) {
        return res.status(404).json({ message: "User not found" });
      }
    } catch {
      return res.status(500).json({ message: "No user with this mail" });
    }
  }

  const otp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP
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
    Your OTP code is ${otp}.
    Please use this code to verify your account.
    If you did not request this OTP, please ignore this email. `,
  };

  transporter.sendMail(mailOptions, (error, _info) => {
    if (error) {
      return res.status(500).json({ message: "Error sending OTP" });
    }
    res.status(200).json({ message: "OTP sent to your email" });
  });
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (otpStore[email] && otpStore[email] == otp) {
    try {
      const data = await getSpreadSheetValues({
        spreadsheetId: process.env.SPREADSHEETID1,
        sheetName: process.env.SHEETNAME,
      });

      const userData = data.find((row) => row[2] === email);

      if (!userData) {
        return res.status(404).json({ message: "User not found" });
      }

      const userId = userData[1];

      // OTP is correct, generate a JWT token
      const token = jwt.sign({ email, userId }, secretKey, {
        expiresIn: "1h",
      });
      delete otpStore[email]; // Clear OTP after successful login

      return res.status(200).json({ token });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error verifying OTP and fetching data" });
    }
  } else {
    return res.status(401).json({ message: "Invalid OTP" });
  }
};

const SheetData = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    const data = await getSpreadSheetValues({
      spreadsheetId: process.env.SPREADSHEETID2,
      sheetName: process.env.SHEETNAME,
    });

    const filteredData = data.filter((row) => row[0] === decoded.userId);
    filteredData.unshift(data[0]);

    res.json(filteredData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching data" });
  }
};

module.exports = { SendOtp, verifyOtp, SheetData };
