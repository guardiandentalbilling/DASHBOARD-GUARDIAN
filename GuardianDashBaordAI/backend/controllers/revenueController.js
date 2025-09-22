const Revenue = require('../../models/Revenue');
const Client = require('../../models/Client');

// @desc    Get all revenue records
// @route   GET /api/revenue
// @access  Public (should be protected in production)
const getAllRevenue = async (req, res) => {
    try {
        const { 
            source, 
            status, 
            client, 
            startDate, 
            endDate, 
            page = 1, 
            limit = 50 
        } = req.query;
        
        // Build filter object
        const filter = {};
        if (source) filter.source = source;
        if (status) filter.status = status;
        if (client) filter['client.clientName'] = { $regex: client, $options: 'i' };
        
        // Date range filter
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        const revenue = await Revenue.find(filter)
            .populate('client.clientId', 'name email')
            .sort({ date: -1, createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Revenue.countDocuments(filter);

        res.json({
            revenue,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Error getting revenue:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Get single revenue record by ID
// @route   GET /api/revenue/:id
// @access  Public (should be protected in production)
const getRevenueById = async (req, res) => {
    try {
        const revenue = await Revenue.findById(req.params.id)
            .populate('client.clientId', 'name email contactPerson');
        
        if (!revenue) {
            return res.status(404).json({ msg: 'Revenue record not found' });
        }
        
        res.json(revenue);
    } catch (error) {
        console.error('Error getting revenue:', error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Revenue record not found' });
        }
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Create new revenue record
// @route   POST /api/revenue
// @access  Public (should be protected in production)
const createRevenue = async (req, res) => {
    try {
        const {
            source,
            amount,
            currency,
            date,
            description,
            clientId,
            invoice,
            period,
            periodStartDate,
            periodEndDate,
            projectDetails,
            commission,
            tags,
            recurring
        } = req.body;

        // Validate required fields
        if (!source || !amount || !clientId) {
            return res.status(400).json({ 
                msg: 'Please provide source, amount, and client' 
            });
        }

        // Get client details
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(400).json({ msg: 'Client not found' });
        }

        // Prepare invoice data
        const invoiceData = {
            invoiceDate: invoice?.invoiceDate ? new Date(invoice.invoiceDate) : new Date(),
            dueDate: invoice?.dueDate ? new Date(invoice.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            terms: invoice?.terms || 'Net 30'
        };

        // Create new revenue record
        const revenue = new Revenue({
            source,
            amount,
            currency: currency || 'USD',
            date: date ? new Date(date) : new Date(),
            description,
            client: {
                clientId: client._id,
                clientName: client.name
            },
            invoice: invoiceData,
            period: period || 'One-time',
            periodStartDate: periodStartDate ? new Date(periodStartDate) : null,
            periodEndDate: periodEndDate ? new Date(periodEndDate) : null,
            projectDetails,
            commission,
            tags: tags || [],
            recurring
        });

        const savedRevenue = await revenue.save();
        await savedRevenue.populate('client.clientId', 'name email');
        
        // Update client billing information
        await Client.findByIdAndUpdate(
            clientId,
            {
                $inc: { 'billing.totalBilled': amount }
            }
        );
        
        res.status(201).json({ 
            msg: 'Revenue record created successfully', 
            revenue: savedRevenue 
        });

    } catch (error) {
        console.error('Error creating revenue:', error.message);
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ msg: 'Validation Error', errors });
        }
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Update revenue record
// @route   PUT /api/revenue/:id
// @access  Public (should be protected in production)
const updateRevenue = async (req, res) => {
    try {
        let revenue = await Revenue.findById(req.params.id);
        if (!revenue) {
            return res.status(404).json({ msg: 'Revenue record not found' });
        }

        const {
            source,
            amount,
            currency,
            date,
            description,
            status,
            paymentDetails,
            projectDetails,
            commission,
            tags,
            notes
        } = req.body;

        // Update fields
        const updateFields = {};
        if (source) updateFields.source = source;
        if (amount !== undefined) updateFields.amount = amount;
        if (currency) updateFields.currency = currency;
        if (date) updateFields.date = new Date(date);
        if (description !== undefined) updateFields.description = description;
        if (status) updateFields.status = status;
        if (paymentDetails) updateFields.paymentDetails = { ...revenue.paymentDetails, ...paymentDetails };
        if (projectDetails) updateFields.projectDetails = projectDetails;
        if (commission) updateFields.commission = commission;
        if (tags) updateFields.tags = tags;

        // Add notes if provided
        if (notes) {
            const newNote = {
                note: notes,
                addedBy: 'System', // In production, this would be the logged-in user
                addedAt: new Date()
            };
            updateFields.$push = { notes: newNote };
        }

        revenue = await Revenue.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true, runValidators: true }
        ).populate('client.clientId', 'name email');

        res.json({ 
            msg: 'Revenue record updated successfully', 
            revenue 
        });

    } catch (error) {
        console.error('Error updating revenue:', error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Revenue record not found' });
        }
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ msg: 'Validation Error', errors });
        }
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Delete revenue record
// @route   DELETE /api/revenue/:id
// @access  Public (should be protected in production)
const deleteRevenue = async (req, res) => {
    try {
        const revenue = await Revenue.findById(req.params.id);
        
        if (!revenue) {
            return res.status(404).json({ msg: 'Revenue record not found' });
        }

        // Update client billing information
        await Client.findByIdAndUpdate(
            revenue.client.clientId,
            {
                $inc: { 
                    'billing.totalBilled': -revenue.amount,
                    'billing.totalPaid': -(revenue.paymentDetails?.paidAmount || 0)
                }
            }
        );

        await Revenue.findByIdAndDelete(req.params.id);
        
        res.json({ msg: 'Revenue record removed successfully' });

    } catch (error) {
        console.error('Error deleting revenue:', error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Revenue record not found' });
        }
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Get revenue by source
// @route   GET /api/revenue/source/:source
// @access  Public (should be protected in production)
const getRevenueBySource = async (req, res) => {
    try {
        const { source } = req.params;
        const validSources = [
            'Billing Services', 'Claims Processing', 'Insurance Verification',
            'AR Management', 'Consulting', 'Training', 'Software License',
            'Maintenance', 'Setup Fee', 'Monthly Retainer', 'Per Claim Fee',
            'Percentage Fee', 'Other'
        ];
        
        if (!validSources.includes(source)) {
            return res.status(400).json({ msg: 'Invalid revenue source' });
        }

        const revenue = await Revenue.find({ source })
            .populate('client.clientId', 'name email')
            .sort({ date: -1 });
        res.json(revenue);

    } catch (error) {
        console.error('Error getting revenue by source:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Search revenue records
// @route   GET /api/revenue/search?q=searchterm
// @access  Public (should be protected in production)
const searchRevenue = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({ msg: 'Search query is required' });
        }

        const revenue = await Revenue.find({
            $or: [
                { source: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { revenueNumber: { $regex: q, $options: 'i' } },
                { 'invoice.invoiceNumber': { $regex: q, $options: 'i' } },
                { 'client.clientName': { $regex: q, $options: 'i' } },
                { 'projectDetails.projectName': { $regex: q, $options: 'i' } },
                { tags: { $regex: q, $options: 'i' } }
            ]
        }).populate('client.clientId', 'name email')
          .sort({ date: -1 });

        res.json(revenue);

    } catch (error) {
        console.error('Error searching revenue:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Get revenue statistics
// @route   GET /api/revenue/stats
// @access  Public (should be protected in production)
const getRevenueStats = async (req, res) => {
    try {
        const { year, month } = req.query;
        
        // Build date filter for current period
        let dateFilter = {};
        if (year) {
            const startDate = new Date(year, month ? month - 1 : 0, 1);
            const endDate = month ? 
                new Date(year, month, 0) : 
                new Date(parseInt(year) + 1, 0, 0);
            dateFilter = { date: { $gte: startDate, $lte: endDate } };
        }

        // Source-wise statistics
        const sourceStats = await Revenue.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$source',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                    avgAmount: { $avg: '$amount' }
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);

        // Status-wise statistics
        const statusStats = await Revenue.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        // Client-wise statistics
        const clientStats = await Revenue.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$client.clientName',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            },
            { $sort: { totalAmount: -1 } },
            { $limit: 10 }
        ]);

        // Monthly statistics for the year
        const monthlyStats = await Revenue.aggregate([
            { 
                $match: year ? 
                    { date: { $gte: new Date(year, 0, 1), $lt: new Date(parseInt(year) + 1, 0, 1) } } :
                    {}
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' }
                    },
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                    paidAmount: { $sum: '$paymentDetails.paidAmount' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Overall statistics
        const totalRevenue = await Revenue.countDocuments(dateFilter);
        const totalAmount = await Revenue.aggregate([
            { $match: dateFilter },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalPaid = await Revenue.aggregate([
            { $match: dateFilter },
            { $group: { _id: null, total: { $sum: '$paymentDetails.paidAmount' } } }
        ]);

        const avgRevenue = totalRevenue > 0 ? 
            (totalAmount[0]?.total || 0) / totalRevenue : 0;

        res.json({
            sourceStats,
            statusStats,
            clientStats,
            monthlyStats,
            totalRevenue,
            totalAmount: totalAmount[0]?.total || 0,
            totalPaid: totalPaid[0]?.total || 0,
            outstandingAmount: (totalAmount[0]?.total || 0) - (totalPaid[0]?.total || 0),
            avgRevenue: Math.round(avgRevenue * 100) / 100
        });

    } catch (error) {
        console.error('Error getting revenue stats:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Record payment for revenue
// @route   PUT /api/revenue/:id/payment
// @access  Public (should be protected in production)
const recordPayment = async (req, res) => {
    try {
        const { amount, paymentMethod, transactionId, paidDate } = req.body;
        
        const revenue = await Revenue.findById(req.params.id);
        if (!revenue) {
            return res.status(404).json({ msg: 'Revenue record not found' });
        }

        const currentPaid = revenue.paymentDetails?.paidAmount || 0;
        const newPaidAmount = currentPaid + parseFloat(amount);

        const updatedRevenue = await Revenue.findByIdAndUpdate(
            req.params.id,
            {
                'paymentDetails.paidAmount': newPaidAmount,
                'paymentDetails.paymentMethod': paymentMethod,
                'paymentDetails.transactionId': transactionId,
                'paymentDetails.paidDate': paidDate ? new Date(paidDate) : new Date()
            },
            { new: true, runValidators: true }
        ).populate('client.clientId', 'name email');

        // Update client billing information
        await Client.findByIdAndUpdate(
            revenue.client.clientId,
            {
                $inc: { 
                    'billing.totalPaid': parseFloat(amount)
                },
                'billing.lastPaymentDate': new Date()
            }
        );

        res.json({ 
            msg: 'Payment recorded successfully', 
            revenue: updatedRevenue 
        });

    } catch (error) {
        console.error('Error recording payment:', error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Revenue record not found' });
        }
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

module.exports = {
    getAllRevenue,
    getRevenueById,
    createRevenue,
    updateRevenue,
    deleteRevenue,
    getRevenueBySource,
    searchRevenue,
    getRevenueStats,
    recordPayment
};