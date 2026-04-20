const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes will be imported here
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const expenseRoutes = require('./routes/expenses');
const choreRoutes = require('./routes/chores');

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/chores', choreRoutes);

app.get('/', (req, res) => {
    res.send('Roommate OS Backend API is running!');
});

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/roommate-os';

mongoose.connect(MONGODB_URI, { family: 4 })
    .then(() => {
        console.log('Connected to MongoDB successfully.');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error.message);
    });
