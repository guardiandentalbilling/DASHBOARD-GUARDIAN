const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    // Employee Information
    employeeId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Employee',
        required: true 
    },
    employeeName: { type: String, required: true },
    
    // Date and Time Tracking
    date: { 
        type: Date, 
        required: true,
        default: () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return today;
        }
    },
    checkInTime: { type: Date, required: true },
    checkOutTime: { type: Date },
    
    // Calculated Fields
    totalHours: { type: Number, default: 0 }, // in hours
    totalMinutes: { type: Number, default: 0 }, // total minutes worked
    regularHours: { type: Number, default: 0 }, // up to 8.5 hours
    overtimeHours: { type: Number, default: 0 }, // anything over 8.5 hours
    
    // Status
    status: {
        type: String,
        enum: ['Checked In', 'Checked Out', 'Incomplete'],
        default: 'Checked In'
    },
    
    // Break Time (optional for future enhancement)
    breakTime: { type: Number, default: 0 }, // in minutes
    
    // Location/IP tracking (optional)
    checkInLocation: { type: String },
    checkOutLocation: { type: String },
    ipAddress: { type: String }
}, {
    timestamps: true
});

// Calculate hours when checking out
AttendanceSchema.pre('save', function(next) {
    if (this.checkOutTime && this.checkInTime) {
        // Calculate total time worked in milliseconds
        const timeDiff = this.checkOutTime - this.checkInTime;
        
        // Convert to minutes and hours
        this.totalMinutes = Math.floor(timeDiff / (1000 * 60));
        this.totalHours = this.totalMinutes / 60;
        
        // Calculate regular hours (up to 8.5 hours = 8 hours 30 minutes)
        const regularHoursLimit = 8.5;
        
        if (this.totalHours <= regularHoursLimit) {
            this.regularHours = this.totalHours;
            this.overtimeHours = 0;
        } else {
            this.regularHours = regularHoursLimit;
            this.overtimeHours = this.totalHours - regularHoursLimit;
        }
        
        this.status = 'Checked Out';
    } else if (this.checkInTime && !this.checkOutTime) {
        this.status = 'Checked In';
    } else {
        this.status = 'Incomplete';
    }
    
    next();
});

// Index for efficient querying
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);