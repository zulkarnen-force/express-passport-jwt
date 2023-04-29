import express from 'express'
import http from 'http'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import passport from 'passport'

import User from './db.js'


const app = express()
const server = http.createServer(app)

app.use(express.json())
app.use(passport.initialize())

import passportJwt from './passport-jwt.js'

app.get('/', (req, res) => {
    res.json({
        result:{
            message:"ok"
        }
    })
})

app.post('/register', async (req, res) => {
    const user = new User({
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10),
    })

    try {
        await user.save()
        return res.json({
            result: {
                message: 'user created successfully',
                success: true
            }
        }).status(201)
    } catch (error) {
        return res.json({
            result: {
                message: 'user created failure',
                success: false
            }
        }).status(400)
    }

})


app.post('/login', async (req, res) => {
    const user = User.findOne({email: req.body.email}).then((user) => {
        if (!user) {
            return res.json({
                errors: {
                    message: 'user not found',
                    success: false
                }
            }).status(404)
        }

        if (!bcrypt.compareSync(req.body.password, user.password)) {
            return res.json({
                errors: {
                    message: 'wrong password',
                    success: false
                }
            }).status(400)
        }

        const payload = {
            email: user.email,
            id: user._id
        }

        const token = jwt.sign(payload, 'randomstring', {expiresIn: '1d'})

        return res.json({
            result: {
                token: token,
                success: true
            }
        }).status(200)
    
    })
})


app.get('/protected', passport.authenticate('jwt', {session: false}), (req, res) => {

})

server.listen(3000, () => {
    console.log('server running on http://localhost:3000')
})