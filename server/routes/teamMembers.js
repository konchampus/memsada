const express = require('express');
const router = express.Router();
const TeamMember = require('../models/TeamMember');
const Log = require('../models/Log');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Настройка Multer для загрузки изображений
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
    { name: 'name', maxCount: 1 },
    { name: 'description', maxCount: 1 },
    { name: 'position', maxCount: 1 },
    { name: 'facebook', maxCount: 1 },
    { name: 'twitter', maxCount: 1 },
    { name: 'instagram', maxCount: 1 }
]);

// Получение всех участников команды
router.get('/', async (req, res) => {
    try {
        const members = await TeamMember.find().sort({ order: 1 });
        res.json(members);
    } catch (err) {
        console.error('Ошибка получения участников команды:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Добавление нового участника
router.post('/', authMiddleware, upload, async (req, res) => {
    try {
        console.log('Полученные данные для участника команды:', req.body, req.files);
        const { name, description, facebook, twitter, instagram, order } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Имя обязательно' });
        }

        const image = req.files && req.files.image ? `/uploads/${req.files.image[0].filename}` : '';
        const lastMember = await TeamMember.findOne().sort({ order: -1 });
        const newOrder = order ? parseInt(order) : (lastMember ? lastMember.order + 1 : 0);

        const newMember = new TeamMember({
            name,
            position: req.body.position || 'Член команды', // Добавляем значение по умолчанию
            description: description || '',
            image,
            socialLinks: { facebook: facebook || '', twitter: twitter || '', instagram: instagram || '' },
            order: newOrder
        });

        console.log('Сохранение нового участника:', newMember);
        await newMember.save();
        console.log('Участник сохранён, создание лога...');
        await Log.create({
            adminId: req.admin._id,
            action: 'create-team-member',
            details: `Добавлен участник команды: ${name}`
        });
        res.status(201).json({ message: 'Участник добавлен', teamMember: newMember });
    } catch (err) {
        console.error('Ошибка добавления участника команды:', err.message, err.stack);
        res.status(500).json({ error: 'Ошибка сервера: ' + err.message });
    }
});

// Удаление участника
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const member = await TeamMember.findById(req.params.id);
        if (!member) return res.status(404).json({ error: 'Участник не найден' });

        if (member.image) {
            try {
                fs.unlinkSync(path.join(__dirname, '..', member.image));
            } catch (e) {
                console.error('Ошибка удаления изображения:', e);
            }
        }

        await TeamMember.deleteOne({ _id: req.params.id });
        await Log.create({
            adminId: req.admin._id,
            action: 'delete-team-member',
            details: `Удалён участник команды: ${member.name}`
        });
        res.json({ message: 'Участник удалён' });
    } catch (err) {
        console.error('Ошибка удаления участника команды:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновление порядка участников
router.put('/reorder', authMiddleware, async (req, res) => {
    try {
        const { members } = req.body;
        for (let i = 0; i < members.length; i++) {
            await TeamMember.findByIdAndUpdate(members[i], { order: i });
        }
        await Log.create({
            adminId: req.admin._id,
            action: 'reorder-team-members',
            details: 'Изменён порядок участников команды'
        });
        res.json({ message: 'Порядок обновлён' });
    } catch (err) {
        console.error('Ошибка изменения порядка участников:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновление позиции участника (для drag-and-drop)
router.put('/:id/position', authMiddleware, async (req, res) => {
    try {
        const { position } = req.body;
        await TeamMember.findByIdAndUpdate(req.params.id, { order: position });
        res.json({ message: 'Позиция обновлена' });
    } catch (err) {
        console.error('Ошибка обновления позиции участника:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;