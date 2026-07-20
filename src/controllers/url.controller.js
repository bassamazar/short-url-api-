import { shortenUrlSchema } from '../validation/urlvalidator.js'
import prisma from '../db/prisma.js';
import { nanoid } from 'nanoid'; // You'll need to run: npm install nanoid
import redisClient, { clearUserCache } from '../db/cache.js'

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

        await redisClient.set(shortCode, JSON.stringify(newUrl), { EX: 36000 });
        // تفعيل Cache Invalidation للقوائم
        await clearUserCache(userId);
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
        const searchQuery = req.query.q || "";
        const userId = req.user.userId;

        // 1. بناء مفتاح فريد يعتمد على المدخلات
        const cacheKey = `user:${userId}:urls:p${page}:l${limit}:q:${searchQuery}`;

        // 2. التحقق من الكاش
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }

        // 3. إذا لم يوجد، جلب البيانات من قاعدة البيانات
        const [urls, totalCount] = await Promise.all([
            prisma.url.findMany({
                where: { 
                    userId,
                    originalUrl: { contains: searchQuery, mode: 'insensitive' } 
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.url.count({ 
                where: { 
                    userId,
                    originalUrl: { contains: searchQuery, mode: 'insensitive' } 
                } 
            })
        ]);

        const responseData = {
            data: urls,
            meta: { totalItems: totalCount, currentPage: page, itemsPerPage: limit }
        };

        // 4. حفظ النتيجة في الكاش (مثلاً لمدة 5 دقائق لأن البيانات قد تتغير)
        await redisClient.set(cacheKey, JSON.stringify(responseData), { EX: 300 });

        res.json(responseData);
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
        const deleted = await prisma.url.deleteMany({
            where: { shortCode, userId: req.user.userId }
        });

        if (deleted.count === 0) return res.status(404).json({ error: "URL not found or unauthorized" });
        
        // 1. حذف الرابط الفردي (Redirect Key)
        await redisClient.del(shortCode);
        
        // 2. مسح القوائم المحدثة الخاصة بالمستخدم (Cache Invalidation)
        await clearUserCache(req.user.userId);
        
        res.json({ message: "URL deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};


export const redirectToOriginal = async (req, res) => {
    try {
        const { shortCode } = req.params;
        
        // التحقق من Redis أولاً
        const cachedData = await redisClient.get(shortCode);
        
        let urlEntry;
        if (cachedData) {
            urlEntry = JSON.parse(cachedData);
        } else {
            urlEntry = await prisma.url.findUnique({ where: { shortCode } });
            if (urlEntry) {
                await redisClient.set(shortCode, JSON.stringify(urlEntry), { EX: 36000 });
            }
        }

        if (!urlEntry) return res.status(404).json({ error: "URL not found" });

        if (urlEntry.expiresAt && new Date() > new Date(urlEntry.expiresAt)) {
            return res.status(410).json({ error: "This link has expired" });
        }

        await prisma.url.update({
            where: { shortCode },
            data: { clickCount: { increment: 1 } }
        });

        return res.redirect(urlEntry.originalUrl);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};


