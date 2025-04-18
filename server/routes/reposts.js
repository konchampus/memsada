const express = require('express');
const router = express.Router();
const Repost = require('../models/Repost');
const Log = require('../models/Log');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Настройка Multer
const uploadDir = path.join(__dirname, '../Uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Недопустимый тип файла: ' + file.mimetype));
        }
    }
}).fields([
    { name: 'image', maxCount: 1 },
    { name: 'title', maxCount: 1 },
    { name: 'description', maxCount: 1 },
    { name: 'link', maxCount: 1 },
    { name: 'position', maxCount: 1 }
]);

// Получение всех репостов
router.get('/', async (req, res) => {
    try {
        const reposts = await Repost.find().sort({ position: 1 });
        res.json(reposts);
    } catch (err) {
        console.error('Ошибка получения репостов:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Создание репоста
router.post('/', authMiddleware, upload, async (req, res) => {
    try {
        console.log('Полученные данные для репоста:', req.body, req.files);
        const { title, description, link, position } = req.body;
        if (!title || !description) {
            return res.status(400).json({ error: 'Название и описание обязательны' });
        }

        const image = req.files && req.files.image ? `/uploads/${req.files.image[0].filename}` : '';
        const repost = new Repost({
            title,
            description,
            link,
            image,
            position: parseInt(position) || 0
        });

        console.log('Сохранение репоста:', repost);
        await repost.save();
        console.log('Репост сохранён, создание лога...');
        await Log.create({
            adminId: req.admin._id,
            action: 'create-repost',
            details: `Добавлен репост: ${title}`
        });
        res.status(201).json({ message: 'Репост добавлен', repost });
    } catch (err) {
        console.error('Ошибка создания репоста:', err.message, err.stack);
        res.status(500).json({ error: 'Ошибка сервера: ' + err.message });
    }
});

// Удаление репоста
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const repost = await Repost.findById(req.params.id);
        if (!repost) return res.status(404).json({ error: 'Репост не найден' });

        if (repost.image) {
            try {
                fs.unlinkSync(path.join(__dirname, '..', repost.image));
            } catch (e) {
                console.error('Ошибка удаления изображения:', e);
            }
        }

        await Repost.deleteOne({ _id: req.params.id });
        await Log.create({
            adminId: req.admin._id,
            action: 'delete-repost',
            details: `Удалён репост: ${repost.title}`
        });
        res.json({ message: 'Репост удалён' });
    } catch (err) {
        console.error('Ошибка удаления репоста:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновление позиции репоста
router.put('/:id/position', authMiddleware, async (req, res) => {
    try {
        const { position } = req.body;
        await Repost.findByIdAndUpdate(req.params.id, { position });
        res.json({ message: 'Позиция обновлена' });
    } catch (err) {
        console.error('Ошибка обновления позиции репоста:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;