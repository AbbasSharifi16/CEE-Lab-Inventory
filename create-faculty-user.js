// Create a faculty user for testing restrictions
const fetch = require('node-fetch');

async function createFacultyUser() {
    try {
        // Login as admin
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

        // Create a faculty user with limited lab access
        const createUserResponse = await fetch('http://localhost:3000/api/admin/users', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                firstName: 'Faculty',
                lastName: 'TestUser',
                email: 'faculty.test@fiu.edu',
                pantherId: 'FAC001',
                phoneNumber: '305-555-0199',
                role: 'faculty',
                authorizedLabs: ['EC3625'] // Only one lab for testing
            })
        });

        if (createUserResponse.ok) {
            const createUserData = await createUserResponse.json();
            console.log('✅ Faculty user created successfully!');
            console.log('Setup URL:', createUserData.setupUrl);
            
            // Extract token from URL
            const setupToken = createUserData.setupUrl.split('token=')[1];
            
            // Setup password
            const setupResponse = await fetch('http://localhost:3000/api/auth/setup-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: setupToken,
                    password: 'faculty123'
                })
            });

            if (setupResponse.ok) {
                console.log('✅ Faculty user password setup successful!');
                console.log('   Email: faculty.test@fiu.edu');
                console.log('   Password: faculty123');
                console.log('   Authorized Labs: EC3625 only');
            } else {
                console.log('❌ Password setup failed');
            }
        } else {
            const errorData = await createUserResponse.json();
            console.log('❌ User creation failed:', errorData);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

createFacultyUser();
