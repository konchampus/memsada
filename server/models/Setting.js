const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    bannerEnabled: { type: Boolean, default: false },
    bannerText: { type: String, default: '' },
    bannerColor: { type: String, default: '#007bff' },
    bannerImage: { type: String },
    videoUrl: { type: String, default: '/assets/demo.mp4' },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Setting', settingSchema);