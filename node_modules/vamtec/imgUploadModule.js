// uploadModule.js
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Default upload folder
const UPLOAD_FOLDER = "uploads";

// Image upload setup function
const img = (options) => {
  // Case 1: If options is an object with folder and filename keys
  if (typeof options === 'object' && options.folder && options.filename) {
    const { folder = UPLOAD_FOLDER, filename = "timestamp" } = options;

    // Ensure the directory exists or create it
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
    }

    const storage = multer.diskStorage({
      destination: (req, file, cb) => cb(null, folder),
      filename: (req, file, cb) => {
        let fileName;
        if (filename === "timestamp") {
          fileName = Date.now() + path.extname(file.originalname);
        } else if (filename === "original") {
          fileName = file.originalname;
        } else {
          fileName = filename + path.extname(file.originalname);
        }
        cb(null, fileName);
      }
    });

    return multer({ storage });
  }

  // Case 2: If options is an array with folder and filename values
  if (Array.isArray(options) && options.length === 2) {
    const [folder, filename] = options;
    if (!folder) throw new Error("Folder path is required.");

    // Ensure the directory exists or create it
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
    }

    const storage = multer.diskStorage({
      destination: (req, file, cb) => cb(null, folder),
      filename: (req, file, cb) => {
        let fileName;
        if (filename === "timestamp") {
          fileName = Date.now() + path.extname(file.originalname);
        } else if (filename === "original") {
          fileName = file.originalname;
        } else {
          fileName = filename + path.extname(file.originalname);
        }
        cb(null, fileName);
      }
    });

    return multer({ storage });
  }

  // Case 3: If options is an array with folder, filename, and field name
  if (Array.isArray(options) && options.length === 3) {
    const [folder, filename, fieldname] = options;
    if (!folder || !fieldname) throw new Error("Folder and fieldname are required.");

    // Ensure the directory exists or create it
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
    }

    const storage = multer.diskStorage({
      destination: (req, file, cb) => cb(null, folder),
      filename: (req, file, cb) => {
        let fileName;
        if (filename === "timestamp") {
          fileName = Date.now() + path.extname(file.originalname);
        } else if (filename === "original") {
          fileName = file.originalname;
        } else {
          fileName = filename + path.extname(file.originalname);
        }
        cb(null, fileName);
      }
    });

    // Return the multer setup with the specified fieldname for single upload
    return multer({ storage }).single(fieldname);
  }

  // If the provided argument doesn't match any valid structure
  throw new Error("Invalid configuration passed to img.");
};

// Export the upload setup and image handling functions
module.exports = {
  img,
};
