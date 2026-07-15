import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// 1. Create a connection pool
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

// 2. Create the adapter
const adapter = new PrismaPg(pool);

// 3. Pass the adapter to the constructor
const prisma = new PrismaClient({ adapter });

export default prisma;