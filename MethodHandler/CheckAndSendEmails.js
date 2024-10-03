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
      <p>Net Pay: <strong>${salaryData[22]}</strong></p>
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

    // Fetch employee data from SPREADSHEETID1 (sheet with employee info)
    const employees = await getSpreadSheetValues({
      spreadsheetId: process.env.SPREADSHEETID1,
      sheetName: process.env.SHEETNAME, // Example: 'Sheet1'
    });

    for (const employee of employees) {
      const employeeId = employee[1]; // Employee ID

      // Check if the email for the current month and year has already been sent
      if (
        emailSentLog[employeeId] &&
        emailSentLog[employeeId].includes(`${currentMonth}-${currentYear}`)
      ) {
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
        if (!emailSentLog[employeeId]) {
          emailSentLog[employeeId] = [];
        }
        emailSentLog[employeeId].push(`${currentMonth}-${currentYear}`);
      }
    }
  } catch (error) {
    console.error("Error checking or sending emails:", error);
  }
}

module.exports = { checkAndSendEmails };
