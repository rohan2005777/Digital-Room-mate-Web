const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    splitWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['pending', 'settled'], default: 'pending' },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
