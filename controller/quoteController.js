const jwt = require('jsonwebtoken')
const dbConnectionPool = require('../database/database')
const { promisify } = require('util')
const { PrismaClient } = require('@prisma/client');
const { errorProvider, catchAsync } = require('../utils/errorProvider');
const prisma = new PrismaClient()

exports.tokenChecker = async (req, res, next) => {
    const token = req.headers?.cookie
    if(!token) {
       return errorProvider(res, 'invalid Token', 403);
    }
    
    try {
        const jwtVerification = await promisify(jwt.verify)(token.split('=')[1], 'superSecret')
    } catch ( err ) {
        return errorProvider(res, 'token error -' + err.message, 403)
    }

    if( !jwtVerification ) {
        return errorProvider(res, 'token error', 403)
    }

    const user = await prisma.user.findUniqueOrThrow({
        where: {
            phone: jwtVerification.phone
        }
    })

    if(!user) {
        return errorProvider(res, 'invalid token', 403)
    }

    req.user = user;

    next()
}

exports.createQuote = async (req, res) => {
    const {quote} = req.body
    
    try{
        const createdQuote = await prisma.quote.create({
            data: {
                quote,
                userId: req.user.id
            }
        })

        res.status(200).json({
            message: 'Quote Added',
            createdQuote
        })
    }catch (err) {
        console.log(err.message)
        res.status(400).json({
            status: 'Unsuccessful',
            message: err.message
        })
    }
}

exports.getAllQuote = async (req, res) => {

    try{
        const quotes = await prisma.quote.findMany()

        res.status(200).json({
            count: quotes.length,
            quotes
        })
    }catch (err) {
        console.log(err.message)
        res.status(400).json({
            status: 'Unsuccessful',
            message: err.message
        })
    }
}

exports.getSpecificQuote = catchAsync(async (req, res, next) => {
    const {id} = req.user;
    const quotes = await prisma.quote.findMany({
        where: {
            userId: id
        }
    })
    
    errorProvider(res, 'Unsuccessful', 400, 'fasda', 456513, quotes)

    // try{
    //     res.status(200).json({
    //         count: quotes.length,
    //         quotes
    //     })
    // }catch (err) {
    //     console.log(err.message)
    //     // res.status(400).json({
    //     //     status: 'Unsuccessful',
    //     //     message: err.message
    //     // })
    // }
})