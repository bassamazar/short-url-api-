import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // CHANGE THIS LINE:
        // Instead of just req.userId, nest it inside req.user
        req.user = { userId: decoded.userId }; 
        
        next();
    } catch (error) {
        res.status(403).json({ error: 'Invalid or expired token.' });
    }
};