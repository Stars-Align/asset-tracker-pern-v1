if (!global.fetch) {
    console.error("Fetch not supported. Please use Node 18+");
    process.exit(1);
}

async function test() {
    const BASE = 'http://localhost:5002/api/auth';

    // Login with existing user (from debug logs or create new one)
    // I'll try to register a new one to guarantee it exists.
    const email = `test.avatar.${Date.now()}@example.com`;
    const password = 'password123';

    console.log('Registering', email);
    let res = await fetch(`${BASE}/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: 'Test Avatar' })
    });
    let data = await JSON.parse(await res.text());

    if (!data.success && !data.token) {
        console.log('Register failed, trying login...');
        res = await fetch(`${BASE}/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        data = await JSON.parse(await res.text());
    }

    if (!data.token) {
        console.error('Auth failed', data);
        return;
    }

    const token = data.token;
    console.log('Token:', token.substring(0, 10));

    const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    console.log('Uploading avatar...');
    res = await fetch(`${BASE}/avatar`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ avatar: image })
    });

    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text);
}

test().catch(console.error);
