
console.log('Testing route imports...');
const testImport = async (name, path) => {
    try {
        await import(path);
        console.log(`✓ ${name} imported`);
    } catch (e) {
        console.error(`✗ ${name} failed:`, e.message);
    }
};

(async () => {
    await testImport('auth', './src/routes/auth.js');
    await testImport('profiles', './src/routes/profiles.js');
    await testImport('locations', './src/routes/locations.js');
    await testImport('categories', './src/routes/categories.js');
    await testImport('items', './src/routes/items.js');
    await testImport('lendingLogs', './src/routes/lendingLogs.js');
    await testImport('dashboard', './src/routes/dashboard.js');
    await testImport('errorHandler', './src/middleware/errorHandler.js');
})();
