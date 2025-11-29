const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Upload Endpoint
app.post('/api/upload', upload.array('files', 50), (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).send('No files uploaded.');
        }
        const fileUrls = files.map(file => `http://localhost:${PORT}/uploads/${file.filename}`);
        res.json({ message: 'Upload success', urls: fileUrls });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// List Images Endpoint
app.get('/api/images', (req, res) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
        return res.json([]);
    }

    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            return res.status(500).send('Unable to scan directory');
        }
        // Filter for image files only
        const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
        const imageUrls = imageFiles.map(file => `http://localhost:${PORT}/uploads/${file}`);
        res.json(imageUrls);
    });
});

// List Music Endpoint
app.get('/api/music', (req, res) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
        return res.json([]);
    }

    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            return res.status(500).send('Unable to scan directory');
        }
        // Filter for mp3 files only, sort by newest first (based on timestamp in filename)
        const musicFiles = files
            .filter(file => /\.(mp3|wav)$/i.test(file))
            .sort((a, b) => b.localeCompare(a)); // Assuming timestamp prefix, reverse sort

        const musicUrls = musicFiles.map(file => `http://localhost:${PORT}/uploads/${file}`);
        res.json(musicUrls);
    });
});

// Delete File Endpoint
app.delete('/api/delete', express.json(), (req, res) => {
    const { filename } = req.body;
    if (!filename) {
        return res.status(400).send('Filename is required');
    }

    // Security: Prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(__dirname, 'uploads', safeFilename);

    if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Delete error:', err);
                return res.status(500).send('Failed to delete file');
            }
            res.json({ message: 'File deleted successfully' });
        });
    } else {
        res.status(404).send('File not found');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
