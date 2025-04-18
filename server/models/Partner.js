const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String },
    position: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Partner', partnerSchema);