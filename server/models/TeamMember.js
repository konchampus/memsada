const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    image: String,
    position: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TeamMember', teamMemberSchema);