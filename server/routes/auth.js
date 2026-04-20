const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: 'User already exists' });
        }

        user = new User({
            email,
            password,
            name
        });

        await user.save();

        // Generate token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'fallback-secret-key-for-dev',
            { expiresIn: '7d' }
        );

        res.status(201).json({ user: { id: user._id, email: user.email, name: user.name, role: user.role, roomId: user.roomId }, token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'fallback-secret-key-for-dev',
            { expiresIn: '7d' }
        );

        res.json({ user: { id: user._id, email: user.email, name: user.name, role: user.role, roomId: user.roomId, photoURL: user.photoURL }, token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
    try {
        const userObj = req.user.toObject();

        if (userObj.roomId) {
            const Room = require('../models/Room');
            const room = await Room.findById(userObj.roomId);
            if (room && room.admin && room.admin.toString() === userObj._id.toString()) {
                userObj.role = 'admin';
            }
        }

        res.json(userObj);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
