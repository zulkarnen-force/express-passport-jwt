import express from 'express'
import http from 'http'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import passport from 'passport'
import {body, validationResult} from 'express-validator'
import cors from 'cors';
import path from 'path';
import multer from 'multer';    
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import bodyParser  from 'body-parser';

// Set up the storage configuration for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileExtension = path.extname(file.originalname);
      cb(null, uniqueSuffix + fileExtension);
    }
  });
const upload = multer({ storage: storage, limits: 100 });
  
import {User, File} from './db.js'

const app = express()


const server = http.createServer(app)

app.use(bodyParser.json());

app.use(express.static(__dirname + '/uploads'));
app.use(passport.initialize())
// app.use(cors({
//     origin: '*',
// }))
import dotenv from 'dotenv'
dotenv.config()
// app.use((req,res,next)=>{
//     res.setHeader('Access-Control-Allow-Origin','*');
//     res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,PATCH,DELETE');
//     res.setHeader('Access-Control-Allow-Methods','Content-Type','Authorization');
//     next(); 
// })

import passportJwt from './passport-jwt.js'
app.use(cors());
app.get('/', (req, res) => {
    res.json({
        result:{
            message:"ok"
        }
    })
})

app.post('/register', async (req, res) => {
    
    try {
        if (!req.body.password) {
            throw new Error('password required')
        }
        const user = new User({
            name: req.body.name,
            nim: req.body.nim,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, 10),
        })
        await user.save()
        return res.status(201).json({
            result: {
                message: 'user created successfully',
                success: true,
                data: {
                    nim: user.nim
                }
            }
        })
    } catch (error) {
        return res.status(400).json({
            errors: {
                message: error.message,
                success: false
            }
        })
    }

})


app.post('/login', body('email').notEmpty(), body('password').notEmpty(), async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({
            errors: {
                message: 'validation error',
                success: false,
                detail: result.array()
            }
        })
    }
    
    const user = User.findOne({email: req.body.email}).then((user) => {
        if (!user) {
            return res.status(404).json({
                errors: {
                    message: 'user not found',
                    success: false
                }
            })
        }

        if (!bcrypt.compareSync(req.body.password, user.password)) {
            return res.status(400).json({
                errors: {
                    message: 'wrong password',
                    success: false
                }
            })
        }

        const payload = {
            email: user.email,
            id: user._id
        }

        const token = jwt.sign(payload, process.env.SECRET_KEY, {expiresIn: '1d'})

        return res.status(200).json({
            result: {
                token: token,
                success: true
            }
        })
    
    })
})


app.get('/protected', passport.authenticate('jwt', {session: false}), (req, res) => {
    return res.status(200).json({
        result: {
            message: 'information of user',
            data: {
                nim: req.user.nim,
                name: req.user.name,
                email: req.user.email,
            }
        }
    })
})

const uploadSingleImage = upload.single('image');

app.post('/upload', passport.authenticate('jwt', {session: false}), (req, res) => {
    
    uploadSingleImage(req, res, async function  (err) {
        
        if (err) {
            return res.status(400).send({ message: err.message })
        }

        const file = req.file;

        if (!file) {
            return res.status(400).send({ errors: {
                message: 'please lampirkan image pada form data',
                field: 'image'
            } })
        } 
        if (req.file.size >= 1000000 ) {
            return res.status(400).json({
                'message':'terlalu besar Mas, max 10000 kb yoo'
            })
        }

        let id = randomUUID()
        let user = {    
            id: req.user.name,
            nim: req.user.nim,
            email: req.user.email
        }

        try {
            const fileStorage = new File({
                id, 
                filename: req.file.originalname,
                url: `/${req.file.filename}`,
                uploaded_by: user
            })
            await fileStorage.save();
            return res.status(200).send({
                message: 'your lovely image uploaded successfully 💖',
                url: "https://express-passport-jwt-production.up.railway.app/" + file.filename
            })
        } catch (error) {
            return res.status(400).send({ errors: {message: error.message} })
        }
    })

})
    
app.get('/images', async (req, res) => {
    let images = await File.find({}, { _id: 0 })
    res.json(images);
})
  

import mongoose from "mongoose";
import { randomUUID } from 'crypto'

server.listen(process.env.PORT, () => {
    console.log('server running on http://localhost:3000')
    try {
        mongoose.connect(process.env.MONGO_URI).then((r) => console.log('connect to mongoDB' + r)) 
    } catch (error) {
        console.log(error.message)
    }
})