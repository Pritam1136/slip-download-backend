const { getSpreadSheetValues } = require("../googleSheetsService");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

// Email log to track sent emails
let emailSentLog = {};

// Function to send salary email
async function sendSalaryMail(employee, salaryData) {
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

  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: employee[2], // Employee's email
    subject: `Salary Slip for ${salaryData[1]} ${salaryData[2]}`, // Month and Year
    html: `
      <h1>Salary Slip</h1>
      <p>Dear ${employee[0]},</p>
      <p>Your salary details for ${salaryData[1]} ${salaryData[2]} have been uploaded.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(
    `Email sent to ${employee[0]} (${employee[2]}) for ${salaryData[1]} ${salaryData[2]}`
  );
}

// Function to check and send salary emails
async function checkAndSendEmails() {
  try {
    const currentMonth = new Date().toLocaleString("default", {
      month: "short",
    }); // e.g., 'Oct'
    const currentYear = new Date().getFullYear();

    // Reset email log at the beginning of a new month
    if (!emailSentLog[currentYear]) {
      emailSentLog[currentYear] = {};
    }
    if (!emailSentLog[currentYear][currentMonth]) {
      emailSentLog[currentYear][currentMonth] = {};
    }

    // Fetch employee data from SPREADSHEETID1 (sheet with employee info)
    const employees = await getSpreadSheetValues({
      spreadsheetId: process.env.SPREADSHEETID1,
      sheetName: process.env.SHEETNAME,
    });

    employees.shift();

    for (const employee of employees) {
      const employeeId = employee[1]; // Employee ID

      // Check if the email for the current month and year has already been sent
      if (emailSentLog[currentYear][currentMonth][employeeId]) {
        continue; // Skip sending if already sent
      }

      // Fetch salary data for the current month from SPREADSHEETID2
      const salaryData = await getSpreadSheetValues({
        spreadsheetId: process.env.SPREADSHEETID2,
        sheetName: currentMonth, // e.g., 'Oct'
      });

      // Find the salary data for the specific employee
      const employeeSalaryData = salaryData.find(
        (row) => row[0] === employeeId
      );

      if (employeeSalaryData) {
        // Send the salary email
        await sendSalaryMail(employee, employeeSalaryData);

        // Track the email sent
        emailSentLog[currentYear][currentMonth][employeeId] = true;
      }
    }
  } catch (error) {
    console.error("Error checking or sending emails:", error);
  }
}

module.exports = { checkAndSendEmails };
