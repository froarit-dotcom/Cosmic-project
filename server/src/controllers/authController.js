const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../db');

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await prisma.user.findUnique({ where: { username } });

        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, fullName: user.fullName, permissions: JSON.parse(user.permissions || "[]") },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '12h' }
        );

        res.json({ token, user: { id: user.id, username: user.username, role: user.role, fullName: user.fullName, permissions: JSON.parse(user.permissions || "[]") } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const createAdmin = async (req, res) => {
    try {
        const { username, password, fullName } = req.body;

        // Check if any admin exists
        const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
        if (adminCount > 0) {
            return res.status(403).json({ error: 'Admin account already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const admin = await prisma.user.create({
            data: {
                username,
                passwordHash,
                fullName,
                role: 'ADMIN'
            }
        });
        res.json({ message: 'Admin account created successfully', admin });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({ select: { id: true, username: true, fullName: true, role: true, phone: true, permissions: true } });
        res.json(users);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

const createUser = async (req, res) => {
    try {
        const { username, password, fullName, role, phone, permissions } = req.body;
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { username, passwordHash, fullName, role: role || 'EMPLOYEE', phone, permissions: JSON.stringify(permissions || []) }
        });
        res.json({ success: true, user: { id: user.id } });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, phone, permissions, password } = req.body;
        const data = { fullName, phone };

        if (permissions) data.permissions = JSON.stringify(permissions);
        if (password && password.trim()) data.passwordHash = await bcrypt.hash(password, 10);

        await prisma.user.update({ where: { id }, data });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

const deleteUser = async (req, res) => {
    try {
        await prisma.user.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

module.exports = { login, createAdmin, getUsers, createUser, updateUser, deleteUser };
