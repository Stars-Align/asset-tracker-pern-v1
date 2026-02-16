
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5001/api';

async function run() {
    try {
        // 1. Register
        const email = `test${Date.now()}@example.com`;
        const password = 'password123';
        console.log(`Registering user: ${email}`);

        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, full_name: 'Test User' })
        });
        const regData = await regJSON.parse(await res.text());
        console.log('Register response:', regData);

        if (!regData.success) throw new Error('Registration failed');

        // 2. Login
        console.log('Logging in...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const loginData = await loginJSON.parse(await res.text());
        console.log('Login response:', loginData);

        if (!loginData.success) throw new Error('Login failed');
        const token = loginData.data.token;

        // 3. Create Location
        console.log('Creating location with token:', token);
        const locRes = await fetch(`${BASE_URL}/locations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name: 'Debug Location' })
        });
        const locData = await locJSON.parse(await res.text());
        console.log('Create Location response:', locData);

    } catch (e) {
        console.error('Test failed:', e);
    }
}

run();
