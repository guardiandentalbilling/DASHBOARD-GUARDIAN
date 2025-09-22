const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('=== MongoDB Connection Setup ===');
console.log('This script will help you configure your MongoDB connection string.');
console.log('');

rl.question('Please enter your MongoDB database password: ', (password) => {
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace the placeholder with the actual password
    envContent = envContent.replace('<db_password>', password);
    
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ Database connection string updated successfully!');
    console.log('You can now start the server with: node server.js');
    
    rl.close();
});