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

    // Fetch the employee master data (data1)
    const employeeData = await getSpreadSheetValues({
      spreadsheetId: process.env.SPREADSHEETID1,
      sheetName: process.env.SHEETNAME,
    });

    const employeeHeaders = employeeData[0];
    const employeeRows = employeeData.slice(1);

    for (const month of months) {
      try {
        // Fetch salary-related data for the month
        const salaryData = await getSpreadSheetValues({
          spreadsheetId: process.env.SPREADSHEETID2,
          sheetName: month,
        });

        if (salaryData.length > 0) {
          const salaryHeaders = salaryData[0];
          const salaryRows = salaryData.slice(1);

          // Filter salary and employee data for the specific user
          const userSalaryData = salaryRows.filter(
            (row) => row[salaryHeaders.indexOf("EmployeId")] === decoded.userId
          );
          const userEmployeeData = employeeRows.filter(
            (row) =>
              row[employeeHeaders.indexOf("EmployeId")] === decoded.userId
          );

          if (userSalaryData.length > 0 && userEmployeeData.length > 0) {
            const employeeDetails = userEmployeeData[0]; // Assuming a single row per employee

            userSalaryData.forEach((salaryRow) => {
              const formattedRow = Array(24).fill(null); // Initialize array for 24 fields

              formattedRow[0] =
                employeeDetails[employeeHeaders.indexOf("EmployeId")]; // employeeId
              formattedRow[3] =
                employeeDetails[employeeHeaders.indexOf("Name")]; // employee name
              formattedRow[4] =
                employeeDetails[employeeHeaders.indexOf("Designation")]; // designation
              formattedRow[5] =
                employeeDetails[employeeHeaders.indexOf("Departmant")]; // department
              formattedRow[6] =
                employeeDetails[employeeHeaders.indexOf("Date of Joining")]; // date of joining
              formattedRow[11] =
                employeeDetails[employeeHeaders.indexOf("Banc name")]; // bank name
              formattedRow[12] =
                employeeDetails[employeeHeaders.indexOf("Bank  acc no")]; // bank A/C number
              formattedRow[13] =
                employeeDetails[employeeHeaders.indexOf("Pan no")]; // PAN number

              formattedRow[1] = month;
              formattedRow[2] = salaryRow[salaryHeaders.indexOf("Year")]; // year
              formattedRow[7] = salaryRow[salaryHeaders.indexOf("UAN")]; // UAN
              formattedRow[8] =
                salaryRow[salaryHeaders.indexOf("Total working Days")]; // total working days
              formattedRow[9] = salaryRow[salaryHeaders.indexOf("LOP Days")]; // LOP days
              formattedRow[10] = salaryRow[salaryHeaders.indexOf("Paid Days")]; // paid days
              formattedRow[14] = salaryRow[salaryHeaders.indexOf("Basic")]; // Basic
              formattedRow[15] = salaryRow[salaryHeaders.indexOf("Har")]; // HRA
              formattedRow[16] =
                salaryRow[salaryHeaders.indexOf("Other allowance")]; // other allowance
              formattedRow[17] = salaryRow[salaryHeaders.indexOf("EPF")]; // EPF
              formattedRow[18] =
                salaryRow[salaryHeaders.indexOf("Professional Tax")]; // Professional tax
              formattedRow[19] =
                salaryRow[salaryHeaders.indexOf("Health Insurance")]; // Health insurance
              formattedRow[20] = salaryRow[salaryHeaders.indexOf("TDS")]; // TDS
              formattedRow[21] =
                salaryRow[salaryHeaders.indexOf("Gross salary")]; // gross salary
              formattedRow[22] =
                salaryRow[salaryHeaders.indexOf("Reimbursement")]; // Reimbursement
              formattedRow[23] = salaryRow[salaryHeaders.indexOf("Net pay")]; // Net pay

              allFilteredData.push(formattedRow);
            });
          }
        }
      } catch (err) {
        console.log(
          `Sheet for ${month} does not exist or error: ${err.message}`
        );
      }
    }

    if (allFilteredData.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }

    console.log(allFilteredData);
    res.json(allFilteredData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching data" });
  }
};

module.exports = { SendOtp, verifyOtp, SheetData };
