import multer from "multer";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
];

const createError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

// Check 1 and 2: size and declared type
const upload = multer({
  storage: multer.memoryStorage(), // keep the file in RAM as a Buffer
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(createError("Only PDF, PNG, JPG and WebP files are allowed"));
    }
    cb(null, true);
  },
});

// Wraps multer so its errors become clear messages for your error handler
const handleUpload = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      err.status = 400;
      if (err.code === "LIMIT_FILE_SIZE") {
        err.message = "File is too large. Maximum size is 10 MB";
      } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
        err.message = 'Upload exactly one file in the field named "file"';
      }
    }
    next(err);
  });
};

// Check 3: look at the file's first bytes to find its real type
const startsWith = (buffer, bytes, offset = 0) =>
  bytes.every((byte, i) => buffer[offset + i] === byte);

const detectFileType = (buffer) => {
  if (startsWith(buffer, [0x25, 0x50, 0x44, 0x46])) {
    return "application/pdf"; // %PDF
  }
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png";
  }
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) {
    return "image/jpeg";
  }
  if (
    startsWith(buffer, [0x52, 0x49, 0x46, 0x46]) && // RIFF
    startsWith(buffer, [0x57, 0x45, 0x42, 0x50], 8) // WEBP
  ) {
    return "image/webp";
  }
  return null;
};

const verifyFileContent = (req, res, next) => {
  if (!req.file) {
    return next(createError('No file uploaded. Use the field name "file"'));
  }

  const realType = detectFileType(req.file.buffer);
  if (realType !== req.file.mimetype) {
    return next(createError("File content does not match its file type"));
  }

  next();
};

export const uploadSingleFile = [handleUpload, verifyFileContent];
