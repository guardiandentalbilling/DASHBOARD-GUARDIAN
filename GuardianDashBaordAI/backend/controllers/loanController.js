const LoanRequest = require('../../models/LoanRequest');
const Employee = require('../../models/Employee');

// @desc    Create new loan request
// @route   POST /api/loan-requests
// @access  Public (should be protected in production)
const createLoanRequest = async (req, res) => {
    try {
        const {
            employeeId,
            loanAmount,
            currency,
            repaymentPlan,
            loanReason
        } = req.body;

        // Validate employee exists
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ msg: 'Employee not found' });
        }

        // Calculate monthly installment
        const monthlyInstallment = loanAmount / repaymentPlan;

        // Create loan request
        const loanRequest = new LoanRequest({
            employeeId,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            employeeEmail: employee.email,
            loanAmount,
            currency,
            repaymentPlan,
            monthlyInstallment,
            loanReason,
            remainingBalance: loanAmount
        });

        const savedRequest = await loanRequest.save();
        
        res.status(201).json({ 
            msg: 'Loan request submitted successfully', 
            loanRequest: savedRequest 
        });

    } catch (error) {
        console.error('Error creating loan request:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Get all loan requests (for admin)
// @route   GET /api/loan-requests
// @access  Public (should be protected in production)
const getAllLoanRequests = async (req, res) => {
    try {
        const loanRequests = await LoanRequest.find()
            .populate('employeeId', 'firstName lastName email role')
            .sort({ requestDate: -1 });
        
        res.json(loanRequests);
    } catch (error) {
        console.error('Error getting loan requests:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Get loan requests by employee
// @route   GET /api/loan-requests/employee/:employeeId
// @access  Public (should be protected in production)
const getLoanRequestsByEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;
        
        const loanRequests = await LoanRequest.find({ employeeId })
            .sort({ requestDate: -1 });
        
        res.json(loanRequests);
    } catch (error) {
        console.error('Error getting employee loan requests:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Update loan request status (admin action)
// @route   PUT /api/loan-requests/:id/status
// @access  Public (should be protected in production)
const updateLoanRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNotes, reviewedBy } = req.body;

        const validStatuses = ['Pending', 'Approved', 'Rejected', 'Paid'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ msg: 'Invalid status' });
        }

        const loanRequest = await LoanRequest.findById(id);
        if (!loanRequest) {
            return res.status(404).json({ msg: 'Loan request not found' });
        }

        loanRequest.status = status;
        loanRequest.adminNotes = adminNotes;
        loanRequest.reviewedBy = reviewedBy;
        loanRequest.reviewDate = new Date();

        const updatedRequest = await loanRequest.save();
        
        res.json({ 
            msg: 'Loan request status updated successfully', 
            loanRequest: updatedRequest 
        });

    } catch (error) {
        console.error('Error updating loan request status:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Add payment to loan
// @route   POST /api/loan-requests/:id/payment
// @access  Public (should be protected in production)
const addLoanPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, paymentMethod, notes } = req.body;

        const loanRequest = await LoanRequest.findById(id);
        if (!loanRequest) {
            return res.status(404).json({ msg: 'Loan request not found' });
        }

        if (loanRequest.status !== 'Approved') {
            return res.status(400).json({ msg: 'Can only add payments to approved loans' });
        }

        // Add payment to history
        loanRequest.repaymentHistory.push({
            amount,
            paymentMethod: paymentMethod || 'Salary Deduction',
            notes
        });

        // Update total paid
        loanRequest.totalPaid += amount;
        
        // Check if loan is fully paid
        if (loanRequest.totalPaid >= loanRequest.loanAmount) {
            loanRequest.status = 'Paid';
            loanRequest.totalPaid = loanRequest.loanAmount; // Cap at loan amount
        }

        const updatedRequest = await loanRequest.save();
        
        res.json({ 
            msg: 'Payment added successfully', 
            loanRequest: updatedRequest 
        });

    } catch (error) {
        console.error('Error adding loan payment:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Get loan statistics
// @route   GET /api/loan-requests/stats
// @access  Public (should be protected in production)
const getLoanStats = async (req, res) => {
    try {
        const stats = await LoanRequest.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$loanAmount' }
                }
            }
        ]);

        const totalRequests = await LoanRequest.countDocuments();
        const totalLoanAmount = await LoanRequest.aggregate([
            { $group: { _id: null, total: { $sum: '$loanAmount' } } }
        ]);

        res.json({
            statusBreakdown: stats,
            totalRequests,
            totalLoanAmount: totalLoanAmount[0]?.total || 0
        });

    } catch (error) {
        console.error('Error getting loan stats:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

module.exports = {
    createLoanRequest,
    getAllLoanRequests,
    getLoanRequestsByEmployee,
    updateLoanRequestStatus,
    addLoanPayment,
    getLoanStats
};