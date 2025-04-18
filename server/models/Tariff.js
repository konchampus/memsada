const mongoose = require('mongoose');

const tariffSchema = new mongoose.Schema({
    title: { type: String, required: true },
    shortDescription: { type: String, required: true },
    fullDescription: String,
    features: [String],
    image: String,
    isVisible: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Tariff', tariffSchema);