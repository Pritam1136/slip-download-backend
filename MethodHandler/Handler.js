const { getSpreadSheetValues } = require("../googleSheetsService");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { schema } = require("../schema/schema");
const fs = require("fs");
const path = require("path");

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

  // Send email with HTML
  const mailOptions = {
    from: "pritamroy1136@gmail.com",
    to: email,
    subject: "Your OTP Code",
    html: `
      <h1>OTP Verification</h1>
      <p>Your OTP code is <strong>${otp}</strong>.</p>
      <p>Please use this code to verify your account.</p>
      <p>If you did not request this OTP, please ignore this email.</p>
    `,
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

const mapData = (schema, employeeData, salaryData, month) => {
  const mappedData = Array(24).fill(null); // Initialize array with null values for 24 fields

  for (const key in schema) {
    const { source, key: fieldKey, index, value } = schema[key];

    // Set value based on source
    if (source === "employee") {
      mappedData[index] = employeeData ? employeeData[fieldKey] : null;
    } else if (source === "salary") {
      mappedData[index] = salaryData ? salaryData[fieldKey] : null;
    } else if (source === "static" && value === "month") {
      mappedData[index] = month;
    }
  }

  return mappedData;
};

const SheetData = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    let allFilteredData = [];

    // Fetch employee master data
    const employeeData = await getSpreadSheetValues({
      spreadsheetId: process.env.SPREADSHEETID1,
      sheetName: process.env.SHEETNAME,
    });

    // Extract employee headers and rows
    const employeeHeaders = employeeData[0];
    const employeeRows = employeeData.slice(1);

    // Load the years.json file to get all the sheet IDs for different years
    const yearsFilePath = path.join(__dirname, "../schema/years.json");
    const yearsData = JSON.parse(fs.readFileSync(yearsFilePath, "utf-8"));

    // Loop through each year in years.json
    for (const [year, spreadsheetId] of Object.entries(yearsData)) {
      console.log(`Fetching data for year: ${year}`);

      for (const month of months) {
        try {
          // Fetch salary-related data for the current month and year
          const salaryData = await getSpreadSheetValues({
            spreadsheetId: spreadsheetId,
            sheetName: month,
          });

          if (salaryData.length > 0) {
            // Extract salary headers and rows
            const salaryHeaders = salaryData[0];
            const salaryRows = salaryData.slice(1);

            // Filter data for the current user
            const userSalaryData = salaryRows.filter(
              (row) =>
                row[salaryHeaders.indexOf("EmployeId")] === decoded.userId
            );
            const userEmployeeData = employeeRows.find(
              (row) =>
                row[employeeHeaders.indexOf("EmployeId")] === decoded.userId
            );

            if (userSalaryData.length > 0 && userEmployeeData) {
              userSalaryData.forEach((salaryRow) => {
                const employeeDetails = Object.fromEntries(
                  employeeHeaders.map((header, i) => [
                    header,
                    userEmployeeData[i],
                  ])
                );
                const salaryDetails = Object.fromEntries(
                  salaryHeaders.map((header, i) => [header, salaryRow[i]])
                );

                const mappedRow = mapData(
                  schema,
                  employeeDetails,
                  salaryDetails,
                  month
                );
                allFilteredData.push(mappedRow);
              });
            }
          }
        } catch (err) {
          console.log(
            `Sheet for ${month} in year ${year} does not exist or error: ${err.message}`
          );
        }
      }
    }

    if (allFilteredData.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }

    res.json(allFilteredData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching data" });
  }
};

module.exports = { SendOtp, verifyOtp, SheetData };
// "build": "cd ../client && npm install && npm run build"
