// Test script to check user status and setup password for faculty user
const fetch = require('node-fetch');

async function setupFacultyUser() {
    try {
        // First login as admin to see users
        const adminLoginResponse = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@fiu.edu',
                password: 'admin123'
            })
        });

        const adminLoginData = await adminLoginResponse.json();
        const adminToken = adminLoginData.token;

        // Get all users
        const usersResponse = await fetch('http://localhost:3000/api/admin/users', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        const users = await usersResponse.json();
        console.log('Current users:');
        users.forEach(user => {
            console.log(`- ${user.firstName} ${user.lastName} (${user.email}) - ${user.role} - ${user.status}`);
            if (user.setupToken) {
                console.log(`  Setup URL: http://localhost:3000/setup-password.html?token=${user.setupToken}`);
            }
        });

        // Find faculty user
        const facultyUser = users.find(u => u.role === 'faculty');
        if (facultyUser && facultyUser.status === 'pending') {
            console.log(`\nFound pending faculty user: ${facultyUser.email}`);
            
            if (facultyUser.setupToken) {
                // Setup password for faculty user
                const setupResponse = await fetch('http://localhost:3000/api/auth/setup-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        token: facultyUser.setupToken,
                        password: 'faculty123'
                    })
                });

                if (setupResponse.ok) {
                    console.log('✅ Faculty user password setup successful!');
                    console.log('   Email: emailtest@fiu.edu');
                    console.log('   Password: faculty123');
                } else {
                    const errorData = await setupResponse.json();
                    console.log('❌ Password setup failed:', errorData);
                }
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

setupFacultyUser();
