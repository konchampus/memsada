const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Log = require('../models/Log');
const authMiddleware = require('../middleware/auth');
const logAction = require('../middleware/logAction');

// Middleware для проверки JWT-токена
const authMiddlewareLocal = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Токен не предоставлен' });
    }

    try {
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const admin = await Admin.findById(decoded.id);
        if (!admin) {
            return res.status(401).json({ error: 'Админ не найден' });
        }
        req.admin = admin;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Неверный токен' });
    }
};

// Логин админа
router.post(
    '/login',
    logAction('login', (req) => `Админ ${req.body.email} вошёл в систему`),
    async (req, res) => {
        const { email, password } = req.body;

        try {
            if (!email || !password) {
                return res.status(400).json({ error: 'Email и пароль обязательны' });
            }

            const admin = await Admin.findOne({ email });
            if (!admin) {
                return res.status(401).json({ error: 'Неверный email или пароль' });
            }

            const isMatch = await bcrypt.compare(password, admin.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Неверный email или пароль' });
            }

            const token = jwt.sign({ id: admin._id }, 'your_jwt_secret', { expiresIn: '1h' });

            res.json({ message: 'Успешный вход', token });
        } catch (err) {
            console.error('Login error:', err);
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    }
);

// Временный маршрут для создания первого админа
router.post('/create-first-admin', async (req, res) => {
    const { email, password } = req.body;
    try {
        console.log('Create admin attempt:', { email, password });

        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ error: 'Админ уже существует' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Hashed password:', hashedPassword);

        const admin = await Admin.create({ email, password: hashedPassword });
        console.log('Admin created:', admin);

        res.json({ message: 'Админ создан', admin });
    } catch (err) {
        console.error('Create admin error:', err);
        res.status(500).json({ error: 'Ошибка создания админа' });
    }
});

// Проверка токена
router.get('/verify', authMiddleware, (req, res) => {
    res.json({ message: 'Токен действителен', admin: req.admin });
});

// Получение списка админов
router.get('/admins', authMiddleware, async (req, res) => {
    try {
        const admins = await Admin.find();
        res.json(admins);
    } catch (err) {
        console.error('Get admins error:', err);
        res.status(500).json({ error: 'Ошибка получения списка админов' });
    }
});

// Создание нового админа
router.post(
    '/create-admin',
    authMiddleware,
    logAction('create_admin', (req) => `Админ ${req.admin.email} создал нового админа ${req.body.email}`),
    async (req, res) => {
        const { email, password } = req.body;
        try {
            const existingAdmin = await Admin.findOne({ email });
            if (existingAdmin) {
                return res.status(400).json({ error: 'Админ уже существует' });
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const admin = await Admin.create({ email, password: hashedPassword });

            res.json({ message: 'Админ создан', admin });
        } catch (err) {
            console.error('Create admin error:', err);
            res.status(500).json({ error: 'Ошибка создания админа' });
        }
    }
);

// Удаление админа
router.delete(
    '/delete-admin/:id',
    authMiddleware,
    logAction('delete_admin', (req) => `Админ ${req.admin.email} удалил админа с ID ${req.params.id}`),
    async (req, res) => {
        try {
            const adminId = req.params.id;
            if (adminId === req.admin._id.toString()) {
                return res.status(400).json({ error: 'Нельзя удалить самого себя' });
            }
            const admin = await Admin.findByIdAndDelete(adminId);
            if (!admin) {
                return res.status(404).json({ error: 'Админ не найден' });
            }

            res.json({ message: 'Админ удалён' });
        } catch (err) {
            console.error('Delete admin error:', err);
            res.status(500).json({ error: 'Ошибка удаления админа' });
        }
    }
);

// Получение логов
router.get('/logs', authMiddleware, async (req, res) => {
    try {
        const logs = await Log.find().populate('adminId');
        res.json(logs);
    } catch (err) {
        console.error('Get logs error:', err);
        res.status(500).json({ error: 'Ошибка получения логов' });
    }
});

// Смена пароля
router.post(
    '/change-password',
    logAction('change_password', (req) => `Админ сменил пароль`),
    async (req, res) => {
        const { token, oldPassword, newPassword } = req.body;

        try {
            const decoded = jwt.verify(token, 'your_jwt_secret');
            const admin = await Admin.findById(decoded.id);
            if (!admin) {
                return res.status(401).json({ error: 'Админ не найден' });
            }

            const isMatch = await bcrypt.compare(oldPassword, admin.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Неверный старый пароль' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            admin.password = hashedPassword;
            await admin.save();

            res.json({ message: 'Пароль изменён' });
        } catch (err) {
            console.error('Change password error:', err);
            res.status(500).json({ error: 'Ошибка смены пароля' });
        }
    }
);

module.exports = router;