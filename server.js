const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(cors());
app.use(express.json());
//yes
// Ensure 'uploads' and subfolders exist
const uploadFolders = ['uploads', 'uploads/users_profile', 'uploads/users_leave_attachments'];
uploadFolders.forEach(folder => {
  fs.mkdirSync(path.join(__dirname, folder), { recursive: true });
});

// Serve static files from 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/download-leave-requests', require('./routes/reports'));
app.use('/login', require('./routes/login'));
app.use('/attandance', require('./routes/attandance'));
app.use('/add_user', require('./routes/adduser'));
app.use('/leave', require('./routes/leaveData'));
app.use('/', require('./routes/leave_balance')); // Updated route path
app.use('/permission', require('./routes/permission'));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
