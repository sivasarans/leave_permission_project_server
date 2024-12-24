# Vamtec

Vamtec is a utility package designed to simplify and automate the process of managing commonly used file generation tasks in Node.js. It helps you quickly set up and generate Excel, CSV, and PDF files from JSON data. It also ensures that necessary dependencies like `xlsx`, `json2csv`, and `pdfkit` are installed automatically if missing.

## Features
- Automatically installs necessary dependencies (`xlsx`, `json2csv`, `pdfkit`).
- Provides functions to generate Excel, CSV, and PDF files from JSON data.
- Supports quick and seamless file generation for web applications or automation tasks.
- Lightweight and easy to integrate into existing projects.
- New **Image Upload Module** for handling file uploads in multiple ways (automatic folder creation and filename management).

## Installation
```bash
npm install vamtec
```

## Usage

### Automatically Install Dependencies and Load Modules

```javascript
const vamtec = require('vamtec'); // Import the vamtec library
vamtec.main(); // This will check and install required dependencies like xlsx, json2csv, pdfkit
```

This will automatically install the required packages and print:

```
xlsx is already installed.
json2csv is already installed.
pdfkit is already installed.
Modules loaded successfully!
yes...
```

### Using the Functions in Your Express Router

Here’s an example of how to use all three functions (Excel, PDF, and CSV) in an Express route:



### Frontend: Reports.js
```javascript

import React, { useState } from 'react';
import axios from 'axios';
import { DownloadFile } from 'vamtec-react';

const App = () => {
  const [fileFormat, setFileFormat] = useState("excel"); // Default to 'excel' without the dot

  const handleDownload = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/download-leave-requests?format=${fileFormat}`, { responseType: 'blob' });
      // Map 'excel', 'csv', 'pdf' to their respective extensions
      const fileExtension = fileFormat === "excel" ? ".xlsx" : fileFormat === "csv" ? ".csv" : ".pdf";
      // Call the fileHandling function with correct file name and extension
      DownloadFile('Download', fileExtension, response.data); // Pass base filename, extension, and data
    } catch (error) {
      console.error('Error downloading file', error);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Download Leave Requests</h1>
      <select value={fileFormat} onChange={(e) => setFileFormat(e.target.value)} className="p-2 border rounded-md w-full mb-4">
        <option value="excel">Excel (.xlsx)</option>
        <option value="csv">CSV (.csv)</option>
        <option value="pdf">PDF (.pdf)</option>
      </select>
      <button onClick={handleDownload} className="bg-blue-500 text-white p-2 rounded mt-4">
        Download Leave Requests
      </button>
    </div>
  );
};

export default App;
```
### Backend:server.js

```javascript
const express = require('express');
const router = express.Router();
const vamtec = require('vamtec'); // Import the vamtec library
const pool = require('../config/db'); // Database connection

// Route to generate reports in different formats
router.get('/', async (req, res) => {
  const format = req.query.format || 'excel'; // Default to 'excel' if format is not specified
  const title = req.query.title || 'Leave Requests'; // Get title from query parameter, default to 'Leave Requests Report'
  
  try {
    // Fetch data from the database
    const { rows: data } = await pool.query('SELECT * FROM LeaveRequests');

    // Generate the file based on the format specified in the query
    if (format === 'excel') {
      vamtec.generateExcel(data, res); // Generate Excel file
    } else if (format === 'pdf') {
      vamtec.generatePDF(data, res, title); // Generate PDF file
    } else if (format === 'csv') {
      vamtec.generateCSV(data, res); // Generate CSV file
    } else {
      res.status(400).send('Invalid format');
    }
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
```

### Available Functions
- **`generateExcel(data, res)`**: Generates and sends an Excel file (XLSX format) from the provided data.
- **`generateCSV(data, res)`**: Generates and sends a CSV file from the provided data.
- **`generatePDF(data, res, title)`**: Generates and sends a PDF file from the provided data with an optional title.

---

## New Image Upload Module

Vamtec now includes an image upload module for managing file uploads. This module allows flexible folder management and filename control for your file uploads.

### Installation
```bash
npm install vamtec
```

### Image Upload Setup

Here’s an example of how to use the image upload setup in your Express application:

```javascript
const express = require("express");
const { img } = require("vamtec"); // Import the image upload setup

const app = express();

// Case 1: Upload with custom folder and filename configuration
app.post("/upload", img({ folder: "uploads1", filename: "timestamp" }).single("image"), async (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");
  res.json({ message: "File uploaded successfully", fileName: req.file.filename });
});

// Case 2: Upload with folder and filename array configuration
app.post("/upload", img(["uploads2", "original"]).single("image"), async (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");
  res.json({ message: "File uploaded successfully", fileName: req.file.filename });
});

// Case 3: Upload with folder, filename, and field name configuration
app.post("/upload", img(["uploads3", "original", "image"]).single("image"), async (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");
  res.json({ message: "File uploaded successfully", fileName: req.file.filename });
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));
```

### How it Works:
- **Case 1**: Uploads a file with a custom folder and filename format (`timestamp` for a timestamp-based filename).
- **Case 2**: Uploads a file with the original filename in the specified folder.
- **Case 3**: Uploads a file with a custom folder, filename, and field name (useful when you have multiple fields in your form).

This module supports automatic creation of the upload folder if it doesn't exist.

