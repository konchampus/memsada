const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Case = require('../models/Case');
const authMiddleware = require('../middleware/auth');
const logAction = require('../middleware/logAction');

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Получение всех кейсов
router.get('/', async (req, res) => {
    try {
        const cases = await Case.find().sort({ position: 1 });
        res.json(cases);
    } catch (err) {
        console.error('Get cases error:', err);
        res.status(500).json({ error: 'Ошибка получения кейсов' });
    }
});

// Добавление нового кейса
router.post(
    '/',
    authMiddleware,
    upload.fields([{ name: 'image' }, { name: 'pdf' }]),
    logAction('create_case', (req) => `Кейс "${req.body.title}" создан`),
    async (req, res) => {
        try {
            const { title, description, position } = req.body;
            const image = req.files.image ? `/uploads/${req.files.image[0].filename}` : undefined;
            const pdf = req.files.pdf ? `/uploads/${req.files.pdf[0].filename}` : undefined;

            const newCase = new Case({
                title,
                description,
                image,
                pdf,
                position: position || 0
            });

            const savedCase = await newCase.save();
            res.json({ message: 'Кейс добавлен', case: savedCase });
        } catch (err) {
            console.error('Add case error:', err);
            res.status(500).json({ error: 'Ошибка добавления кейса' });
        }
    }
);

// Удаление кейса
router.delete(
    '/:id',
    authMiddleware,
    logAction('delete_case', (req) => `Кейс с ID ${req.params.id} удалён`),
    async (req, res) => {
        try {
            const caseId = req.params.id;
            const deletedCase = await Case.findByIdAndDelete(caseId);
            if (!deletedCase) {
                return res.status(404).json({ error: 'Кейс не найден' });
            }
            res.json({ message: 'Кейс удалён' });
        } catch (err) {
            console.error('Delete case error:', err);
            res.status(500).json({ error: 'Ошибка удаления кейса' });
        }
    }
);

// Обновление позиции кейса
router.put(
    '/:id/position',
    authMiddleware,
    logAction('update_case_position', (req) => `Позиция кейса с ID ${req.params.id} обновлена`),
    async (req, res) => {
        try {
            const caseId = req.params.id;
            const { position } = req.body;

            const updatedCase = await Case.findByIdAndUpdate(caseId, { position }, { new: true });
            if (!updatedCase) {
                return res.status(404).json({ error: 'Кейс не найден' });
            }
            res.json({ message: 'Позиция обновлена', case: updatedCase });
        } catch (err) {
            console.error('Update case position error:', err);
            res.status(500).json({ error: 'Ошибка обновления позиции кейса' });
        }
    }
);

module.exports = router;