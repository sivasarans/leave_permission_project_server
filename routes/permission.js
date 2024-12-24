const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // Ensure this path is correct

// Handle POST request to store permission data
router.post('/', async (req, res) => {
    console.log('Received POST request');

  try {
    const { user_id, date, in_time, out_time, reason } = req.body;

    // Check if all required fields are provided
    if (!user_id || !date || !in_time || !out_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    console.log("before POST request")
    // Insert data into the Permissions table
    const result = await pool.query(
      `INSERT INTO Permissions (user_id, date, in_time, out_time, reason)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user_id, date, in_time, out_time, reason]
    );
console.log("after insert");
    res.status(200).json({
      message: 'Permission added successfully',
      data: result.rows[0],
    });     
  } catch (err) {
    console.error('Error details:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

router.get('/', async (req, res) => {
    try {
      const query = 'SELECT * FROM permissions';
      const result = await pool.query(query);
      res.status(200).json({ message: "Success", result: result.rows });
    } catch {
      res.status(400).json({ message: "Failed to fetch permission data" });
    }
  });

// Add this to your permission.js router file

// Update the status of a permission request
router.put('/update/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
  
    try {
      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }
  
      // Update the status of the permission request in the database
      const result = await pool.query(
        `UPDATE permissions SET status = $1 WHERE id = $2 RETURNING *`,
        [status, id]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Permission request not found' });
      }
  
      res.status(200).json({
        message: 'Permission status updated successfully',
        data: result.rows[0],
      });
    } catch (err) {
      console.error('Error updating permission status:', err);
      res.status(500).json({ error: 'Server error', details: err.message });
    }
  });
  
module.exports = router;