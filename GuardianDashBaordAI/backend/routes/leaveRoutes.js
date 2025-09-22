const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Sample leave requests data (replace with actual database)
let leaveRequests = [
    {
        id: 1,
        employeeName: "John Doe",
        employeeId: "EMP001",
        email: "john.doe@company.com",
        leaveType: "vacation",
        startDate: "2025-01-15",
        endDate: "2025-01-20",
        duration: 5,
        reason: "Family vacation to Hawaii",
        status: "pending",
        submittedDate: "2025-01-05T10:30:00Z",
        adminComment: null,
        approvedBy: null,
        actionDate: null
    },
    {
        id: 2,
        employeeName: "Jane Smith",
        employeeId: "EMP002",
        email: "jane.smith@company.com",
        leaveType: "sick",
        startDate: "2025-01-10",
        endDate: "2025-01-12",
        duration: 3,
        reason: "Medical treatment",
        status: "approved",
        submittedDate: "2025-01-08T09:15:00Z",
        adminComment: "Approved for medical reasons",
        approvedBy: "admin",
        actionDate: "2025-01-08T14:20:00Z"
    },
    {
        id: 3,
        employeeName: "Mike Johnson",
        employeeId: "EMP003",
        email: "mike.johnson@company.com",
        leaveType: "personal",
        startDate: "2025-02-01",
        endDate: "2025-02-01",
        duration: 1,
        reason: "Personal appointment",
        status: "pending",
        submittedDate: "2025-01-20T11:45:00Z",
        adminComment: null,
        approvedBy: null,
        actionDate: null
    }
];

let nextId = 4;

// Get all leave requests (admin only)
router.get('/', authenticateToken, (req, res) => {
    try {
        const { status, leaveType, employeeId } = req.query;
        
        let filteredRequests = [...leaveRequests];
        
        if (status) {
            filteredRequests = filteredRequests.filter(request => request.status === status);
        }
        
        if (leaveType) {
            filteredRequests = filteredRequests.filter(request => request.leaveType === leaveType);
        }
        
        if (employeeId) {
            filteredRequests = filteredRequests.filter(request => request.employeeId === employeeId);
        }
        
        // Sort by submitted date (newest first)
        filteredRequests.sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate));
        
        res.json({
            success: true,
            data: filteredRequests,
            total: filteredRequests.length
        });
    } catch (error) {
        console.error('Error fetching leave requests:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching leave requests',
            error: error.message
        });
    }
});

// Get leave request by ID
router.get('/:id', authenticateToken, (req, res) => {
    try {
        const requestId = parseInt(req.params.id);
        const leaveRequest = leaveRequests.find(request => request.id === requestId);
        
        if (!leaveRequest) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found'
            });
        }
        
        res.json({
            success: true,
            data: leaveRequest
        });
    } catch (error) {
        console.error('Error fetching leave request:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching leave request',
            error: error.message
        });
    }
});

// Submit new leave request
router.post('/', authenticateToken, (req, res) => {
    try {
        const {
            employeeName,
            employeeId,
            email,
            leaveType,
            startDate,
            endDate,
            reason
        } = req.body;
        
        // Validate required fields
        if (!employeeName || !employeeId || !leaveType || !startDate || !endDate || !reason) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }
        
        // Calculate duration
        const start = new Date(startDate);
        const end = new Date(endDate);
        const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        
        const newRequest = {
            id: nextId++,
            employeeName,
            employeeId,
            email,
            leaveType,
            startDate,
            endDate,
            duration,
            reason,
            status: 'pending',
            submittedDate: new Date().toISOString(),
            adminComment: null,
            approvedBy: null,
            actionDate: null
        };
        
        leaveRequests.push(newRequest);
        
        res.status(201).json({
            success: true,
            message: 'Leave request submitted successfully',
            data: newRequest
        });
    } catch (error) {
        console.error('Error submitting leave request:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting leave request',
            error: error.message
        });
    }
});

// Approve/Reject leave request (admin only)
router.post('/:id/action', authenticateToken, (req, res) => {
    try {
        const requestId = parseInt(req.params.id);
        const { action, comment } = req.body;
        
        if (!action || (action !== 'approve' && action !== 'reject')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid action. Must be "approve" or "reject"'
            });
        }
        
        const leaveRequest = leaveRequests.find(request => request.id === requestId);
        
        if (!leaveRequest) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found'
            });
        }
        
        if (leaveRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Leave request has already been processed'
            });
        }
        
        // Update request status
        leaveRequest.status = action === 'approve' ? 'approved' : 'rejected';
        leaveRequest.adminComment = comment || null;
        leaveRequest.approvedBy = req.user?.email || 'admin';
        leaveRequest.actionDate = new Date().toISOString();
        
        res.json({
            success: true,
            message: `Leave request ${action}d successfully`,
            data: leaveRequest
        });
    } catch (error) {
        console.error('Error processing leave request:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing leave request',
            error: error.message
        });
    }
});

// Get leave statistics
router.get('/stats/summary', authenticateToken, (req, res) => {
    try {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const today = new Date().toISOString().split('T')[0];
        
        const stats = {
            pending: leaveRequests.filter(r => r.status === 'pending').length,
            approvedThisMonth: leaveRequests.filter(r => {
                const actionDate = new Date(r.actionDate);
                return r.status === 'approved' && 
                       actionDate.getMonth() === currentMonth && 
                       actionDate.getFullYear() === currentYear;
            }).length,
            rejectedThisMonth: leaveRequests.filter(r => {
                const actionDate = new Date(r.actionDate);
                return r.status === 'rejected' && 
                       actionDate.getMonth() === currentMonth && 
                       actionDate.getFullYear() === currentYear;
            }).length,
            onLeaveToday: leaveRequests.filter(r => 
                r.status === 'approved' && 
                r.startDate <= today && 
                r.endDate >= today
            ).length,
            totalRequests: leaveRequests.length
        };
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching leave statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching leave statistics',
            error: error.message
        });
    }
});

// Delete leave request (admin only)
router.delete('/:id', authenticateToken, (req, res) => {
    try {
        const requestId = parseInt(req.params.id);
        const index = leaveRequests.findIndex(request => request.id === requestId);
        
        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found'
            });
        }
        
        leaveRequests.splice(index, 1);
        
        res.json({
            success: true,
            message: 'Leave request deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting leave request:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting leave request',
            error: error.message
        });
    }
});

// Get employee's own leave requests
router.get('/employee/:employeeId', authenticateToken, (req, res) => {
    try {
        const { employeeId } = req.params;
        const employeeRequests = leaveRequests.filter(request => request.employeeId === employeeId);
        
        // Sort by submitted date (newest first)
        employeeRequests.sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate));
        
        res.json({
            success: true,
            data: employeeRequests,
            total: employeeRequests.length
        });
    } catch (error) {
        console.error('Error fetching employee leave requests:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching employee leave requests',
            error: error.message
        });
    }
});

module.exports = router;