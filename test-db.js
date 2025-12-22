const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function testConnection() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('Error: DATABASE_URL is not defined in .env');
        process.exit(1);
    }

    console.log('Connecting to:', url.split('@')[1] || 'URL (hidden)');
    const sql = neon(url);

    try {
        const result = await sql`SELECT * FROM farm LIMIT 1`;
        console.log('Success! Connection verified.');
        console.log('Query result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Database connection failed:');
        console.error(error);
    }
}

testConnection();
