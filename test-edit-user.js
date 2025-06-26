// Test script for edit user functionality
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function testEditUser() {
    const baseUrl = 'http://localhost:3000';
    
    console.log('🧪 Testing Edit User Functionality...\n');
    
    try {
        // Step 1: Login as admin
        console.log('1. Logging in as admin...');
        const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@fiu.edu',
                password: 'admin123'
            })
        });
        
        const loginResult = await loginResponse.json();
        if (!loginResponse.ok) {
            throw new Error('Login failed: ' + loginResult.message);
        }
        
        const token = loginResult.token;
        console.log('✅ Admin login successful');
        
        // Step 2: Get list of users to find a user to edit
        console.log('\n2. Fetching user list...');
        const usersResponse = await fetch(`${baseUrl}/api/admin/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const users = await usersResponse.json();
        if (!usersResponse.ok) {
            throw new Error('Failed to fetch users: ' + users.message);
        }
        
        console.log(`✅ Found ${users.length} users`);
        
        // Step 3: Create a test user to edit if none exist (other than admin)
        let testUser = users.find(u => u.email !== 'admin@fiu.edu');
        
        if (!testUser) {
            console.log('\n3. Creating test user for editing...');
            const createResponse = await fetch(`${baseUrl}/api/admin/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    firstName: 'Test',
                    lastName: 'User',
                    email: 'testuser@fiu.edu',
                    pantherId: 'TEST001',
                    phoneNumber: '555-0123',
                    role: 'faculty',
                    authorizedLabs: ['EC3625']
                })
            });
            
            const createResult = await createResponse.json();
            if (!createResponse.ok) {
                throw new Error('Failed to create test user: ' + createResult.message);
            }
            
            // Get the created user
            const updatedUsersResponse = await fetch(`${baseUrl}/api/admin/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const updatedUsers = await updatedUsersResponse.json();
            testUser = updatedUsers.find(u => u.email === 'testuser@fiu.edu');
            console.log('✅ Test user created');
        }
        
        console.log(`\n4. Testing edit functionality on user: ${testUser.firstName} ${testUser.lastName}`);
        
        // Step 4: Get single user data
        console.log('   a. Fetching single user data...');
        const singleUserResponse = await fetch(`${baseUrl}/api/admin/users/${testUser.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const singleUser = await singleUserResponse.json();
        if (!singleUserResponse.ok) {
            throw new Error('Failed to fetch single user: ' + singleUser.message);
        }
        
        console.log('   ✅ Single user data retrieved');
        console.log(`      Original data: ${singleUser.firstName} ${singleUser.lastName}, Role: ${singleUser.role}, Labs: ${singleUser.authorizedLabs}`);
        
        // Step 5: Update user data
        console.log('   b. Updating user data...');
        const updateData = {
            firstName: 'Updated',
            lastName: 'TestUser',
            email: singleUser.email, // Keep same email
            pantherId: singleUser.pantherId, // Keep same pantherId
            phoneNumber: '555-9999',
            role: 'grant', // Change to grant role
            status: 'active',
            authorizedLabs: ['EC3625', 'EC3630', 'EC3760', 'EC3765', 'OU107', 'OU106'] // All labs for grant role
        };
        
        const updateResponse = await fetch(`${baseUrl}/api/admin/users/${testUser.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });
        
        const updateResult = await updateResponse.json();
        if (!updateResponse.ok) {
            throw new Error('Failed to update user: ' + updateResult.message);
        }
        
        console.log('   ✅ User updated successfully');
        
        // Step 6: Verify the update
        console.log('   c. Verifying update...');
        const verifyResponse = await fetch(`${baseUrl}/api/admin/users/${testUser.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const verifiedUser = await verifyResponse.json();
        if (!verifyResponse.ok) {
            throw new Error('Failed to verify update: ' + verifiedUser.message);
        }
        
        console.log(`      Updated data: ${verifiedUser.firstName} ${verifiedUser.lastName}, Role: ${verifiedUser.role}, Labs: ${verifiedUser.authorizedLabs}`);
        
        // Verify changes
        const changes = [];
        if (verifiedUser.firstName !== updateData.firstName) changes.push('firstName');
        if (verifiedUser.lastName !== updateData.lastName) changes.push('lastName');
        if (verifiedUser.phoneNumber !== updateData.phoneNumber) changes.push('phoneNumber');
        if (verifiedUser.role !== updateData.role) changes.push('role');
        if (verifiedUser.status !== updateData.status) changes.push('status');
        
        if (changes.length > 0) {
            throw new Error(`Update verification failed. Unchanged fields: ${changes.join(', ')}`);
        }
        
        console.log('   ✅ All changes verified successfully');
        
        // Step 7: Test error cases
        console.log('\n5. Testing error cases...');
        
        // Test duplicate email
        console.log('   a. Testing duplicate email protection...');
        const duplicateEmailResponse = await fetch(`${baseUrl}/api/admin/users/${testUser.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                ...updateData,
                email: 'admin@fiu.edu' // Try to use admin's email
            })
        });
        
        const duplicateEmailResult = await duplicateEmailResponse.json();
        if (duplicateEmailResponse.ok) {
            throw new Error('Duplicate email should have been rejected');
        }
        
        console.log('   ✅ Duplicate email protection working');
        
        // Test invalid role
        console.log('   b. Testing invalid role protection...');
        const invalidRoleResponse = await fetch(`${baseUrl}/api/admin/users/${testUser.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                ...updateData,
                role: 'invalid_role'
            })
        });
        
        const invalidRoleResult = await invalidRoleResponse.json();
        if (invalidRoleResponse.ok) {
            throw new Error('Invalid role should have been rejected');
        }
        
        console.log('   ✅ Invalid role protection working');
        
        console.log('\n🎉 All edit user tests passed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run the test
testEditUser();
