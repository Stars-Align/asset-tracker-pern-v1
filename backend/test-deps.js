
console.log('Testing dependency imports...');

const testImport = async (name) => {
    try {
        await import(name);
        console.log(`✓ ${name} imported`);
    } catch (e) {
        console.error(`✗ ${name} failed:`, e.message);
    }
};

(async () => {
    await testImport('bcrypt');
    await testImport('jsonwebtoken');
    await testImport('express');
    await testImport('cors');
    await testImport('helmet');
    await testImport('morgan');
    await testImport('sequelize');
    await testImport('pg');
    await testImport('pg-hstore');
})();
