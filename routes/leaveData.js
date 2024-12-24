const express = require('express');
const { img } = require('vamtec');
const pool = require('../config/db'); // Importing database connection pool
const router = express.Router();

// Get all leave data
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leave_data');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching leave data');
  }
});

    router.put('/admin/:user_id', async (req, res) => {
        const { user_id } = req.params;
        const { EL, SL, CL, CO, SO, SML, ML, CW, OOD, HL, COL, WFH, WO, MP, A } = req.body;
    
        try {
        const result = await pool.query(
            `UPDATE leave_data SET EL = $1, SL = $2, CL = $3, CO = $4, SO = $5, SML = $6, 
            ML = $7, CW = $8, OOD = $9, HL = $10, COL = $11, WFH = $12, WO = $13, MP = $14, A = $15
            WHERE user_id = $16`,
            [EL, SL, CL, CO, SO, SML, ML, CW, OOD, HL, COL, WFH, WO, MP, A, user_id]
        );
        res.status(200).json({ message: 'Leave data updated successfully', data: result.rows });
        } catch (err) {
        console.error(err);
        res.status(500).send('Error updating leave data');
        }
    });

  // router.post('/apply_leave',
  //   img(['uploads/users_leave_documents', 'timestamp', 'file']),
  //    async (req, res) => {
  //   const { user_id, user_name, leave_type, from_date, to_date, leave_days, reason } = req.body;
  
  //   // Ensure all necessary fields are provided
  //   if (!user_id || !user_name || !leave_type || !from_date || !to_date || !leave_days || !reason) {
  //     return res.status(400).send('All fields are required');
  //   }
  //   if (!req.file) {
  //     return res.status(400).send('test error: File Uploads error');
  //   }
  
  //   try {
  //     // Insert leave application data into the database
  //     const result = await pool.query(
  //       `INSERT INTO leave_applications (user_id, user_name, leave_type, from_date, to_date, leave_days, reason, file, status)
  //        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending') RETURNING *`,
  //       [user_id, user_name, leave_type, from_date, to_date, leave_days, `/uploads/users_leave_documents/${req.file.filename}`, reason]
  //     );
  
  //     // Return the inserted leave application
  //     res.status(201).json({ message: 'Leave application submitted successfully', data: result.rows[0] });
  //   } catch (err) {
  //     console.error(err);
  //     res.status(500).send('Error applying for leave');
  //   }
  // });

  router.post(
    '/apply_leave',
    img(['uploads/users_leave_documents', 'timestamp', 'file']),
    async (req, res) => {
      const { user_id, user_name, leave_type, from_date, to_date, leave_days, reason } = req.body;
  
      // Ensure all necessary fields are provided
      if (!user_id || !user_name || !leave_type || !from_date || !to_date || !leave_days || !reason) {
        return res.status(400).send('All fields are required');
      }
  
      try {
        // Determine file path if file exists
        const filePath = req.file ? `/uploads/users_leave_documents/${req.file.filename}` : null;
  
        // Insert leave application data into the database
        const result = await pool.query(
          `INSERT INTO leave_applications (user_id, user_name, leave_type, from_date, to_date, leave_days, reason, file, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending') RETURNING *`,
          [user_id, user_name, leave_type, from_date, to_date, leave_days, reason, filePath]
        );
  
        // Return the inserted leave application
        res.status(201).json({ message: 'Leave application submitted successfully', data: result.rows[0] });
      } catch (err) {
        console.error(err);
        res.status(500).send('Error applying for leave');
      }
    }
  );
  
  router.put('/reduce_leave_balance', async (req, res) => {
    const { user_id, leave_type, leave_days } = req.body;
    if (!user_id || !leave_type || !leave_days) {
      return res.status(400).send('User ID, leave type, and leave days are required');
    }
  
    try {
      // Update the availed leave balance
      const updateLeaveDataQuery = `
        UPDATE leave_balance
        SET ${leave_type.toLowerCase()}_availed = ${leave_type.toLowerCase()}_availed + $1
        WHERE user_id = $2
        RETURNING ${leave_type.toLowerCase()}_availed
      `;
      const leaveDataResult = await pool.query(updateLeaveDataQuery, [leave_days, user_id]);
      
      // Update the available leave balance
      const updateAvailableLeaveQuery = `
        UPDATE leave_balance
        SET ${leave_type.toLowerCase()}_available = ${leave_type.toLowerCase()}_available - $1
        WHERE user_id = $2
        RETURNING ${leave_type.toLowerCase()}_available
      `;
      const availableLeaveResult = await pool.query(updateAvailableLeaveQuery, [leave_days, user_id]);
  
      // Check if the leave balance was successfully updated
      if (leaveDataResult.rows.length === 0 || availableLeaveResult.rows.length === 0) {
        return res.status(400).send('Insufficient leave balance or user not found');
      }
  
      const updatedAvailedBalance = leaveDataResult.rows[0][`${leave_type.toLowerCase()}_availed`];
      const updatedAvailableBalance = availableLeaveResult.rows[0][`${leave_type.toLowerCase()}_available`];
  
      res.status(200).json({
        message: `${leave_type} balance updated successfully. New availed balance: ${updatedAvailedBalance}, New available balance: ${updatedAvailableBalance}`,
        data: {
          availed: updatedAvailedBalance,
          available: updatedAvailableBalance,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Error reducing leave balance');
    }
  });
  
  

  router.get('/get-all-status', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM leave_applications ORDER BY applied_date DESC');
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching leave applications:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  // router.put('/update-leave-status/:id', async (req, res) => {
  //   const { id } = req.params; // Extract 'id' from route parameters
  //   console.log("id:", id);
  //   console.log("Request body:", req.body);

  //   const { status, reject_reason , leave_days, leave_type, user_id  } = req.body; // Extract 'status' and 'reject_reason' from request body
    
  //   try {
  //     const result = await pool.query(
  //       'UPDATE leave_applications SET status = $1, reject_reason = $2 WHERE id = $3',
  //       [status, reject_reason || '', id]
  //     );
  
  //     if (result.rowCount === 0) {
  //       // If no rows were updated, send a 404 response
  //       return res.status(404).send('Leave application not found or no changes made');
  //     }
  //     if (status === 'Rejected') {
  //       // Dynamically increment the leave_type column by leave_days
  //       const updateLeaveDataQuery = `
  //         UPDATE leave_data
  //         SET ${leave_type} = ${leave_type} + $1
  //         WHERE user_id = $2
  //       `;
  
  //       await pool.query(updateLeaveDataQuery, [leave_days, user_id]);
  //       console.log(`${leave_type} increased by ${leave_days} for user_id: ${user_id}`);
  //     }
  
  //     res.send(`Leave status updated successfully ${status}`);
  //   } catch (error) {
  //     console.error('Error updating leave status:', error); // Log any error
  //     res.status(500).send('Internal Server Error'); // Error response
  //   }
  // });


  router.put('/update-leave-status/:id', async (req, res) => {
    const { id } = req.params; // Extract 'id' from route parameters
    console.log("id:", id);
    console.log("Request body:", req.body);
  
    const { status, reject_reason, leave_days, leave_type, user_id } = req.body; // Extract 'status', 'reject_reason', 'leave_days', 'leave_type', and 'user_id' from request body
    
    try {
      // Update the leave application status
      const result = await pool.query(
        'UPDATE leave_applications SET status = $1, reject_reason = $2 WHERE id = $3',
        [status, reject_reason || '', id]
      );
  
      if (result.rowCount === 0) {
        // If no rows were updated, send a 404 response
        return res.status(404).send('Leave application not found or no changes made');
      }
  
      // if (status === 'Approved') {
      //   // If the leave is approved, add leave_days to the corresponding leave_type (availed) in the leave_balance table
      //   const updateLeaveDataQuery = `
      //     UPDATE leave_balance
      //     SET ${leave_type.toLowerCase()}_availed = ${leave_type.toLowerCase()}_availed + $1
      //     WHERE user_id = $2
      //   `;
      //   await pool.query(updateLeaveDataQuery, [leave_days, user_id]);
        
      //   // Optional: Add logic for reducing the available leave if needed, depending on your business rules.
      //   const updateAvailableLeaveQuery = `
      //     UPDATE leave_balance
      //     SET ${leave_type.toLowerCase()}_available = ${leave_type.toLowerCase()}_available - $1
      //     WHERE user_id = $2
      //   `;
      //   await pool.query(updateAvailableLeaveQuery, [leave_days, user_id]);
  
      // } else 
      if (status === 'Rejected') {
        // If the leave is rejected, return the leave_days to the available balance and remove from the availed balance
        const updateLeaveDataQuery = `
          UPDATE leave_balance
          SET ${leave_type.toLowerCase()}_availed = ${leave_type.toLowerCase()}_availed - $1
          WHERE user_id = $2
        `;
        await pool.query(updateLeaveDataQuery, [leave_days, user_id]);
  
        // Add back the leave_days to the available balance
        const updateAvailableLeaveQuery = `
          UPDATE leave_balance
          SET ${leave_type.toLowerCase()}_available = ${leave_type.toLowerCase()}_available + $1
          WHERE user_id = $2
        `;
        await pool.query(updateAvailableLeaveQuery, [leave_days, user_id]);
      }
  
      res.status(200).send('Leave status updated successfully');
    } catch (err) {
      console.error('Error updating leave status:', err);
      res.status(500).send('Error updating leave status');
    }
  });
  
  router.delete('/delete-leave-request/:id', async (req, res) => {
    const { id } = req.params; // Extract the leave application ID from the route parameters
  
    try {
      const result = await pool.query('DELETE FROM leave_applications WHERE id = $1 RETURNING *', [id]);
  
      if (result.rowCount === 0) {
        return res.status(404).send('Leave application not found'); // If no rows were deleted, send a 404 response
      }
  
      res.status(200).json({ message: 'Leave application deleted successfully', data: result.rows[0] }); // Return success response
    } catch (error) {
      console.error('Error deleting leave application:', error); // Log any errors
      res.status(500).send('Internal Server Error'); // Send error response
    }
  });
  


module.exports = router;
