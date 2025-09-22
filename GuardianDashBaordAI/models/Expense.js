const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    category: {
        type: String,
        required: [true, 'Expense category is required'],
        enum: [
            'Salaries',
            'Office Management',
            'Rents',
            'Electricity Bills',
            'Gas Bills',
            'Wifi Bills',
            'Office Expenditures',
            'Food',
            'Marketing',
            'Travel',
            'Training',
            'Software',
            'Hardware',
            'Insurance',
            'Legal',
            'Accounting',
            'Other'
        ]
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    currency: {
        type: String,
        enum: ['PKR', 'USD'],
        default: 'PKR'
    },
    date: {
        type: Date,
        required: [true, 'Expense date is required'],
        default: Date.now
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    vendor: {
        name: String,
        contact: String,
        email: String
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Check', 'Online Payment', 'Other'],
        default: 'Cash'
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Paid', 'Rejected'],
        default: 'Pending'
    },
    expenseNumber: {
        type: String,
        unique: true,
        required: true
    },
    approvedBy: {
        type: String,
        trim: true
    },
    approvedDate: {
        type: Date
    },
    paidDate: {
        type: Date
    },
    tags: [{
        type: String,
        trim: true
    }],
    receipts: [{
        filename: String,
        url: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    notes: [{
        note: String,
        addedBy: String,
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    recurring: {
        isRecurring: {
            type: Boolean,
            default: false
        },
        frequency: {
            type: String,
            enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'],
            required: function() {
                return this.recurring.isRecurring;
            }
        },
        nextDueDate: Date,
        endDate: Date
    },
    taxDeductible: {
        type: Boolean,
        default: false
    },
    businessPurpose: {
        type: String,
        trim: true,
        maxlength: [300, 'Business purpose cannot exceed 300 characters']
    },
    project: {
        type: String,
        trim: true
    },
    department: {
        type: String,
        enum: ['Administration', 'Operations', 'Sales', 'Marketing', 'IT', 'HR', 'Finance', 'General'],
        default: 'General'
    }
}, {
    timestamps: true
});

// Auto-generate expense number
expenseSchema.pre('save', async function(next) {
    if (this.isNew && !this.expenseNumber) {
        const count = await mongoose.model('Expense').countDocuments();
        this.expenseNumber = `GDB-E${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

// Update paid date when status changes to paid
expenseSchema.pre('save', function(next) {
    if (this.isModified('status') && this.status === 'Paid' && !this.paidDate) {
        this.paidDate = new Date();
    }
    next();
});

// Update approved date when status changes to approved
expenseSchema.pre('save', function(next) {
    if (this.isModified('status') && this.status === 'Approved' && !this.approvedDate) {
        this.approvedDate = new Date();
    }
    next();
});

// Virtual for amount in USD (assuming exchange rate)
expenseSchema.virtual('amountUSD').get(function() {
    if (this.currency === 'USD') {
        return this.amount;
    }
    // Assuming 1 USD = 278 PKR (you can make this dynamic)
    return Math.round((this.amount / 278) * 100) / 100;
});

// Virtual for amount in PKR
expenseSchema.virtual('amountPKR').get(function() {
    if (this.currency === 'PKR') {
        return this.amount;
    }
    // Assuming 1 USD = 278 PKR (you can make this dynamic)
    return Math.round(this.amount * 278);
});

// Ensure virtual fields are serialized
expenseSchema.set('toJSON', { virtuals: true });

// Index for better query performance
expenseSchema.index({ category: 1 });
expenseSchema.index({ date: 1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ expenseNumber: 1 });
expenseSchema.index({ department: 1 });

module.exports = mongoose.model('Expense', expenseSchema);