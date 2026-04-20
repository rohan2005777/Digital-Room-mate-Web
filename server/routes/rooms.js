const express = require('express');
const auth = require('../middleware/auth');
const Room = require('../models/Room');
const User = require('../models/User');

const router = express.Router();

router.post('/create', auth, async (req, res) => {
    try {
        const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const room = new Room({
            name: req.body.name,
            joinCode,
            admin: req.user._id,
            members: [req.user._id],
            agreements: [{ content: "# Roommate Agreement\n\n1. Rent is split equally.\n2. No loud music after 10 PM.\n3. Kitchen must be cleaned after use." }]
        });
        await room.save();

        await User.findByIdAndUpdate(req.user._id, {
            roomId: room._id,
            role: 'admin'
        });

        res.status(201).json(room);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/join', auth, async (req, res) => {
    try {
        const { joinCode } = req.body;
        let query = { joinCode };

        // If it looks like a MongoDB ObjectId, allow joining by ID too
        if (joinCode.length === 24 && /^[0-9a-fA-F]+$/.test(joinCode)) {
            query = { $or: [{ joinCode }, { _id: joinCode }] };
        }

        const room = await Room.findOne(query);
        if (!room) return res.status(404).json({ error: 'Room not found' });

        if (!room.members.includes(req.user._id)) {
            room.members.push(req.user._id);
            await room.save();
        }

        await User.findByIdAndUpdate(req.user._id, {
            roomId: room._id,
            role: 'member'
        });

        res.json(room);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', auth, async (req, res) => {
    try {
        const room = await Room.findById(req.params.id).populate('members', '-password');
        if (!room) return res.status(404).json({ error: 'Room not found' });

        // Ensure the admin role is correctly reflected based on the room's admin field
        const membersWithRoles = room.members.map(member => {
            const memberObj = member.toObject();
            if (room.admin && room.admin.toString() === member._id.toString()) {
                memberObj.role = 'admin';
            }
            return memberObj;
        });

        const roomObj = room.toObject();
        roomObj.members = membersWithRoles;

        res.json(roomObj);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id/leave', auth, async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) return res.status(404).json({ error: 'Room not found' });

        // Remove from members
        room.members = room.members.filter(m => m.toString() !== req.user._id.toString());
        await room.save();

        // Clear user role and room id
        await User.findByIdAndUpdate(req.user._id, { roomId: null, role: 'member' });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id/remove/:userId', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can remove members' });
        }
        const room = await Room.findById(req.params.id);
        if (!room) return res.status(404).json({ error: 'Room not found' });

        // Remove from members
        room.members = room.members.filter(m => m.toString() !== req.params.userId.toString());
        await room.save();

        // Clear user role and room id
        await User.findByIdAndUpdate(req.params.userId, { roomId: null, role: 'member' });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id/agreement', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can edit the agreement' });
        }
        const room = await Room.findById(req.params.id);
        if (!room) return res.status(404).json({ error: 'Room not found' });

        room.agreements.unshift({
            content: req.body.agreement,
            version: room.agreements.length + 1,
            signedBy: []
        });
        await room.save();
        res.json(room);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id/agreement/sign', auth, async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) return res.status(404).json({ error: 'Room not found' });

        if (room.agreements.length > 0) {
            const currentObj = room.agreements[0];
            if (!currentObj.signedBy.includes(req.user._id)) {
                currentObj.signedBy.push(req.user._id);
                await room.save();
            }
        }
        res.json(room);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can update room settings' });
        }
        const { name, rent, city } = req.body;
        const room = await Room.findByIdAndUpdate(
            req.params.id,
            { name, rent, city },
            { new: true }
        );
        if (!room) return res.status(404).json({ error: 'Room not found' });
        res.json(room);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
