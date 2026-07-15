import { register as registerService, login as loginService } from '../services/auth.service.js';

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const user = await registerService(name, email, password);
        res.status(201).json({ 
            message: "User registered successfully", 
            userId: user.id 
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // The service should return { user: { id, email }, token }
        const { user, token } = await loginService(email, password);
        
        res.json({ 
            message: "Login successful", 
            user, 
            token 
        });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};