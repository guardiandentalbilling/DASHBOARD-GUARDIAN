const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Client name is required'],
        trim: true,
        maxlength: [100, 'Client name cannot exceed 100 characters']
    },
    contactPerson: {
        type: String,
        required: [true, 'Contact person is required'],
        trim: true,
        maxlength: [100, 'Contact person name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please provide a valid phone number']
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: {
            type: String,
            default: 'USA'
        }
    },
    practiceType: {
        type: String,
        required: [true, 'Practice type is required'],
        enum: ['General Dentistry', 'Pediatric Dentistry', 'Orthodontics', 'Oral Surgery', 'Endodontics', 'Periodontics', 'Prosthodontics', 'Other'],
        default: 'General Dentistry'
    },
    status: {
        type: String,
        required: true,
        enum: ['Active', 'Inactive', 'Pending', 'Suspended'],
        default: 'Active'
    },
    clientNumber: {
        type: String,
        unique: true,
        required: true
    },
    contractStartDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    contractEndDate: {
        type: Date
    },
    billing: {
        totalBilled: {
            type: Number,
            default: 0,
            min: [0, 'Total billed cannot be negative']
        },
        totalPaid: {
            type: Number,
            default: 0,
            min: [0, 'Total paid cannot be negative']
        },
        outstandingBalance: {
            type: Number,
            default: 0
        },
        lastPaymentDate: Date,
        paymentTerms: {
            type: String,
            enum: ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Upon Receipt'],
            default: 'Net 30'
        }
    },
    services: [{
        serviceName: {
            type: String,
            required: true
        },
        rate: {
            type: Number,
            required: true,
            min: [0, 'Rate cannot be negative']
        },
        unit: {
            type: String,
            enum: ['Per Claim', 'Per Hour', 'Monthly', 'Percentage'],
            default: 'Per Claim'
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
    documents: [{
        filename: String,
        url: String,
        type: {
            type: String,
            enum: ['Contract', 'Insurance', 'Tax Document', 'Other']
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    logoUrl: {
        type: String,
        default: 'https://guardiandentalbilling.com/wp-content/uploads/2025/02/Logo-250-x-150-px-1.png'
    },
    website: String,
    taxId: String,
    businessLicense: String
}, {
    timestamps: true
});

// Auto-generate client number
clientSchema.pre('save', async function(next) {
    if (this.isNew && !this.clientNumber) {
        const count = await mongoose.model('Client').countDocuments();
        this.clientNumber = `GDB-C${String(count + 1).padStart(3, '0')}`;
    }
    next();
});

// Calculate outstanding balance
clientSchema.pre('save', function(next) {
    if (this.billing) {
        this.billing.outstandingBalance = this.billing.totalBilled - this.billing.totalPaid;
    }
    next();
});

// Index for better query performance
clientSchema.index({ name: 1 });
clientSchema.index({ email: 1 });
clientSchema.index({ status: 1 });
clientSchema.index({ clientNumber: 1 });
clientSchema.index({ practiceType: 1 });

module.exports = mongoose.model('Client', clientSchema);