
Install dependencies:
npm install

Create a .env file in the root directory:
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
JWT_SECRET="your_super_secret_key"


Run migrations:
npx prisma migrate dev --name init


Start the server:
node src/server.js

API Documentation
Authentication
POST /api/auth/register - Create a new account.

POST /api/auth/login - Receive a JWT token.

URLs
POST /api/urls/shorten - Shorten a URL (requires token).

Body: {"originalUrl": "...", "customCode": "..."}

GET /api/urls/my-links - List your links with pagination & search.

Query: ?page=1&limit=10&q=searchterm

GET /:shortCode - Redirect to original URL


