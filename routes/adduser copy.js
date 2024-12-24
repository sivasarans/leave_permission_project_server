// routes/adduser.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const pool = require('../config/db');  // Importing database connection pool

const router = express.Router();

// Setup multer for file upload (profile picture) to 'uploads/users_profile' folder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads', 'users_profile');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });  // Create the folder if it doesn't exist
    }
    cb(null, uploadPath);  // Save files to this folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));  // Set file name as timestamp with extension
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },  // 5MB file size limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// API to add a user, including profile picture
router.post('/', upload.single('profile_picture'), async (req, res) => {
  const { name, email, role_id, user_id, role_name, password } = req.body;

  if (!name || !email || !role_id || !user_id || !role_name || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if the user ID already exists
    const checkUserQuery = 'SELECT * FROM Users WHERE user_id = $1';
    const result = await pool.query(checkUserQuery, [user_id]);

    if (result.rows.length > 0) {
      return res.status(400).json({ error: 'User ID already exists' });
    }

    // Check if a file was uploaded and log it
    if (req.file) {
      const profilePicturePath = `/uploads/users_profile/${req.file.filename}`; // Save file path

      // Hash the password before storing it
      bcrypt.hash(password, 10, async (err, hashedPassword) => {
        if (err) {
          return res.status(500).json({ error: 'Password hashing failed' });
        }

        try {
          // Insert user data into the database
          const query = `
            INSERT INTO Users (name, email, role_id, user_id, role_name, password, profile_picture)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
          `;
          const values = [name, email, role_id, user_id, role_name, hashedPassword, profilePicturePath];
          
          const insertResult = await pool.query(query, values);
          res.status(200).json({ message: 'User added successfully', userId: insertResult.rows[0].id });
        } catch (err) {
          console.error("Error inserting user:", err);  // Log the error if something goes wrong
          res.status(500).json({ error: 'Failed to insert user data' });
        }
      });
    } else {
      res.status(400).json({ error: 'No profile picture uploaded' });
    }
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: 'Database query failed' });
  }
});


router.get('/',async ( req, res ) => {
  try {
    const query = 'SELECT * FROM Users';
    const result = await pool.query(query);
    res.status(200).json({message: "Success", result: result.rows});}
    catch {
      res.status(400).json({ message: "Failed to fetch users" });
    }
})

module.exports = router;
