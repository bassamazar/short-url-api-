import express from 'express';
import { shortenUrl,getUserUrls,getUrlDetails,deleteUrl } from '../controllers/url.controller.js';
import { authenticate } from '../middlewares/authmiddlewares.js';

const router = express.Router();

// This route is now protected!
router.post('/shorten', authenticate, shortenUrl);
// Add this authenticated route
router.get('/my-links', authenticate, getUserUrls);

router.get('/details/:shortCode', authenticate, getUrlDetails);

router.delete('/:shortCode', authenticate, deleteUrl);

export default router;