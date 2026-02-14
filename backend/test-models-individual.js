
console.log('Testing individual model imports...');

const testImport = async (name, path) => {
    try {
        await import(path);
        console.log(`✓ ${name} imported`);
    } catch (e) {
        console.error(`✗ ${name} failed:`, e.message);
    }
};

(async () => {
    await testImport('Profile', './src/models/Profile.js');
    await testImport('Location', './src/models/Location.js');
    await testImport('Category', './src/models/Category.js');
    await testImport('Item', './src/models/Item.js');
    await testImport('LendingLog', './src/models/LendingLog.js');
})();
