const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true, // Har user ka email unique hoga
    },
    password: {
        type: String,
        required: true, // Password ko hum encrypt kar ke save karenge
    },
    role: {
        type: String,
        enum: ['admin', 'employee'], // Sirf ye do roles ho saktay hain
        default: 'employee', // Agar role na batayen to by default employee hoga
    },
    // Hum baad mein yahan aur details (jaise salary, leave balance) add kar saktay hain
}, {
    timestamps: true // Yeh automatically 'createdAt' aur 'updatedAt' ki fields add kar dega
});

module.exports = mongoose.model('User', UserSchema);