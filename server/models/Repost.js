const mongoose = require('mongoose');

const repostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    link: String,
    image: String,
    position: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Repost', repostSchema);