const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
    // We will link this to the User model later for login
    // user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // Personal Information
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    
    // Employment Details
    role: { 
        type: String, 
        enum: ['Billing Specialist', 'Team Lead', 'AR Specialist', 'Account Manager', 'HR Manager', 'IT Support'],
        default: 'Billing Specialist' 
    },
    joiningDate: { type: Date, default: Date.now },
    
    // Salary & Compensation
    salaryPKR: { type: Number, required: true },
    overtime: { type: Number, default: 0 }, // Overtime rate per hour in PKR
    
    // Documents & Assignments
    profileImage: { type: String }, // File path or URL
    employeeDocs: [{ type: String }], // Array of document file paths/URLs
    client: { type: String }, // Assigned client
    task: { type: String }, // Assigned task
    
    // Additional fields for employee management
    leaveBalance: { type: Number, default: 20 },
    status: {
        type: String,
        enum: ['Active', 'On Leave', 'Resigned', 'Retired', 'Inactive'],
        default: 'Active'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Employee', EmployeeSchema);