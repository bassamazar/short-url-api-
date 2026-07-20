import { shortenUrlSchema } from '../validation/urlvalidator.js'
import prisma from '../db/prisma.js';
import { nanoid } from 'nanoid'; // You'll need to run: npm install nanoid

export const shortenUrl = async (req, res) => {
    // 1. استخدام Joi للتحقق من البيانات قبل أي شيء
    const { error, value } = shortenUrlSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    try {
        const { originalUrl, customCode } = value; // نستخدم value المعالج من Joi
        const userId = req.user.userId;

        // 2. تحديد الـ shortCode
        let shortCode = customCode;

        if (shortCode) {
            // التحقق إذا كان الكود مستخدم مسبقاً
            const existing = await prisma.url.findUnique({ where: { shortCode } });
            if (existing) {
                return res.status(400).json({ error: "Short code is already taken" });
            }
        } else {
            // توليد كود عشوائي في حال لم يتم توفير كود مخصص
            shortCode = nanoid(6);
        }

        // 3. تحديد تاريخ الانتهاء (10 ساعات)
        const expirationDate = new Date();
        expirationDate.setHours(expirationDate.getHours() + 10);

        // 4. إنشاء الرابط
        const newUrl = await prisma.url.create({
            data: {
                originalUrl,
                shortCode,
                userId,
                expiresAt: expirationDate
            }
        });

        res.status(201).json({ 
            message: "URL shortened successfully", 
            shortUrl: `http://localhost:3000/${shortCode}`,
            data: newUrl 
        });
    } catch (error) {
        console.error("DEBUG ERROR:", error);
        res.status(500).json({ error: "Failed to shorten URL", details: error.message });
    }
};

export const getUserUrls = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const searchQuery = req.query.q || ""; // Get the search term, default to empty

        const userId = req.user.userId;

        // Fetch data with BOTH pagination and search
        const [urls, totalCount] = await Promise.all([
            prisma.url.findMany({
                where: { 
                    userId,
                    originalUrl: { 
                        contains: searchQuery, 
                        mode: 'insensitive' // Makes the search case-insensitive
                    } 
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.url.count({ 
                where: { 
                    userId,
                    originalUrl: { contains: searchQuery, mode: 'insensitive' } 
                } 
            })
        ]);

        res.json({
            data: urls,
            meta: { totalItems: totalCount, currentPage: page, itemsPerPage: limit }
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch URLs" });
    }
};

export const getUrlDetails = async (req, res) => {
    try {
        const { shortCode } = req.params;
        const urlEntry = await prisma.url.findFirst({
            where: { 
                shortCode,
                userId: req.user.userId // Ensure user owns this URL
            }
        });

        if (!urlEntry) return res.status(404).json({ error: "URL not found" });
        res.json(urlEntry);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};

// 3. Delete a URL
export const deleteUrl = async (req, res) => {
    try {
        const { shortCode } = req.params;
        
        // Find and delete only if it belongs to the user
        const deleted = await prisma.url.deleteMany({
            where: { 
                shortCode,
                userId: req.user.userId 
            }
        });

        if (deleted.count === 0) return res.status(404).json({ error: "URL not found or unauthorized" });
        res.json({ message: "URL deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};

export const redirectToOriginal = async (req, res) => {
    try {
        const { shortCode } = req.params;
        
        // 1. Find the URL entry
        const urlEntry = await prisma.url.findUnique({
            where: { shortCode }
        });

        if (!urlEntry) {
            return res.status(404).json({ error: "URL not found" });
        }

        // 2. Check if the link has expired (10 hours rule)
        if (urlEntry.expiresAt && new Date() > new Date(urlEntry.expiresAt)) {
            return res.status(410).json({ error: "This link has expired" });
        }

        // 3. Increment the click count
        await prisma.url.update({
            where: { shortCode }, // or id: urlEntry.id
            data: { 
                clickCount: { increment: 1 } 
            }
        });

        // 4. Redirect the user
        return res.redirect(urlEntry.originalUrl);
    } catch (error) {
        console.error("REDIRECT ERROR:", error);
        res.status(500).json({ error: "Server error" });
    }
};


