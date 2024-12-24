// const express = require('express');
// const cors = require('cors'); // Importing cors
// const pool = require('../config/db'); // Importing database connection pool

// const app = express(); // Initialize the app

// app.use(cors());
// app.use(express.json());
const express = require('express');
const pool = require('../config/db'); // Importing database connection pool

const router = express.Router();

// Get all leave data
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leave_balance');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching leave data');
  }
});

// Admin: Update leave data
router.put('/admin/:user_id', async (req, res) => { // problem in (avaialble is reduced when run out of 2 tests)
  const { user_id } = req.params;
  const {
    EL_available, EL_availed,
    SL_available, SL_availed,
    CL_available, CL_availed,
    CO_available, CO_availed,
    OOD_available, OOD_availed,
    SML_available, SML_availed,
    WFH_available, A_available, ML_available, PL_available, MP_available
  } = req.body;

  try {
    const query = `
      UPDATE leave_balance SET
        EL_available = $1, EL_availed = $2,
        SL_available = $3, SL_availed = $4,
        CL_available = $5, CL_availed = $6,
        CO_available = $7, CO_availed = $8,
        OOD_available = $9, OOD_availed = $10,
        SML_available = $11, SML_availed = $12,
        WFH_available = $13, A_available = $14,
        ML_available = $15, PL_available = $16, MP_available = $17
      WHERE user_id = $18
      RETURNING *;
    `;

    const values = [
      EL_available, EL_availed,
      SL_available, SL_availed,
      CL_available, CL_availed,
      CO_available, CO_availed,
      OOD_available, OOD_availed,
      SML_available, SML_availed,
      WFH_available, A_available, ML_available, PL_available, MP_available,
      user_id
    ];

    const result = await pool.query(query, values);

    res.status(200).json({
      message: 'Leave data updated successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating leave data');
  }
});

// Reduce leave balance
router.put('/reduce_leave_balance', async (req, res) => {
  const { user_id, leave_type, leave_days } = req.body;

  if (!user_id || !leave_type || !leave_days) {
    return res.status(400).send('User ID, leave type, and leave days are required');
  }

  try {
    const result = await pool.query(
      `
      UPDATE leave_balance 
      SET ${leave_type}_availed = ${leave_type}_availed + $1
      WHERE user_id = $2 AND (${leave_type}_available - ${leave_type}_availed) >= $1
      RETURNING ${leave_type}_available, ${leave_type}_availed, (${leave_type}_available - ${leave_type}_availed) AS ${leave_type}_balance
      `,
      [leave_days, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(400).send('Insufficient leave balance or user not found');
    }

    res.status(200).json({
      message: `${leave_type} balance updated successfully`,
      data: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error reducing leave balance');
  }
});

router.get('/leave/admin', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leave_set_admin');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching leave data');
  }
});

router.put('/leave/admin/update', async (req, res) => {
  const { role_name, EL_default, SL_default, CL_default, CO_default, OOD_default, WFH_default,
    ML_default, PL_default, MP_default 
   } = req.body;
  console.log('Request body:', req.body);
  if (!role_name) {
    return res.status(400).send('Role name is required');
  }


  try {
    const query = `
      UPDATE leave_set_admin
      SET 
        EL_default = $1,
        SL_default = $2,
        CL_default = $3,
        CO_default = $4,
        OOD_default = $5,
        WFH_default = $6,
        ML_default = $7,
        PL_default = $8,
        MP_default = $9

      WHERE role_name = $10
    `;
    const values = [EL_default, SL_default, CL_default, CO_default, OOD_default, WFH_default,
      ML_default, PL_default, MP_default, role_name];
    await pool.query(query, values);

    res.send('Leave defaults updated successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating leave defaults');
  }
});


module.exports = router;
