const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client');
const { errorProvider, catchAsync } = require('../utils/errorProvider');
const { promisify } = require('util')
const prisma = new PrismaClient()

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
        return errorProvider(res, 'Registration Error', 403)
        res.status(200).json({
            status: 'Registration Error',
            message: err.message
        })
    }
}

const createToken = (user, status, res, refreshToken=undefined) => {
    const accessToken = jwt.sign({phone: user.phone, id: user.id}, 'superSecret', {expiresIn: 60})

    res.cookie('jwt', accessToken, { httpOnly: true });

    user.password = undefined;

    res.status(status).json({
        status: 'success',
        user,
        accessToken, 
        refreshToken
    })
}

exports.login = catchAsync(async (req, res) => {
    const {phone, password} = req.body;

    const user = await prisma.user.findUniqueOrThrow({
        where: {
            phone,
        }
    })

    const compare = await bcrypt.compare(password, user.password)

    if(!compare) {
        return res.status(403).json({
            status: 'password wrong'
        })
    }

    const refreshToken = jwt.sign({phone: user.phone, id: user.id}, 'superSecretRefresh', {expiresIn: '30d'})

    await prisma.token.upsert({
        where: {
            userId: user.id
        },
        update: {
            refreshToken
        },
        create: {
            refreshToken,
            userId: user.id
        }
    })

    createToken(user, 200, res, refreshToken)

})

exports.getRefreshToken = catchAsync(async (req, res) => {
    const {refreshToken} = req.body;
    
    const jwtVerification = await promisify(jwt.verify)(refreshToken, 'superSecretRefresh')

    const getUserToken = await prisma.token.findUniqueOrThrow({
        where: {
            userId: jwtVerification.id
        }
    })

    if ( !(refreshToken == getUserToken.refreshToken) ) {
        return new errorProvider(res, 'Invalid Token - please log in', 403)
    }

    createToken(jwtVerification, 200, res)
})