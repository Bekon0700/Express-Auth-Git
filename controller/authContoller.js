const bcrypt = require('bcrypt');
const dbConnectionPool = require('../database/database');
const jwt = require('jsonwebtoken')
const cookie = require('cookie-parser')

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const errorProvider = (res, message, status) => {
    res.status(status).json({
        message,
    })
}

exports.registration = async (req, res) => {
    const {name, phone, password} = req.body

    const hashPass = await bcrypt.hash(password, 12);

    try{
        const user = await prisma.user.create({
            data: {
                name,
                phone,
                password: hashPass
            }
        })

        res.status(200).json({
            message: 'Registration Done, Now Please Log in.',
            user
        })
    }catch (err) {
        console.log(err.message)
    }
}

const createToken = (user, status, res) => {
    const jwtToken = jwt.sign({phone: user.phone, id: user.user_id}, 'superSecret', {expiresIn: '1h'})

    res.cookie('jwt', jwtToken, { httpOnly: true });

    res.status(status).json({
        status: 'success',
        user,
        token: jwtToken
    })
}

exports.login = async (req, res) => {
    const {phone, password} = req.body

    // dbConnectionPool.query(`SELECT * FROM users WHERE phone='${phone}'`, async (err, result) => {
    //     if(err){
    //         console.log(err)
    //         return
    //     }

    //     if(result.length == 0) {
    //         return errorProvider(res, 'No User found', 404);
    //     }

    //     const user = result;
    //     const compare = await bcrypt.compare(password, user[0].password)
        
    //     if(!compare) {
    //         return errorProvider(res, 'Password error', 403);
    //     }

    //     createToken(user[0], 201, res)
    // })
    console.log(phone)
    try{
        const user = await prisma.user.findFirstOrThrow({
            where: {
                phone
            }
        })
        console.log(user)
        res.status(200).json({
            message: 'Login Done.',
            // user
        })
    }catch (err) {
        console.log(err.message)
        res.status(400).json({
            message: err.message,
        })
    }

}