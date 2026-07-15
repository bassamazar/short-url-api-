import { defineConfig } from 'prisma/config';
import * as dotenv from 'dotenv';

// Force load the .env file from the root
dotenv.config();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
});