const express = require('express');
const pool = require('../config/db'); // Import the database connection

const router = express.Router();

// Endpoint to get the user list for attendance
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, user_id, role_name FROM Users'
    );

    if (result.rows.length > 0) {
      res.status(200).json({ success: true, users: result.rows });
    } else {
      res.status(404).json({ success: false, message: 'No users found.' });
    }
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, message: 'Error fetching users.' });
  }
});

// Endpoint to bulk add or update attendance
router.post('/bulk-update', async (req, res) => {
  const attendanceData = req.body; // Array of attendance records
  console.log('Bulk Update Data:', attendanceData);


  if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: 'Attendance data must be a non-empty array.' });
  }

  const client = await pool.connect(); // Use a transaction for bulk updates
  try {
    await client.query('BEGIN'); // Start transaction

    for (const record of attendanceData) {
      const { userId, name, date, inTime, outTime } = record;

      if (!userId || !date || !name) {
        throw new Error('Invalid attendance data.');
      }

      // Check if attendance already exists
      const result = await client.query(
        'SELECT * FROM Attendance WHERE user_id = $1 AND date = $2',
        [userId, date]
      );

      if (result.rows.length > 0) {
        // Update existing attendance
        await client.query(
          `UPDATE Attendance 
           SET in_time = $1, out_time = $2, updated_at = CURRENT_TIMESTAMP 
           WHERE user_id = $3 AND date = $4`,
          [inTime || '09:30:00', outTime || '17:00:00', userId, date]
        );
      } else {
        // Insert new attendance record
        await client.query(
          `INSERT INTO Attendance (user_id, name, date, in_time, out_time) 
           VALUES ($1, $2, $3, $4, $5)`,
          [userId, name, date, inTime || '09:30:00', outTime || '17:00:00']
        );
      }
    }

    await client.query('COMMIT'); // Commit transaction
    res.status(200).json({ success: true, message: 'Attendance updated successfully.' });
  } catch (err) {
    await client.query('ROLLBACK'); // Rollback transaction on error
    console.error('Error in bulk update:', err);
    res.status(500).json({ success: false, message: 'Error updating attendance.' });
  } finally {
    client.release(); // Release client back to the pool
  }
});



router.all('/', async (req, res) => {
  const date = req.method === 'GET' ? req.query.date : req.body.date; // Handle both GET and POST
  console.log("Received date:", date);

  if (!date) {
    return res.status(400).json({ success: false, message: 'Date is required.' });
  }

  try {
    const result = await pool.query(
      'SELECT *, updated_at FROM Attendance WHERE date = $1',
      [date]
    );

    if (result.rows.length > 0) {
      res.status(200).json({ success: true, attendance_date: result.rows });
    } else {
      res.status(404).json({ success: false, message: 'No data found for this date.' });
    }
  } catch (err) {
    console.error('Error fetching attendance:', err);
    res.status(500).json({ success: false, message: 'Error fetching attendance.' });
  }
});

module.exports = router;
