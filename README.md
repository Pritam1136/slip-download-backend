# Salary Slip Download Tool

This is a secure web application that allows employees to log in, view, and download their salary slips directly from a centralized Google Sheet. Built with **React** and **Node.js**, it integrates email-based OTP verification to ensure secure access.

## Features

- **OTP-based Authentication**: Users log in with their email and receive a one-time password (OTP) to verify their identity.
- **Google Sheets Integration**: Pulls data from a Google Sheet, providing centralized storage and easy access to salary information.
- **Download by Month Selection**: Users can choose specific months for targeted downloads.
- **Light and Dark Mode**: Offers a theme toggle to switch between light and dark modes for better readability.

### Prerequisites

- Node.js (v14+)
- MongoDB (for storing user information and OTPs)
- A Google account with access to Google Sheets API
