
console.log('Testing model imports...');
try {
    const models = await import('./src/models/index.js');
    console.log('✓ Models imported successfully');
} catch (error) {
    console.error('✗ Models import failed:', error);
}
