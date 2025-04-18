const express = require('express');
const router = express.Router();
const Partner = require('../models/Partner');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Настройка Multer для загрузки изображений
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads/partners';
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

// Получить всех партнёров
router.get('/', async (req, res) => {
    try {
        const partners = await Partner.find();
        res.json(partners);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Добавить партнёра
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { name, isVisible } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Название обязательно' });
        }
        const partner = new Partner({
            name,
            image: req.file ? `/uploads/partners/${req.file.filename}` : null,
            isVisible: isVisible === 'true',
            position: (await Partner.countDocuments())
        });
        await partner.save();
        res.json({ message: 'Партнёр добавлен', partner });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновить партнёра
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { name, isVisible } = req.body;
        const updateData = {
            name,
            isVisible: isVisible === 'true'
        };
        if (req.file) {
            updateData.image = `/uploads/partners/${req.file.filename}`;
        }
        const partner = await Partner.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!partner) {
            return res.status(404).json({ error: 'Партнёр не найден' });
        }
        res.json({ message: 'Партнёр обновлён', partner });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Удалить партнёра
router.delete('/:id', async (req, res) => {
    try {
        const partner = await Partner.findByIdAndDelete(req.params.id);
        if (!partner) {
            return res.status(404).json({ error: 'Партнёр не найден' });
        }
        if (partner.image) {
            fs.unlink(`.${partner.image}`, (err) => {
                if (err) console.error('Ошибка удаления файла:', err);
            });
        }
        res.json({ message: 'Партнёр удалён' });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Изменить порядок
router.patch('/reorder', async (req, res) => {
    try {
        const { order } = req.body;
        await Promise.all(order.map(async (id, index) => {
            await Partner.findByIdAndUpdate(id, { position: index });
        }));
        res.json({ message: 'Порядок обновлён' });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Изменить видимость
router.patch('/:id', async (req, res) => {
    try {
        const { isVisible } = req.body;
        const partner = await Partner.findByIdAndUpdate(
            req.params.id,
            { isVisible },
            { new: true }
        );
        if (!partner) {
            return res.status(404).json({ error: 'Партнёр не найден' });
        }
        res.json({ message: 'Видимость обновлена', partner });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;