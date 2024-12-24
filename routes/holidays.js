const express = require('express');
const pool = require('../config/db'); // Importing database connection pool
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM holidays ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching holidays:', err);
    res.status(500).json({ error: 'Failed to fetch holidays' });
  }
});

// Route to add a new holiday
router.post('/', async (req, res) => {
  const { title, date } = req.body;

  if (!title || !date) {
    return res.status(400).json({ error: 'Title and date are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO holidays (title, date) VALUES ($1, $2) RETURNING *',
      [title, date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding holiday:', err);
    res.status(500).json({ error: 'Failed to add holiday' });
  }
});

// Route to delete a holiday by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM holidays WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Holiday not found' });
    }
    res.json({ message: 'Holiday deleted successfully' });
  } catch (err) {
    console.error('Error deleting holiday:', err);
    res.status(500).json({ error: 'Failed to delete holiday' });
  }
});

module.exports = router;
