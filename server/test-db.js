const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
console.log('Connecting to:', MONGODB_URI.replace(/:([^@]+)@/, ':****@'));

mongoose.connect(MONGODB_URI, { 
    serverSelectionTimeoutMS: 5000,
    family: 4 
})
    .then(() => {
        console.log('Connected successfully');
        process.exit(0);
    })
    .catch(err => {
        console.error('Connection error message:', err.message);
        console.error('Connection error stack:', err.stack);
        process.exit(1);
    });
