exports.errorProvider = (res, message, status, ...args) => {
    console.log(...args)
    res.status(status).json({
        message,
    })
}

exports.catchAsync = (fn) => {
    return async (req, res, next) => {
        try {
            await fn(req, res, next)
        } catch (err) {
            console.log(err)
        }
    }
}