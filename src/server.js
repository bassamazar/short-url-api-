import 'dotenv/config';
import express from 'express';
import urlRoutes from './routes/url.route.js';
import authRoutes from './routes/auth.route.js'; // Adjust path if needed
import { redirectToOriginal } from './controllers/url.controller.js';

const app = express();
app.use(express.json()); // Essential for parsing req.body


// Register your auth routes
app.use('/api/auth', authRoutes);
app.use('/api/urls', urlRoutes);
// This handles requests at the root level
app.get('/:shortCode', redirectToOriginal);

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
