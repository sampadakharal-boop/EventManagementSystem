const express = require('express');
const verifyAdmin = require('../middleware/verifyAdmin');
const { get, all, run } = require('../db');

const router = express.Router();

router.get('/verify', verifyAdmin, (req, res) => {
    res.json({
        success: true,
        user: req.user || null
    });
});

router.post('/events', verifyAdmin, async (req, res) => {
    try {
        const {
            name,
            description,
            category,
            organizer,
            startDate,
            startTime,
            endDate,
            endTime,
            venue,
            city,
            address,
            capacity,
            deadline,
            eventType,
            price,
            contactEmail,
            website,
            tags
        } = req.body;

        if (
            !name ||
            !description ||
            !category ||
            !startDate ||
            !startTime ||
            !venue ||
            !city
        ) {
            return res.status(400).json({
                success: false,
                message: 'Please fill in all required fields.'
            });
        }

        let categoryRecord = await get(
            'SELECT id FROM categories WHERE name = ?',
            [category]
        );

        if (!categoryRecord) {
            const categoryResult = await run(
                'INSERT INTO categories (name) VALUES (?)',
                [category]
            );

            categoryRecord = {
                id: categoryResult.lastInsertRowid
            };
        }

        const eventResult = await run(
            `INSERT INTO events (
                title,
                description,
                category_id,
                organizer,
                venue,
                city,
                address,
                event_date,
                event_time,
                end_date,
                end_time,
                image,
                capacity,
                price,
                event_type,
                registration_deadline,
                contact_email,
                website,
                tags,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                description,
                categoryRecord.id,
                organizer || '',
                venue,
                city,
                address || '',
                startDate,
                startTime,
                endDate || null,
                endTime || null,
                null,
                Number(capacity) || 0,
                eventType === 'paid' ? Number(price) || 0 : 0,
                eventType || 'free',
                deadline || null,
                contactEmail || '',
                website || '',
                tags || '',
                'active'
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Event published successfully.',
            eventId: eventResult.lastInsertRowid
        });

    } catch (error) {
        console.error('CREATE EVENT ERROR:', error);

        res.status(500).json({
            success: false,
            message: 'Server error while creating event.'
        });
    }
});


router.get('/events', async (req, res) => {
    try {
        const events = await all(`
            SELECT
                e.id,
                e.title,
                e.description,
                e.organizer,
                e.venue,
                e.city,
                e.address,
                e.event_date,
                e.event_time,
                e.end_date,
                e.end_time,
                e.image,
                e.capacity,
                e.price,
                e.event_type,
                e.registration_deadline,
                e.contact_email,
                e.website,
                e.tags,
                e.status,
                c.name AS category
            FROM events e
            LEFT JOIN categories c ON e.category_id = c.id
            ORDER BY e.event_date ASC, e.event_time ASC
        `);

        res.json({
            success: true,
            events: events || []
        });

    } catch (error) {
        console.error('GET EVENTS ERROR:', error);

        res.status(500).json({
            success: false,
            message: 'Server error while fetching events.'
        });
    }
});


module.exports = router;