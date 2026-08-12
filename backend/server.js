const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

require('dotenv').config({
    path: path.join(__dirname, '.env')
});

const { get, all, run } = require('./db');
const adminRoutes = require('./routes/admin');

const app = express();

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('ERROR: JWT_SECRET is missing from .env');
}

const FRONTEND_PATH = path.join(__dirname, '../frontend');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(FRONTEND_PATH));

app.get('/', (req, res) => {
    res.sendFile(path.join(FRONTEND_PATH, 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(FRONTEND_PATH, 'admin', 'index.html'));
});

app.get('/admin/', (req, res) => {
    res.sendFile(path.join(FRONTEND_PATH, 'admin', 'index.html'));
});

app.get('/admin/index.html', (req, res) => {
    res.sendFile(path.join(FRONTEND_PATH, 'admin', 'index.html'));
});

app.post('/api/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and password are required.'
            });
        }

        const trimmedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (!trimmedName) {
            return res.status(400).json({
                success: false,
                message: 'Name cannot be empty.'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters.'
            });
        }

        const existingUser = await get(
            'SELECT id FROM users WHERE email = ?',
            [normalizedEmail]
        );

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await run(
            `INSERT INTO users (name, email, password, role)
             VALUES (?, ?, ?, ?)`,
            [
                trimmedName,
                normalizedEmail,
                hashedPassword,
                'user'
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Account created successfully.'
        });

    } catch (error) {
        console.error('SIGNUP ERROR:', error);

        return res.status(500).json({
            success: false,
            message: 'Server error while creating account.'
        });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required.'
            });
        }

        if (!JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: 'JWT_SECRET is missing from .env'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await get(
            `SELECT
                id,
                name,
                email,
                password,
                role
             FROM users
             WHERE email = ?`,
            [normalizedEmail]
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            JWT_SECRET,
            {
                expiresIn: '1d'
            }
        );

        const isProduction =
            process.env.NODE_ENV === 'production';

        res.cookie('token', token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000,
            path: '/'
        });

        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            role: user.role
        });

    } catch (error) {
        console.error('LOGIN ERROR:', error);

        return res.status(500).json({
            success: false,
            message: 'Server error during login.'
        });
    }
});

app.get('/api/me', async (req, res) => {
    try {
        if (!JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: 'JWT_SECRET is missing from .env'
            });
        }

        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not logged in.'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await get(
            `SELECT
                id,
                name,
                email,
                role
             FROM users
             WHERE id = ?`,
            [decoded.id]
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User no longer exists.'
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('AUTH CHECK ERROR:', error);

        return res.status(401).json({
            success: false,
            message: 'Invalid or expired login.'
        });
    }
});

app.post('/api/logout', (req, res) => {
    const isProduction =
        process.env.NODE_ENV === 'production';

    res.clearCookie('token', {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/'
    });

    return res.status(200).json({
        success: true,
        message: 'Logged out successfully.'
    });
});

app.get('/api/events', async (req, res) => {
    try {
        const events = await all(
            `SELECT
                events.id,
                events.title,
                events.description,
                events.category_id,
                categories.name AS category,
                events.organizer,
                events.venue,
                events.city,
                events.address,
                events.event_date,
                events.event_time,
                events.end_date,
                events.end_time,
                events.image,
                events.capacity,
                events.price,
                events.event_type,
                events.registration_deadline,
                events.contact_email,
                events.website,
                events.tags,
                events.status,
                events.created_at
             FROM events
             LEFT JOIN categories
                ON events.category_id = categories.id
             WHERE events.status = 'active'
             ORDER BY
                events.event_date ASC,
                events.event_time ASC`
        );

        return res.status(200).json({
            success: true,
            events: events || []
        });

    } catch (error) {
        console.error('GET EVENTS ERROR:', error);

        return res.status(500).json({
            success: false,
            message: 'Server error while loading events.'
        });
    }
});

app.use('/api/admin', adminRoutes);

app.use((req, res) => {
    console.log(
        '404 ROUTE NOT FOUND:',
        req.method,
        req.originalUrl
    );

    return res.status(404).json({
        success: false,
        message: 'Route not found.',
        route: req.originalUrl
    });
});

app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);

    return res.status(500).json({
        success: false,
        message: 'Internal server error.'
    });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log('');
        console.log('======================================');
        console.log('SERVER RUNNING');
        console.log('======================================');
        console.log(`http://localhost:${PORT}`);
        console.log(`Admin: http://localhost:${PORT}/admin`);
        console.log('======================================');
    });
}

module.exports = app;