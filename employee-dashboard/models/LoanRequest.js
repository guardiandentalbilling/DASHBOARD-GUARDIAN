const mongoose = require('mongoose');

const LoanRequestSchema = new mongoose.Schema({
    // Employee Information
    employeeId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Employee',
        required: true 
    },
    employeeName: { type: String, required: true },
    employeeEmail: { type: String, required: true },
    
    // Loan Details
    loanAmount: { type: Number, required: true },
    currency: { 
        type: String, 
        enum: ['USD', 'PKR', 'EUR'],
        default: 'USD'
    },
    repaymentPlan: { 
        type: Number, 
        enum: [3, 6, 12],
        required: true 
    }, // months
    monthlyInstallment: { type: Number, required: true },
    
    // Request Details
    loanReason: { type: String, required: true },
    requestDate: { type: Date, default: Date.now },
    
    // Status Management
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Paid'],
        default: 'Pending'
    },
    
    // Admin Actions
    reviewedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    reviewDate: { type: Date },
    adminNotes: { type: String },
    
    // Repayment Tracking
    totalPaid: { type: Number, default: 0 },
    remainingBalance: { type: Number },
    repaymentHistory: [{
        amount: { type: Number, required: true },
        paymentDate: { type: Date, default: Date.now },
        paymentMethod: { type: String, default: 'Salary Deduction' },
        notes: { type: String }
    }]
}, {
    timestamps: true
});

// Calculate remaining balance before saving
LoanRequestSchema.pre('save', function(next) {
    if (this.status === 'Approved' && this.remainingBalance === undefined) {
        this.remainingBalance = this.loanAmount;
    }
    
    if (this.totalPaid > 0) {
        this.remainingBalance = this.loanAmount - this.totalPaid;
    }
    
    next();
});

module.exports = mongoose.model('LoanRequest', LoanRequestSchema);