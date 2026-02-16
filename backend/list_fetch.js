async function list() {
    const key = 'AIzaSyDzCE06lap7WuK-Wp5J29KEZd1i7t4Zxhg';
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await JSON.parse(await res.text());
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}
list();
