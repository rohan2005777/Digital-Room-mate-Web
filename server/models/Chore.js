const mongoose = require('mongoose');

const choreSchema = new mongoose.Schema({
    title: { type: String, required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
    dueDate: { type: Date, required: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Chore', choreSchema);
