const express = require('express');
const auth = require('../middleware/auth');
const Chore = require('../models/Chore');

const router = express.Router();

router.get('/room/:roomId', auth, async (req, res) => {
    try {
        const chores = await Chore.find({ roomId: req.params.roomId }).populate('assignedTo', '-password');
        res.json(chores);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const chore = new Chore(req.body);
        await chore.save();
        res.status(201).json(chore);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/:id/status', auth, async (req, res) => {
    try {
        const chore = await Chore.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        if (!chore) return res.status(404).json({ error: 'Chore not found' });
        res.json(chore);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const chore = await Chore.findByIdAndDelete(req.params.id);
        if (!chore) return res.status(404).json({ error: 'Chore not found' });
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
