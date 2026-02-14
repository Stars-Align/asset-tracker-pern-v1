import { Item, Location } from './src/models/index.js';

async function debugLatestItem() {
    try {
        const item = await Item.findOne({
            order: [['created_at', 'DESC']],
            include: [
                {
                    model: Location,
                    as: 'location',
                    include: [
                        {
                            model: Location,
                            as: 'parent',
                        },
                    ],
                },
            ],
            logging: false,
        });

        if (item) {
            console.log('Latest Item:', item.name);
            console.log('Location:', item.location ? item.location.name : 'None');
            console.log('Parent:', item.location && item.location.parent ? item.location.parent.name : 'None');
            console.log('Full Structure:', JSON.stringify(item.location, null, 2));
        } else {
            console.log('No items found');
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

debugLatestItem();
