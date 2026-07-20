import { createClient } from 'redis';

const client = createClient({
    url: 'redis://localhost:6379'
});

client.on('error', (err) => console.log('Redis Client Error', err));

await client.connect();

// الدالة المركزية لمسح كاش القوائم الخاص بمستخدم معين
export const clearUserCache = async (userId) => {
    try {
        const keys = await client.keys(`user:${userId}:urls:*`);
        if (keys.length > 0) {
            await client.del(keys);
        }
    } catch (err) {
        console.error('Error clearing user cache:', err);
    }
};

export default client;