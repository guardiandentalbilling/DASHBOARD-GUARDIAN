const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true, // Har email unique hona chahiye
        },
        username: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
            lowercase: true
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            required: true,
            default: 'employee', // Agar role na batayen to default employee hoga
        },
    },
    {
        timestamps: true, // Created aur updated time automatically add karega
    }
);

const User = mongoose.model('User', userSchema);

module.exports = User;