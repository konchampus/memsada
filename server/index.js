const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Импорт маршрутов
const authRoutes = require('./routes/auth');
const casesRoutes = require('./routes/cases');
const tariffsRoutes = require('./routes/tariffs');
const teamMembersRoutes = require('./routes/teamMembers');
const mediaRoutes = require('./routes/media');
const repostsRoutes = require('./routes/reposts');
const ordersRouter = require('./routes/orders');
const settingsRouter = require('./routes/settings');
const partnersRouter = require('./routes/partners');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Подключение к MongoDB
mongoose.connect('mongodb://localhost:27017/memesAgency', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Подключение маршрутов
app.use('/api/auth', authRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/tariffs', tariffsRoutes);
app.use('/api/team-members', teamMembersRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/reposts', repostsRoutes);
app.use('/api/orders', ordersRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/partners', partnersRouter);

// Обработка ошибок 404 для неподдерживаемых маршрутов
app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});

app.use(express.static(path.join(__dirname, '../client')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Запуск сервера
app.listen(5000, () => console.log('Server running on port 5000'));