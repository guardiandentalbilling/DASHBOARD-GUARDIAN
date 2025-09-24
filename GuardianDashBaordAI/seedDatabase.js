const mongoose = require('mongoose');
const Employee = require('./models/Employee');
const User = require('./models/user');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for seeding...');
    } catch (error) {
        console.error('MongoDB Connection Failed:', error.message);
        process.exit(1);
    }
};

const sampleEmployees = [
    {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@guardiandb.com",
        phone: "+92-300-1234567",
        role: "Billing Specialist",
        joiningDate: new Date("2024-01-15"),
        salaryPKR: 120000,
        overtime: 500,
        client: "Dental Care Inc.",
        task: "Insurance Verification",
        status: "Active"
    },
    {
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@guardiandb.com",
        phone: "+92-301-2345678",
        role: "Team Lead",
        joiningDate: new Date("2023-03-10"),
        salaryPKR: 150000,
        overtime: 600,
        client: "Bright Smiles LLC",
        task: "Claims Processing",
        status: "Active"
    },
    {
        firstName: "Ahmed",
        lastName: "Khan",
        email: "ahmed.khan@guardiandb.com",
        phone: "+92-302-3456789",
        role: "AR Specialist",
        joiningDate: new Date("2023-08-22"),
        salaryPKR: 110000,
        overtime: 450,
        client: "Ortho Solutions",
        task: "Claims Follow-up",
        status: "Active"
    },
    {
        firstName: "Sarah",
        lastName: "Wilson",
        email: "sarah.wilson@guardiandb.com",
        phone: "+92-303-4567890",
        role: "Account Manager",
        joiningDate: new Date("2023-11-05"),
        salaryPKR: 140000,
        overtime: 550,
        client: "Guardian AI",
        task: "Client Onboarding",
        status: "On Leave"
    },
    {
        firstName: "Mike",
        lastName: "Johnson",
        email: "mike.johnson@guardiandb.com",
        phone: "+92-304-5678901",
        role: "IT Support",
        joiningDate: new Date("2024-02-20"),
        salaryPKR: 100000,
        overtime: 400,
        client: "Internal",
        task: "System Maintenance",
        status: "Active"
    }
];

const seedDatabase = async () => {
    try {
        await connectDB();
        
        // Clear existing employees
        await Employee.deleteMany({});
        console.log('Existing employees cleared');
        
        // Insert sample employees
        const createdEmployees = await Employee.insertMany(sampleEmployees);
        console.log(`${createdEmployees.length} sample employees created successfully!`);
        
        // Display created employees
        console.log('\nCreated Employees:');
        createdEmployees.forEach((emp, index) => {
            console.log(`${index + 1}. ${emp.firstName} ${emp.lastName} - ${emp.role} (${emp.status})`);
        });

        // --- USER SEEDING LOGIC ---
        await User.deleteMany({});
        console.log('Existing users cleared');

        // Add your real admin user here
        const adminPassword = await bcrypt.hash('shakeel12', 10); // Password for admin user
        const adminUser = {
            name: 'shakeel',
            email: 'shakeel@guardiandb.com', // You can change this email if needed
            password: adminPassword,
            role: 'admin'
        };
        const createdUser = await User.create(adminUser);
        console.log(`Admin user created: ${createdUser.email}`);
        
        process.exit(0);
        
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

// Run the seeder
if (require.main === module) {
    console.log('Seeding database with sample employees...');
    seedDatabase();
}

module.exports = { seedDatabase, sampleEmployees };