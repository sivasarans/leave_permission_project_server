const express = require('express');
const router = express.Router();
const vamtec = require('vamtec'); // Import the vamtec library
const pool = require('../config/db');

router.get('/', async (req, res) => {
  const format = req.query.format || 'excel'; // Default to 'excel' if format is not specified
  const title = req.query.title || 'Leave Requests '; // Get title from query parameter, default to 'Leave Requests Report'
  
  try {
    const { rows: data } = await pool.query('SELECT * FROM LeaveRequests');

    if (format === 'excel') {
      vamtec.generateExcel(data, res); // Use vamtec's generateExcel method
    } else if (format === 'pdf') {
      vamtec.generatePDF(data, res, title); // Use vamtec's generatePDF method
    } else if (format === 'csv') {
      vamtec.generateCSV(data, res); // Use vamtec's generateCSV method
    } else {
      res.status(400).send('Invalid format');
    }
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Internal Server Error');
  }
});
module.exports = router;
