const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

    // PostgreSQL unique violation
    if (err.code === '23505') {
        return res.status(409).json({ success: false, message: 'Record already exists.' });
    }
    // PostgreSQL foreign key violation
    if (err.code === '23503') {
        return res.status(400).json({ success: false, message: 'Referenced record not found.' });
    }

    const status  = err.statusCode || err.status || 500;
    const message = err.message || 'Internal server error';

    res.status(status).json({ success: false, message });
};

const notFound = (req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
};

module.exports = { errorHandler, notFound };
