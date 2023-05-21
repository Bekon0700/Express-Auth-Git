const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client');
const { errorProvider, catchAsync } = require('../utils/errorProvider');
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

const createToken = (user, status, res) => {
    const accessToken = jwt.sign({phone: user.phone, id: user.user_id}, 'superSecret', {expiresIn: 60})

    console.log(user)

    // const refreshToken = jwt.sign({phone: user.phone, id: user.user_id}, 'superSecretRefresh', {expiresIn: '30d'})

    res.cookie('jwt', accessToken, { httpOnly: true });

    res.status(status).json({
        status: 'success',
        user,
        accessToken
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

    const refreshToken = jwt.sign({phone: user.phone, id: user.user_id}, 'superSecretRefresh', {expiresIn: '30d'})

    const getRefreshToken = await prisma.token.create({
        data: {
            refreshToken,
            userId: user.id
        }
    })

    console.log(getRefreshToken)

    createToken(user, 200, res)

})