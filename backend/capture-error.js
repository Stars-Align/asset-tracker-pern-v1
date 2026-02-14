
import fs from 'fs';

(async () => {
    try {
        await import('./src/middleware/auth.js');
        console.log('Success');
    } catch (e) {
        fs.writeFileSync('clean-error.txt', e.stack || e.toString());
        console.log('Error captured');
    }
})();
