const jwt = require('jsonwebtoken')
const dbConnectionPool = require('../database/database')

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const errorProvider = (res, message, status) => {
    res.status(status).json({
        message,
    })
}


exports.tokenChecker = async (req, res, next) => {
    const token = req.headers?.cookie
    if(!token) {
       return errorProvider(res, 'invalid Token', 403);
    }

    const jwtVerification = jwt.verify(token.split('=')[1], 'superSecret')
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

exports.getSpecificQuote = async (req, res) => {
    const {id} = req.params;

    dbConnectionPool.query(`SELECT * FROM quotes WHERE user_id=${id}`, (err, result) => {
        if(err){
            console.log(err)
            return
        }

        res.status(200).json({
            message: 'Success',
            quotes: result,
        })
    })
}