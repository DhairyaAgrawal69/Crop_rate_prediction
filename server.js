const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
    console.error('⚠️ Unexpected pool error:', err);
});

const initializeDatabase = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                identifier VARCHAR(255) NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Database ready');
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
    }
};

const startDatabase = async () => {
    try {
        const client = await pool.connect();
        client.release();
        console.log('✅ Database connected');
        await initializeDatabase();
    } catch (err) {
        console.error('❌ Database error:', err);
    }
};

startDatabase();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const authMiddleware = (req, res, next) => {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ') ? authorization.split(' ')[1] : null;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

app.post('/api/signup', async (req, res) => {
    const { name, identifier, password } = req.body;
    if (!name || !identifier || !password) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    const normalizedIdentifier = identifier.trim().toLowerCase();

    try {
        const existing = await pool.query(
            'SELECT id FROM users WHERE identifier = $1',
            [normalizedIdentifier]
        );

        if (existing.rowCount > 0) {
            return res.status(409).json({ error: 'Account already exists.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (name, identifier, password_hash) VALUES ($1, $2, $3) RETURNING id, name, identifier',
            [name.trim(), normalizedIdentifier, passwordHash]
        );

        const user = result.rows[0];
        const token = jwt.sign({ id: user.id, name: user.name, identifier: user.identifier }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });

        return res.json({ token, name: user.name, identifier: user.identifier });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Signup failed.' });
    }
});

app.post('/api/login', async (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    const normalizedIdentifier = identifier.trim().toLowerCase();

    try {
        const result = await pool.query(
            'SELECT id, name, identifier, password_hash FROM users WHERE identifier = $1',
            [normalizedIdentifier]
        );

        if (result.rowCount === 0) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const user = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const token = jwt.sign({ id: user.id, name: user.name, identifier: user.identifier }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });

        return res.json({ token, name: user.name, identifier: user.identifier });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Login failed.' });
    }
});

app.get('/api/profile', authMiddleware, (req, res) => {
    return res.json({ user: req.user });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
