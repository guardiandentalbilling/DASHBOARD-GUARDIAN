const Attendance = require('../../models/Attendance');
const Employee = require('../../models/Employee');

// @desc    Check in employee
// @route   POST /api/attendance/checkin
// @access  Public (should be protected in production)
const checkIn = async (req, res) => {
    try {
        const { employeeId, checkInLocation, ipAddress } = req.body;

        // Validate employee exists
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ msg: 'Employee not found' });
        }

        // Check if already checked in today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const existingAttendance = await Attendance.findOne({
            employeeId,
            date: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        if (existingAttendance && existingAttendance.status === 'Checked In') {
            return res.status(400).json({ 
                msg: 'Already checked in today',
                checkInTime: existingAttendance.checkInTime
            });
        }

        // Create new attendance record
        const attendance = new Attendance({
            employeeId,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            checkInTime: new Date(),
            checkInLocation,
            ipAddress
        });

        const savedAttendance = await attendance.save();
        
        res.status(201).json({ 
            msg: 'Checked in successfully', 
            attendance: savedAttendance 
        });

    } catch (error) {
        console.error('Error checking in:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Check out employee
// @route   PUT /api/attendance/checkout
// @access  Public (should be protected in production)
const checkOut = async (req, res) => {
    try {
        const { employeeId, checkOutLocation, ipAddress } = req.body;

        // Find today's attendance record
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const attendance = await Attendance.findOne({
            employeeId,
            date: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            },
            status: 'Checked In'
        });

        if (!attendance) {
            return res.status(400).json({ msg: 'No check-in record found for today' });
        }

        // Update with checkout time
        attendance.checkOutTime = new Date();
        attendance.checkOutLocation = checkOutLocation;
        
        const updatedAttendance = await attendance.save();
        
        res.json({ 
            msg: 'Checked out successfully', 
            attendance: updatedAttendance,
            totalHours: updatedAttendance.totalHours,
            regularHours: updatedAttendance.regularHours,
            overtimeHours: updatedAttendance.overtimeHours
        });

    } catch (error) {
        console.error('Error checking out:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Get employee attendance status for today
// @route   GET /api/attendance/status/:employeeId
// @access  Public (should be protected in production)
const getTodayAttendanceStatus = async (req, res) => {
    try {
        const { employeeId } = req.params;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const attendance = await Attendance.findOne({
            employeeId,
            date: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        if (!attendance) {
            return res.json({ 
                status: 'Not Checked In',
                canCheckIn: true,
                canCheckOut: false 
            });
        }

        res.json({
            status: attendance.status,
            canCheckIn: attendance.status !== 'Checked In',
            canCheckOut: attendance.status === 'Checked In',
            checkInTime: attendance.checkInTime,
            checkOutTime: attendance.checkOutTime,
            totalHours: attendance.totalHours,
            regularHours: attendance.regularHours,
            overtimeHours: attendance.overtimeHours
        });

    } catch (error) {
        console.error('Error getting attendance status:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Get employee attendance history
// @route   GET /api/attendance/history/:employeeId
// @access  Public (should be protected in production)
const getAttendanceHistory = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { startDate, endDate, limit = 30 } = req.query;

        let query = { employeeId };

        // Add date range if provided
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const attendance = await Attendance.find(query)
            .sort({ date: -1 })
            .limit(parseInt(limit));

        // Calculate summary statistics
        const totalDays = attendance.length;
        const totalHours = attendance.reduce((sum, record) => sum + (record.totalHours || 0), 0);
        const totalRegularHours = attendance.reduce((sum, record) => sum + (record.regularHours || 0), 0);
        const totalOvertimeHours = attendance.reduce((sum, record) => sum + (record.overtimeHours || 0), 0);

        res.json({
            attendance,
            summary: {
                totalDays,
                totalHours: parseFloat(totalHours.toFixed(2)),
                totalRegularHours: parseFloat(totalRegularHours.toFixed(2)),
                totalOvertimeHours: parseFloat(totalOvertimeHours.toFixed(2)),
                averageHoursPerDay: totalDays > 0 ? parseFloat((totalHours / totalDays).toFixed(2)) : 0
            }
        });

    } catch (error) {
        console.error('Error getting attendance history:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Get all employees attendance for admin
// @route   GET /api/attendance/all
// @access  Public (should be protected in production)
const getAllAttendance = async (req, res) => {
    try {
        const { date } = req.query;
        
        let queryDate = new Date();
        if (date) {
            queryDate = new Date(date);
        }
        queryDate.setHours(0, 0, 0, 0);

        const attendance = await Attendance.find({
            date: {
                $gte: queryDate,
                $lt: new Date(queryDate.getTime() + 24 * 60 * 60 * 1000)
            }
        }).populate('employeeId', 'firstName lastName email role');

        res.json(attendance);

    } catch (error) {
        console.error('Error getting all attendance:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

// @desc    Get attendance statistics
// @route   GET /api/attendance/stats
// @access  Public (should be protected in production)
const getAttendanceStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Today's stats
        const todayStats = await Attendance.aggregate([
            {
                $match: {
                    date: {
                        $gte: today,
                        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                    }
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // This month's overtime stats
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const overtimeStats = await Attendance.aggregate([
            {
                $match: {
                    date: { $gte: thisMonth },
                    overtimeHours: { $gt: 0 }
                }
            },
            {
                $group: {
                    _id: '$employeeId',
                    totalOvertimeHours: { $sum: '$overtimeHours' },
                    employeeName: { $first: '$employeeName' }
                }
            },
            { $sort: { totalOvertimeHours: -1 } }
        ]);

        res.json({
            todayStats,
            overtimeStats
        });

    } catch (error) {
        console.error('Error getting attendance stats:', error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
};

module.exports = {
    checkIn,
    checkOut,
    getTodayAttendanceStatus,
    getAttendanceHistory,
    getAllAttendance,
    getAttendanceStats
};