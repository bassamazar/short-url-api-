import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db/prisma.js';

// Ensure this matches the secret you add to your .env file
const JWT_SECRET = process.env.JWT_SECRET ;

export const register = async (name, email, password) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
        },
    });
    return newUser;
};

export const login = async (email, password) => {
    // 1. Find the user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("Invalid email or password");

    // 2. Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Invalid email or password");

    // 3. Generate JWT
    const token = jwt.sign(
        { userId: user.id }, 
        JWT_SECRET, 
        { expiresIn: '1h' }
    );

    // 4. Return user info (excluding password) and the token
    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name
        },
        token
    };
};

