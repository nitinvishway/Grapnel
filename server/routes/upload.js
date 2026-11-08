import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';

const router = express.Router();

// Dynamic storage engine to put uploaded files directly into requested folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let targetDir = req.body.targetPath;
    if (!targetDir || targetDir === 'home' || targetDir === 'drives') {
      targetDir = os.homedir();
    }

    if (!fs.existsSync(targetDir)) {
      try {
        fs.mkdirSync(targetDir, { recursive: true });
      } catch (err) {
        return cb(err, targetDir);
      }
    }
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    // Preserve original filename, if file exists append timestamp
    const targetDir = req.body.targetPath || os.homedir();
    const originalName = file.originalname;
    const destPath = path.join(targetDir, originalName);

    if (fs.existsSync(destPath)) {
      const ext = path.extname(originalName);
      const nameWithoutExt = path.basename(originalName, ext);
      const newName = `${nameWithoutExt}_${Date.now()}${ext}`;
      cb(null, newName);
    } else {
      cb(null, originalName);
    }
  },
});

const upload = multer({ storage });

/**
 * POST /api/upload
 * Multi-file upload endpoint
 */
router.post('/', upload.array('files'), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files were uploaded' });
    }

    const uploadedFiles = req.files.map((file) => ({
      originalname: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
    }));

    res.json({
      success: true,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
      files: uploadedFiles,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'File upload failed' });
  }
});

export default router;
