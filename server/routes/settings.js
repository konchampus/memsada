const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './Uploads/banners';
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

// Получить настройки
router.get('/', async (req, res) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) {
            settings = new Setting();
            await settings.save();
        }
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновить настройки
router.put('/', authMiddleware, upload.single('bannerImage'), async (req, res) => {
    try {
        const { bannerEnabled, bannerText, bannerColor, videoUrl } = req.body;
        let settings = await Setting.findOne();
        if (!settings) {
            settings = new Setting();
        }
        settings.bannerEnabled = bannerEnabled === 'true';
        settings.bannerText = bannerText || '';
        settings.bannerColor = bannerColor || '#007bff';
        settings.videoUrl = videoUrl || '/assets/demo.mp4';
        if (req.file) {
            if (settings.bannerImage) {
                fs.unlink(`.${settings.bannerImage}`, err => {
                    if (err) console.error('Ошибка удаления старого изображения:', err);
                });
            }
            settings.bannerImage = `/Uploads/banners/${req.file.filename}`;
        }
        settings.updatedAt = Date.now();
        await settings.save();
        res.json({ message: 'Настройки обновлены', settings });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;