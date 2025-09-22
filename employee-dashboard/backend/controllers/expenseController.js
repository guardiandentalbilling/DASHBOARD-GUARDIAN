const Expense = require('../../models/Expense');

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Public (should be protected in production)
const getAllExpenses = async (req, res) => {
    try {
        const { 
            category, 
            status, 
            department, 
            startDate, 
            endDate, 
            page = 1, 
            limit = 50 
        } = req.query;
        
        // Build filter object
        const filter = {};
        if (category) filter.category = category;
        if (status) filter.status = status;
        if (department) filter.department = department;
        
        // Date range filter
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        const expenses = await Expense.find(filter)
            .sort({ date: -1, createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Expense.countDocuments(filter);

        res.json({
            expenses,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Error getting expenses:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Get single expense by ID
// @route   GET /api/expenses/:id
// @access  Public (should be protected in production)
const getExpenseById = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        
        if (!expense) {
            return res.status(404).json({ msg: 'Expense not found' });
        }
        
        res.json(expense);
    } catch (error) {
        console.error('Error getting expense:', error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Expense not found' });
        }
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Public (should be protected in production)
const createExpense = async (req, res) => {
    try {
        const {
            category,
            amount,
            currency,
            date,
            description,
            vendor,
            paymentMethod,
            tags,
            businessPurpose,
            project,
            department,
            taxDeductible,
            recurring
        } = req.body;

        // Validate required fields
        if (!category || !amount) {
            return res.status(400).json({ 
                msg: 'Please provide category and amount' 
            });
        }

        // Create new expense
        const expense = new Expense({
            category,
            amount,
            currency: currency || 'PKR',
            date: date ? new Date(date) : new Date(),
            description,
            vendor,
            paymentMethod: paymentMethod || 'Cash',
            tags: tags || [],
            businessPurpose,
            project,
            department: department || 'General',
            taxDeductible: taxDeductible || false,
            recurring
        });

        const savedExpense = await expense.save();
        
        res.status(201).json({ 
            msg: 'Expense created successfully', 
            expense: savedExpense 
        });

    } catch (error) {
        console.error('Error creating expense:', error.message);
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ msg: 'Validation Error', errors });
        }
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Public (should be protected in production)
const updateExpense = async (req, res) => {
    try {
        let expense = await Expense.findById(req.params.id);
        if (!expense) {
            return res.status(404).json({ msg: 'Expense not found' });
        }

        const {
            category,
            amount,
            currency,
            date,
            description,
            vendor,
            paymentMethod,
            status,
            approvedBy,
            tags,
            businessPurpose,
            project,
            department,
            taxDeductible,
            recurring,
            notes
        } = req.body;

        // Update fields
        const updateFields = {};
        if (category) updateFields.category = category;
        if (amount !== undefined) updateFields.amount = amount;
        if (currency) updateFields.currency = currency;
        if (date) updateFields.date = new Date(date);
        if (description !== undefined) updateFields.description = description;
        if (vendor) updateFields.vendor = vendor;
        if (paymentMethod) updateFields.paymentMethod = paymentMethod;
        if (status) updateFields.status = status;
        if (approvedBy) updateFields.approvedBy = approvedBy;
        if (tags) updateFields.tags = tags;
        if (businessPurpose !== undefined) updateFields.businessPurpose = businessPurpose;
        if (project !== undefined) updateFields.project = project;
        if (department) updateFields.department = department;
        if (taxDeductible !== undefined) updateFields.taxDeductible = taxDeductible;
        if (recurring) updateFields.recurring = recurring;

        // Add notes if provided
        if (notes) {
            const newNote = {
                note: notes,
                addedBy: 'System', // In production, this would be the logged-in user
                addedAt: new Date()
            };
            updateFields.$push = { notes: newNote };
        }

        expense = await Expense.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true, runValidators: true }
        );

        res.json({ 
            msg: 'Expense updated successfully', 
            expense 
        });

    } catch (error) {
        console.error('Error updating expense:', error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Expense not found' });
        }
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ msg: 'Validation Error', errors });
        }
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Public (should be protected in production)
const deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        
        if (!expense) {
            return res.status(404).json({ msg: 'Expense not found' });
        }

        await Expense.findByIdAndDelete(req.params.id);
        
        res.json({ msg: 'Expense removed successfully' });

    } catch (error) {
        console.error('Error deleting expense:', error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Expense not found' });
        }
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Get expenses by category
// @route   GET /api/expenses/category/:category
// @access  Public (should be protected in production)
const getExpensesByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const validCategories = [
            'Salaries', 'Office Management', 'Rents', 'Electricity Bills',
            'Gas Bills', 'Wifi Bills', 'Office Expenditures', 'Food',
            'Marketing', 'Travel', 'Training', 'Software', 'Hardware',
            'Insurance', 'Legal', 'Accounting', 'Other'
        ];
        
        if (!validCategories.includes(category)) {
            return res.status(400).json({ msg: 'Invalid category' });
        }

        const expenses = await Expense.find({ category }).sort({ date: -1 });
        res.json(expenses);

    } catch (error) {
        console.error('Error getting expenses by category:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Search expenses
// @route   GET /api/expenses/search?q=searchterm
// @access  Public (should be protected in production)
const searchExpenses = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({ msg: 'Search query is required' });
        }

        const expenses = await Expense.find({
            $or: [
                { category: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { expenseNumber: { $regex: q, $options: 'i' } },
                { 'vendor.name': { $regex: q, $options: 'i' } },
                { businessPurpose: { $regex: q, $options: 'i' } },
                { project: { $regex: q, $options: 'i' } },
                { tags: { $regex: q, $options: 'i' } }
            ]
        }).sort({ date: -1 });

        res.json(expenses);

    } catch (error) {
        console.error('Error searching expenses:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Get expense statistics
// @route   GET /api/expenses/stats
// @access  Public (should be protected in production)
const getExpenseStats = async (req, res) => {
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

        // Category-wise statistics
        const categoryStats = await Expense.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                    avgAmount: { $avg: '$amount' }
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);

        // Status-wise statistics
        const statusStats = await Expense.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        // Monthly statistics for the year
        const monthlyStats = await Expense.aggregate([
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
                    totalAmount: { $sum: '$amount' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Overall statistics
        const totalExpenses = await Expense.countDocuments(dateFilter);
        const totalAmount = await Expense.aggregate([
            { $match: dateFilter },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const avgExpense = totalExpenses > 0 ? 
            (totalAmount[0]?.total || 0) / totalExpenses : 0;

        res.json({
            categoryStats,
            statusStats,
            monthlyStats,
            totalExpenses,
            totalAmount: totalAmount[0]?.total || 0,
            avgExpense: Math.round(avgExpense * 100) / 100
        });

    } catch (error) {
        console.error('Error getting expense stats:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Approve expense
// @route   PUT /api/expenses/:id/approve
// @access  Public (should be protected in production)
const approveExpense = async (req, res) => {
    try {
        const { approvedBy } = req.body;
        
        const expense = await Expense.findByIdAndUpdate(
            req.params.id,
            {
                status: 'Approved',
                approvedBy: approvedBy || 'System',
                approvedDate: new Date()
            },
            { new: true, runValidators: true }
        );

        if (!expense) {
            return res.status(404).json({ msg: 'Expense not found' });
        }

        res.json({ 
            msg: 'Expense approved successfully', 
            expense 
        });

    } catch (error) {
        console.error('Error approving expense:', error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Expense not found' });
        }
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

module.exports = {
    getAllExpenses,
    getExpenseById,
    createExpense,
    updateExpense,
    deleteExpense,
    getExpensesByCategory,
    searchExpenses,
    getExpenseStats,
    approveExpense
};