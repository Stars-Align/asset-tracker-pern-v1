import fs from 'node:fs';

async function list() {
    const key = 'AIzaSyDzCE06lap7WuK-Wp5J29KEZd1i7t4Zxhg';
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await res.json();
        if (!data.models) {
            console.error('Error from API:', data);
            return;
        }
        const models = data.models.map(m => m.name.replace('models/', ''));
        fs.writeFileSync('models_verified.json', JSON.stringify(models, null, 2));
        console.log('Saved models to models_verified.json');
        console.log('Models found:', models.join(', '));
    } catch (e) {
        console.error(e);
    }
}
list();
