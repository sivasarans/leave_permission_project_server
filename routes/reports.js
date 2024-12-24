const express = require('express');
const router = express.Router();
const vamtec = require('vamtec');
const pool = require('../config/db');

router.get('/', async (req, res) => {
  const format = req.query.format || 'excel'; 
  const title = req.query.title || 'Leave Requests'; 
  const query = req.query.query; // Get the dynamic query from the frontend

  if (!query) {
    return res.status(400).send('Query is required');
  }

  try {
    // Execute the dynamic query
    const { rows: data } = await pool.query(query);

    if (format === 'excel') {
      vamtec.generateExcel(data, res);
    } else if (format === 'pdf') {
      vamtec.generatePDF(data, res, title);
    } else if (format === 'csv') {
      vamtec.generateCSV(data, res);
    } else {
      res.status(400).send('Invalid format');
    }
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
