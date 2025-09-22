const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Employee = require('./models/Employee');
const Client = require('./models/Client');
const Task = require('./models/Task');
const Expense = require('./models/Expense');
const Revenue = require('./models/Revenue');

const connectDB = async () => {
    try {
        let mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/employee_dashboard';
        await mongoose.connect(mongoUri);
        console.log('MongoDB Connected Successfully!');
    } catch (error) {
        console.error('MongoDB Connection Failed:', error.message);
        console.log('Cannot seed data without database connection');
        process.exit(1);
    }
};

const seedData = async () => {
    try {
        // Clear existing data
        await Employee.deleteMany({});
        await Client.deleteMany({});
        await Task.deleteMany({});
        await Expense.deleteMany({});
        await Revenue.deleteMany({});

        console.log('Cleared existing data...');

        // Seed Employees
        const employees = [
            {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@guardiandb.com',
                phone: '+1 (555) 123-4567',
                role: 'Billing Specialist',
                joiningDate: new Date('2024-01-15'),
                salaryPKR: 120000
            },
            {
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane.smith@guardiandb.com',
                phone: '+1 (555) 987-6543',
                role: 'Team Lead',
                joiningDate: new Date('2023-11-20'),
                salaryPKR: 180000
            },
            {
                firstName: 'Michael',
                lastName: 'Chen',
                email: 'michael.chen@guardiandb.com',
                phone: '+1 (555) 456-7890',
                role: 'AR Specialist',
                joiningDate: new Date('2024-03-10'),
                salaryPKR: 140000
            }
        ];

        const savedEmployees = await Employee.insertMany(employees);
        console.log('Seeded employees:', savedEmployees.length);

        // Seed Clients
        const clients = [
            {
                name: 'Dental Care Inc.',
                contactPerson: 'Dr. Emily Carter',
                email: 'emily.c@dentalcare.com',
                phone: '(555) 123-4567',
                practiceType: 'General Dentistry',
                billing: {
                    totalBilled: 45200,
                    totalPaid: 40100,
                    outstandingBalance: 5100
                }
            },
            {
                name: 'Bright Smiles LLC',
                contactPerson: 'Michael Thompson',
                email: 'm.thompson@brightsmiles.com',
                phone: '(555) 987-6543',
                practiceType: 'Pediatric Dentistry',
                billing: {
                    totalBilled: 32000,
                    totalPaid: 32000,
                    outstandingBalance: 0
                }
            },
            {
                name: 'Ortho Solutions',
                contactPerson: 'Dr. Sarah Williams',
                email: 'sarah@orthosolutions.com',
                phone: '(555) 456-7890',
                practiceType: 'Orthodontics',
                billing: {
                    totalBilled: 28500,
                    totalPaid: 25000,
                    outstandingBalance: 3500
                }
            }
        ];

        const savedClients = await Client.insertMany(clients);
        console.log('Seeded clients:', savedClients.length);

        // Seed Tasks
        const tasks = [
            {
                title: 'Follow up on Claim #12345',
                description: 'Contact insurance provider regarding denied claim',
                type: 'AR',
                priority: 'high',
                assignedTo: {
                    employee: savedEmployees[0]._id,
                    employeeName: `${savedEmployees[0].firstName} ${savedEmployees[0].lastName}`
                },
                client: {
                    clientId: savedClients[0]._id,
                    clientName: savedClients[0].name
                },
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                revenue: 250,
                status: 'in-progress'
            },
            {
                title: 'Verify new patient insurance',
                description: 'Verify eligibility for new patient John Smith',
                type: 'Insurance Verification',
                priority: 'medium',
                assignedTo: {
                    employee: savedEmployees[2]._id,
                    employeeName: `${savedEmployees[2].firstName} ${savedEmployees[2].lastName}`
                },
                client: {
                    clientId: savedClients[1]._id,
                    clientName: savedClients[1].name
                },
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
                revenue: 0,
                status: 'pending'
            }
        ];

        const savedTasks = await Task.insertMany(tasks);
        console.log('Seeded tasks:', savedTasks.length);

        // Seed Expenses
        const expenses = [
            {
                category: 'Salaries',
                amount: 5420000,
                date: new Date('2024-09-01'),
                description: 'Monthly salaries for all employees',
                status: 'Paid'
            },
            {
                category: 'Office Management',
                amount: 45000,
                date: new Date('2024-09-15'),
                description: 'Office supplies and stationery',
                status: 'Approved'
            },
            {
                category: 'Electricity Bills',
                amount: 25000,
                date: new Date('2024-09-10'),
                description: 'Monthly electricity bill',
                status: 'Paid'
            }
        ];

        const savedExpenses = await Expense.insertMany(expenses);
        console.log('Seeded expenses:', savedExpenses.length);

        // Seed Revenue
        const revenue = [
            {
                source: 'Billing Services',
                amount: 4200,
                date: new Date('2024-09-01'),
                description: 'Monthly billing services for Dental Care Inc.',
                client: {
                    clientId: savedClients[0]._id,
                    clientName: savedClients[0].name
                },
                invoice: {
                    invoiceDate: new Date('2024-09-01'),
                    dueDate: new Date('2024-10-01'),
                    terms: 'Net 30'
                },
                status: 'Paid',
                paymentDetails: {
                    paidAmount: 4200,
                    paidDate: new Date('2024-09-28'),
                    paymentMethod: 'Bank Transfer'
                }
            },
            {
                source: 'Claims Processing',
                amount: 3500,
                date: new Date('2024-09-15'),
                description: 'Claims processing services for Bright Smiles LLC',
                client: {
                    clientId: savedClients[1]._id,
                    clientName: savedClients[1].name
                },
                invoice: {
                    invoiceDate: new Date('2024-09-15'),
                    dueDate: new Date('2024-10-15'),
                    terms: 'Net 30'
                },
                status: 'Invoiced'
            }
        ];

        const savedRevenue = await Revenue.insertMany(revenue);
        console.log('Seeded revenue:', savedRevenue.length);

        console.log('Database seeded successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

// Run the seeder
connectDB().then(seedData);