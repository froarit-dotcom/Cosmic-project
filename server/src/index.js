const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const masterRoutes = require('./routes/masterRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const crmRoutes = require('./routes/crmRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', masterRoutes);
app.use('/api', inventoryRoutes);
app.use('/api', crmRoutes);
app.use('/api', invoiceRoutes);
app.use('/api', dashboardRoutes);
app.use('/api/ai', require('./routes/aiRoutes'));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
