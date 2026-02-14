
console.log('Testing middleware imports...');

const testImport = async (name, path) => {
    try {
        await import(path);
        console.log(`✓ ${name} imported`);
    } catch (e) {
        console.error(`✗ ${name} failed:`, e.message);
    }
};

(async () => {
    await testImport('errorHandler', './src/middleware/errorHandler.js');
    await testImport('auth', './src/middleware/auth.js');
    await testImport('validate', './src/middleware/validate.js');
})();
