const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String
    },
    pdf: {
        type: String
    },
    position: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Case', caseSchema);