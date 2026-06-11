const success = (res, data = {}, message = 'Operation successful', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

const created = (res, data = {}, message = 'Created successfully') => {
    return success(res, data, message, 201);
};

const error = (res, message = 'Something went wrong', statusCode = 500) => {
    return res.status(statusCode).json({
        success: false,
        message,
    });
};

const validationError = (res, errors) => {
    return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors,
    });
};

module.exports = { success, created, error, validationError };
