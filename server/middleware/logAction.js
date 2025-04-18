const Log = require('../models/Log');

const logAction = (action, details) => async (req, res, next) => {
    try {
        if (!req.admin) {
            throw new Error('Админ не авторизован');
        }

        await Log.create({
            adminId: req.admin._id,
            action,
            details: details(req)
        });
        next();
    } catch (err) {
        console.error('Log action error:', err);
        next(); // Продолжаем выполнение даже при ошибке логирования
    }
};

module.exports = logAction;