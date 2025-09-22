const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Task title is required'],
        trim: true,
        maxlength: [200, 'Task title cannot exceed 200 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    type: {
        type: String,
        required: [true, 'Task type is required'],
        enum: ['AR', 'Insurance Verification', 'Claims Processing', 'Client Onboarding', 'Data Entry', 'Follow-up', 'Other'],
        default: 'Other'
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'in-progress', 'completed', 'due', 'overdue', 'previous', 'newly'],
        default: 'pending'
    },
    priority: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    assignedTo: {
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            required: true
        },
        employeeName: {
            type: String,
            required: true
        }
    },
    client: {
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client'
        },
        clientName: {
            type: String,
            required: true
        }
    },
    taskNumber: {
        type: String,
        unique: true,
        required: true
    },
    revenue: {
        type: Number,
        default: 0,
        min: [0, 'Revenue cannot be negative']
    },
    dueDate: {
        type: Date,
        required: true
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    completedDate: {
        type: Date
    },
    estimatedHours: {
        type: Number,
        min: [0, 'Estimated hours cannot be negative']
    },
    actualHours: {
        type: Number,
        min: [0, 'Actual hours cannot be negative']
    },
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
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Auto-generate task number
taskSchema.pre('save', async function(next) {
    if (this.isNew && !this.taskNumber) {
        const count = await mongoose.model('Task').countDocuments();
        this.taskNumber = `GDB-T${String(count + 1).padStart(3, '0')}`;
    }
    next();
});

// Update status based on due date
taskSchema.pre('save', function(next) {
    const now = new Date();
    if (this.status !== 'completed' && this.dueDate < now) {
        this.status = 'overdue';
    }
    next();
});

// Index for better query performance
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ client: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ taskNumber: 1 });

module.exports = mongoose.model('Task', taskSchema);