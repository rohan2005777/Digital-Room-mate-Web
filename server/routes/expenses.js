const express = require('express');
const auth = require('../middleware/auth');
const Expense = require('../models/Expense');

const router = express.Router();

router.get('/room/:roomId', auth, async (req, res) => {
    try {
        const expenses = await Expense.find({ roomId: req.params.roomId }).populate('paidBy splitWith', '-password');
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const expense = new Expense({
            ...req.body,
            paidBy: req.user._id
        });
        await expense.save();
        res.status(201).json(expense);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/:id/settle', auth, async (req, res) => {
    try {
        const expense = await Expense.findByIdAndUpdate(req.params.id, { status: 'settled' }, { new: true });
        if (!expense) return res.status(404).json({ error: 'Expense not found' });
        res.json(expense);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const expense = await Expense.findByIdAndDelete(req.params.id);
        if (!expense) return res.status(404).json({ error: 'Expense not found' });
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
