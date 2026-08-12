const path = require('path');

require('dotenv').config({
    path: path.join(__dirname, '.env')
});

const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { get, run } = require('./db');
const adminRoutes = require('./routes/admin');

const app = express();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('ERROR: JWT_SECRET is missing.');
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
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

        const normalizedEmail = email.trim().toLowerCase();

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
            `INSERT INTO users (
                full_name,
                email,
                password,
                role
            )
            VALUES (?, ?, ?, ?)`,
            [
                name.trim(),
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

        console.log('LOGIN REQUEST RECEIVED');
        console.log('Email:', email);

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required.'
            });
        }

        if (!JWT_SECRET) {
            console.error('LOGIN ERROR: JWT_SECRET is missing.');

            return res.status(500).json({
                success: false,
                message: 'Server authentication configuration is missing.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await get(
            `SELECT
                id,
                full_name,
                email,
                password,
                role
             FROM users
             WHERE email = ?`,
            [normalizedEmail]
        );

        console.log('USER FOUND:', !!user);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        if (!user.password) {
            console.error('LOGIN ERROR: User has no password hash.');

            return res.status(500).json({
                success: false,
                message: 'Account password data is invalid.'
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        console.log('PASSWORD MATCH:', passwordMatch);

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

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000,
            path: '/'
        });

        console.log('LOGIN SUCCESS:', user.email);

        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            user: {
                id: user.id,
                name: user.full_name,
                email: user.email,
                role: user.role
            },
            role: user.role
        });

    } catch (error) {
        console.error('LOGIN ERROR:', error);
        console.error('LOGIN ERROR MESSAGE:', error.message);
        console.error('LOGIN ERROR STACK:', error.stack);

        return res.status(500).json({
            success: false,
            message: 'Server error during login.'
        });
    }
});

app.get('/api/me', async (req, res) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not logged in.'
            });
        }

        if (!JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: 'Server authentication configuration is missing.'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await get(
            `SELECT
                id,
                full_name,
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
                name: user.full_name,
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
    res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/'
    });

    return res.status(200).json({
        success: true,
        message: 'Logged out successfully.'
    });
});

app.use('/api/admin', adminRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found.'
    });
});

app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);

    res.status(500).json({
        success: false,
        message: 'Internal server error.'
    });
});

module.exports = app;

if (require.main === module) {
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}