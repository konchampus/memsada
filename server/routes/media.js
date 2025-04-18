const express = require('express');
const router = express.Router();
const Media = require('../models/Media');
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

// Получение всех публикаций
router.get('/', async (req, res) => {
    try {
        const media = await Media.find();
        res.json(media);
    } catch (err) {
        console.error('Ошибка получения публикаций в СМИ:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Создание публикации
router.post('/', authMiddleware, upload, async (req, res) => {
    try {
        console.log('Полученные данные для СМИ:', req.body, req.files);
        const { title, description, link, position } = req.body;
        if (!title || !description) {
            return res.status(400).json({ error: 'Название и описание обязательны' });
        }

        const image = req.files && req.files.image ? `/uploads/${req.files.image[0].filename}` : '';
        const media = new Media({ title, description, image, link, position: parseInt(position) || 0 });
        console.log('Сохранение публикации:', media);
        await media.save();
        console.log('Публикация сохранена, создание лога...');
        await Log.create({
            adminId: req.admin._id,
            action: 'create-media',
            details: `Добавлена публикация в СМИ: ${title}`
        });
        res.status(201).json({ message: 'Публикация добавлена', media });
    } catch (err) {
        console.error('Ошибка создания публикации в СМИ:', err.message, err.stack);
        res.status(500).json({ error: 'Ошибка сервера: ' + err.message });
    }
});

// Удаление публикации
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);
        if (!media) return res.status(404).json({ error: 'Публикация не найдена' });

        if (media.image) {
            try {
                fs.unlinkSync(path.join(__dirname, '..', media.image));
            } catch (e) {
                console.error('Ошибка удаления изображения:', e);
            }
        }

        await Media.deleteOne({ _id: req.params.id });
        await Log.create({
            adminId: req.admin._id,
            action: 'delete-media',
            details: `Удалена публикация в СМИ: ${media.title}`
        });
        res.json({ message: 'Публикация удалена' });
    } catch (err) {
        console.error('Ошибка удаления публикации в СМИ:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновление позиции (для drag-and-drop)
router.put('/:id/position', authMiddleware, async (req, res) => {
    try {
        const { position } = req.body;
        await Media.findByIdAndUpdate(req.params.id, { position });
        res.json({ message: 'Позиция обновлена' });
    } catch (err) {
        console.error('Ошибка обновления позиции СМИ:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;