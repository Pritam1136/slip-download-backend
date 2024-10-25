const { getSpreadSheetValues } = require("../googleSheetsService");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

let emailSentLog = {};

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

  const imageSrc =
    "https://media.licdn.com/dms/image/v2/C4D0BAQH6fJz1s57_eA/company-logo_200_200/company-logo_200_200/0/1630509348990/forwardcode_techstudio_logo?e=1736985600&v=beta&t=nlMSUu3V4zzN6zA9rlbOjdJE7IdnugYYZniJ09UTlNo";

  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: employee[2], // Employee's email
    subject: `Salary Slip for ${salaryData[1]} ${salaryData[2]}`, // Month and Year
    html: `
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
        <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 2rem auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 20px; background-color: #ffffff; text-align: center;">
              <img src="${imageSrc}" alt="Company Logo" style="width: 100px; height: 100px; margin-bottom: 1rem;" />
              <h2 style="margin: 0; color: #333;">Salary Slip</h2>
            </td>
          </tr>
          <!-- Greeting and Message -->
          <tr>
            <td style="padding: 20px; background-color: #a651eb; color: white; text-align: center;">
              <h3 style="margin: 0;">Salary for ${salaryData[1]} ${salaryData[2]}</h3>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px;">
              <p style="font-size: 16px; color: #333;">Dear ${employee[0]},</p>
              <p style="font-size: 16px; color: #333;">
                We are pleased to inform you that your salary details for <strong>${salaryData[1]} ${salaryData[2]}</strong> are now available.
              </p>
              <p style="font-size: 14px; color: #333;">
                You can download or view your detailed salary slip through our portal. If you have any questions, feel free to reach out to our HR team.
              </p>
              <p style="font-size: 14px; color: #333;">Thank you for your hard work and dedication!</p>
            </td>
          </tr>
          <!-- Footer with Company Info -->
          <tr>
            <td style="padding: 1rem; background-color: #f4f4f4; text-align: center;">
              <p style="font-size: 12px; color: #5e5e5e;">Forwardcode TechStudio</p>
              <p style="font-size: 12px; color: #5e5e5e;">Jamshedpur, JH - 831018</p>
              <p style="font-size: 12px;">hr@forwardcode.in</p>
              <p style="font-size: 12px;">
                Check what's new: 
                <a href="https://forwardcode.in" style="color: #007bff;">https://forwardcode.in</a>
              </p>
            </td>
          </tr>
          <!-- Disclaimer -->
          <tr>
            <td style="padding: 1rem; background-color: #f4f4f4; text-align: center;">
              <p style="font-size: 10px; color: #999;">
                PLEASE CONSIDER THE ENVIRONMENT BEFORE PRINTING THIS EMAIL.<br>
                THIS MESSAGE IS INTENDED ONLY FOR THE USE OF THE INDIVIDUAL OR ENTITY TO WHICH IT IS ADDRESSED AND MAY CONTAIN 
                INFORMATION THAT IS PRIVILEGED, CONFIDENTIAL AND EXEMPT FROM DISCLOSURE UNDER APPLICABLE LAW.
              </p>
            </td>
          </tr>
        </table>
      </body>
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
