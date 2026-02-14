console.log('Starting import test...');

try {
    console.log('1. Importing app...');
    const appModule = await import('./src/app.js');
    console.log('✓ App imported successfully');

    console.log('2. Importing config...');
    const configModule = await import('./src/config/env.js');
    console.log('✓ Config imported successfully');

    console.log('3. Importing models...');
    const modelsModule = await import('./src/models/index.js');
    console.log('✓ Models imported successfully');

    console.log('\n✓ All imports successful!');
} catch (error) {
    console.error('\n✗ Import failed:');
    console.error(error);
    process.exit(1);
}
