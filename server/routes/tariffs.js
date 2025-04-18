const express = require('express');
const router = express.Router();
const Tariff = require('../models/Tariff');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads/tariffs';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

router.get('/', async (req, res) => {
    try {
        const tariffs = await Tariff.find().sort({ position: 1 });
        res.json(tariffs);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        const { title, shortDescription, fullDescription } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Название обязательно' });
        }
        const tariff = new Tariff({
            title,
            shortDescription,
            fullDescription,
            image: req.file ? `/uploads/tariffs/${req.file.filename}` : null,
            position: await Tariff.countDocuments()
        });
        await tariff.save();
        res.json({ message: 'Тариф добавлен', tariff });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;