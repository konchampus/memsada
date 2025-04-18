const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    telegram: { type: String },
    tariff: { type: String },
    comments: { type: String, default: '' }, // Поле для комментариев
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);