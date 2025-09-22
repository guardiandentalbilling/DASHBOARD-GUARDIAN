const mongoose = require('mongoose');

const revenueSchema = new mongoose.Schema({
    source: {
        type: String,
        required: [true, 'Revenue source is required'],
        enum: [
            'Billing Services',
            'Claims Processing',
            'Insurance Verification',
            'AR Management',
            'Consulting',
            'Training',
            'Software License',
            'Maintenance',
            'Setup Fee',
            'Monthly Retainer',
            'Per Claim Fee',
            'Percentage Fee',
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
        default: 'USD'
    },
    date: {
        type: Date,
        required: [true, 'Revenue date is required'],
        default: Date.now
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    client: {
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client',
            required: true
        },
        clientName: {
            type: String,
            required: true
        }
    },
    invoice: {
        invoiceNumber: {
            type: String,
            unique: true,
            required: true
        },
        invoiceDate: {
            type: Date,
            required: true
        },
        dueDate: {
            type: Date,
            required: true
        },
        terms: {
            type: String,
            enum: ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Upon Receipt'],
            default: 'Net 30'
        }
    },
    status: {
        type: String,
        enum: ['Pending', 'Invoiced', 'Paid', 'Partially Paid', 'Overdue', 'Cancelled'],
        default: 'Pending'
    },
    paymentDetails: {
        paidAmount: {
            type: Number,
            default: 0,
            min: [0, 'Paid amount cannot be negative']
        },
        paidDate: Date,
        paymentMethod: {
            type: String,
            enum: ['Bank Transfer', 'Credit Card', 'Debit Card', 'Check', 'Cash', 'Online Payment', 'Other']
        },
        transactionId: String,
        remainingAmount: {
            type: Number,
            default: 0
        }
    },
    period: {
        type: String,
        enum: ['One-time', 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'],
        default: 'One-time'
    },
    periodStartDate: Date,
    periodEndDate: Date,
    revenueNumber: {
        type: String,
        unique: true,
        required: true
    },
    projectDetails: {
        projectName: String,
        projectType: String,
        hoursWorked: Number,
        hourlyRate: Number
    },
    commission: {
        salesPerson: String,
        commissionRate: {
            type: Number,
            min: [0, 'Commission rate cannot be negative'],
            max: [100, 'Commission rate cannot exceed 100%']
        },
        commissionAmount: {
            type: Number,
            default: 0
        }
    },
    tags: [{
        type: String,
        trim: true
    }],
    notes: [{
        note: String,
        addedBy: String,
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    attachments: [{
        filename: String,
        url: String,
        type: {
            type: String,
            enum: ['Invoice', 'Contract', 'Receipt', 'Report', 'Other']
        },
        uploadedAt: {
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
        nextInvoiceDate: Date,
        endDate: Date
    },
    metrics: {
        collectionDays: Number, // Days taken to collect payment
        profitMargin: Number,
        conversionRate: Number
    }
}, {
    timestamps: true
});

// Auto-generate revenue number
revenueSchema.pre('save', async function(next) {
    if (this.isNew && !this.revenueNumber) {
        const count = await mongoose.model('Revenue').countDocuments();
        this.revenueNumber = `GDB-R${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

// Auto-generate invoice number if not provided
revenueSchema.pre('save', async function(next) {
    if (this.isNew && !this.invoice.invoiceNumber) {
        const count = await mongoose.model('Revenue').countDocuments();
        this.invoice.invoiceNumber = `INV-${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

// Calculate remaining amount
revenueSchema.pre('save', function(next) {
    if (this.paymentDetails) {
        this.paymentDetails.remainingAmount = this.amount - (this.paymentDetails.paidAmount || 0);
        
        // Update status based on payment
        if (this.paymentDetails.paidAmount >= this.amount) {
            this.status = 'Paid';
        } else if (this.paymentDetails.paidAmount > 0) {
            this.status = 'Partially Paid';
        } else if (this.invoice.dueDate < new Date() && this.status !== 'Paid') {
            this.status = 'Overdue';
        }
    }
    next();
});

// Calculate collection days when payment is made
revenueSchema.pre('save', function(next) {
    if (this.isModified('paymentDetails.paidDate') && this.paymentDetails.paidDate) {
        const invoiceDate = this.invoice.invoiceDate;
        const paidDate = this.paymentDetails.paidDate;
        this.metrics.collectionDays = Math.ceil((paidDate - invoiceDate) / (1000 * 60 * 60 * 24));
    }
    next();
});

// Virtual for amount in USD (assuming exchange rate)
revenueSchema.virtual('amountUSD').get(function() {
    if (this.currency === 'USD') {
        return this.amount;
    }
    // Assuming 1 USD = 278 PKR (you can make this dynamic)
    return Math.round((this.amount / 278) * 100) / 100;
});

// Virtual for amount in PKR
revenueSchema.virtual('amountPKR').get(function() {
    if (this.currency === 'PKR') {
        return this.amount;
    }
    // Assuming 1 USD = 278 PKR (you can make this dynamic)
    return Math.round(this.amount * 278);
});

// Ensure virtual fields are serialized
revenueSchema.set('toJSON', { virtuals: true });

// Index for better query performance
revenueSchema.index({ source: 1 });
revenueSchema.index({ date: 1 });
revenueSchema.index({ status: 1 });
revenueSchema.index({ 'client.clientId': 1 });
revenueSchema.index({ 'invoice.invoiceNumber': 1 });
revenueSchema.index({ revenueNumber: 1 });

module.exports = mongoose.model('Revenue', revenueSchema);