const mongoose = require('mongoose');

const agreementSchema = new mongoose.Schema({
    content: { type: String, required: true },
    version: { type: Number, default: 1 },
    signedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

const roomSchema = new mongoose.Schema({
    name: { type: String, required: true },
    joinCode: { type: String, required: true, unique: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    agreements: [agreementSchema],
    rent: { type: Number, default: 0 },
    city: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
