
import paypal from '@paypal/checkout-server-sdk';
import { config as appConfig } from './env.js';

// Configure PayPal Environment
const configurePayPal = () => {
    // 1. Get Credentials
    // Priority: Directly from process.env, fallback to config.env (if you want), but user specified process.env
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.warn('⚠️ PayPal credentials not found in environment variables (PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET). PayPal verification will fail.');
    }

    // 2. Select Environment
    // 2. Select Environment
    let environment;
    if (process.env.NODE_ENV === 'production') {
        environment = new paypal.core.LiveEnvironment(clientId, clientSecret);
        console.log('💳 PayPal Environment: LIVE');
    } else {
        environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
        console.log('🧪 PayPal Environment: SANDBOX');
    }

    // 3. Create Client
    return new paypal.core.PayPalHttpClient(environment);
};

// Create a singleton client instance
const client = configurePayPal();

export { client, paypal };
