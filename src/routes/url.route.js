import express from 'express';
import { shortenUrl,getUserUrls,getUrlDetails,deleteUrl } from '../controllers/url.controller.js';
import { authenticate } from '../middlewares/authmiddlewares.js';

const router = express.Router();

/**
 * @openapi
 * /api/urls/shorten:
 *   post:
 *     summary: Shorten a URL
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               originalUrl: { type: string }
 *               customCode: { type: string }
 *     responses:
 *       201: { description: "URL shortened successfully" }
 */
router.post('/shorten', authenticate, shortenUrl);
/**
 * @openapi
 * /api/urls/my-links:
 *   get:
 *     summary: List user URLs with search and pagination
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *     responses:
 *       200: { description: "List of URLs" }
 * 
 * /api/urls/details/{shortCode}:
 *   get:
 *     summary: View details for one URL
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "URL details" }
 * 
 * /api/urls/{shortCode}:
 *   delete:
 *     summary: Delete a URL
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "URL deleted" }
 */
router.get('/my-links', authenticate, getUserUrls);

router.get('/details/:shortCode', authenticate, getUrlDetails);

router.delete('/:shortCode', authenticate, deleteUrl);

export default router;