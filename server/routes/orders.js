const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { name, email, phone, telegram, tariff, comments } = req.body;
        if (!name || !email) {
            return res.status(400).json({ error: 'Имя и email обязательны' });
        }
        const order = new Order({
            name,
            email,
            phone,
            telegram,
            tariff,
            comments
        });
        await order.save();
        res.status(201).json({ message: 'Заказ создан', order });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 'Заказ не найден' });
        }
        res.json({ message: 'Заказ удалён' });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;