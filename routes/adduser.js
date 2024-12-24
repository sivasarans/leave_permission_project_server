const express = require('express');
const pool = require('../config/db');
const { img } = require('vamtec');
const router = express.Router();

// Add User - POST route
router.post(
  '/',
  img(['uploads/users_profile', 'timestamp', 'profile_picture']),
  async (req, res) => {
    const {
      name,
      email,
      user_id,
      role_name,
      password,
      gender,
      joining_date,
      status,
    } = req.body;

    if (
      !name ||
      !email ||
      !user_id ||
      !role_name ||
      !password ||
      !gender ||
      !joining_date ||
      !status ||
      !req.file
    ) {
      console.log('Validation failed: Missing required fields...');
      return res.status(400).json({ error: 'All fields and profile picture are required' });
    }

    try {
      console.log('Checking if user ID already exists...');
      const userExists = await pool.query('SELECT 1 FROM Users WHERE user_id = $1', [user_id]);
      if (userExists.rows.length > 0) {
        console.log(`User ID ${user_id} already exists.`);
        return res.status(400).json({ error: 'User ID already exists' });
      }

      console.log('Inserting new user into database...');
      const query = `
        INSERT INTO Users (name, email, user_id, role_name, password, profile_picture, gender, joining_date, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`;
      const values = [
        name,
        email,
        user_id,
        role_name,
        password,
        `/uploads/users_profile/${req.file.filename}`,
        gender,
        joining_date,
        status,
      ];
      const result = await pool.query(query, values);

      console.log('User added successfully:', result.rows[0]);
      res.status(200).json({ message: 'User added successfully', userId: result.rows[0].id });
    } catch (err) {
      console.error('Error adding user:', err);
      res.status(500).json({ error: 'Failed to process request' });
    }
  }
);

// Get All Users - GET route
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM Users';
    const result = await pool.query(query);
    res.status(200).json({ message: 'Success', result: result.rows });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(400).json({ message: 'Failed to fetch users' });
  }
});

// Update User - PUT route
router.put(
  '/:user_id',
  img(['uploads/users_profile', 'timestamp', 'profile_picture']),
  async (req, res) => {
    const {
      name,
      email,
      role_name,
      password,
      gender,
      joining_date,
      status,
    } = req.body;
    const { user_id } = req.params;
    const profile_picture = req.file ? `/uploads/users_profile/${req.file.filename}` : null;

    if (
      !name ||
      !email ||
      !role_name ||
      !password ||
      !gender ||
      !joining_date ||
      !status
    ) {
      console.log('Validation failed: Missing required fields.');
      return res.status(400).json({ error: 'All fields are required' });
    }

    try {
      console.log(`Checking if user ID ${user_id} exists...`);
      const userExists = await pool.query('SELECT 1 FROM Users WHERE user_id = $1', [user_id]);
      if (userExists.rows.length === 0) {
        console.log(`User ID ${user_id} not found.`);
        return res.status(404).json({ error: 'User not found' });
      }

      console.log(`Updating user with ID ${user_id}...`);
      const query = `
        UPDATE Users
        SET name = $1, email = $2, role_name = $3, password = $4,
            gender = $5, joining_date = $6, status = $7,
            profile_picture = COALESCE($8, profile_picture)
        WHERE user_id = $9 RETURNING id`;
      const values = [
        name,
        email,
        role_name,
        password,
        gender,
        joining_date,
        status,
        profile_picture,
        user_id,
      ];
      const result = await pool.query(query, values);

      if (result.rowCount === 0) {
        console.log('Failed to update user.');
        return res.status(400).json({ error: 'Failed to update user' });
      }

      console.log('User updated successfully:', result.rows[0]);
      res.status(200).json({ message: 'User updated successfully', userId: result.rows[0].id });
    } catch (err) {
      console.error('Error updating user:', err);
      res.status(500).json({ error: 'Failed to process request' });
    }
  }
);

// Delete User - DELETE route
router.delete('/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    console.log(`Checking if user ID ${user_id} exists...`);
    const userExists = await pool.query('SELECT 1 FROM Users WHERE user_id = $1', [user_id]);
    if (userExists.rows.length === 0) {
      console.log(`User ID ${user_id} not found.`);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`Deleting user with ID ${user_id}...`);
    const query = 'DELETE FROM Users WHERE user_id = $1 RETURNING id';
    const result = await pool.query(query, [user_id]);

    if (result.rowCount === 0) {
      console.log('Failed to delete user.');
      return res.status(400).json({ error: 'Failed to delete user' });
    }

    console.log('User deleted successfully:', result.rows[0]);
    res.status(200).json({ message: 'User deleted successfully', userId: result.rows[0].id });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

module.exports = router;
