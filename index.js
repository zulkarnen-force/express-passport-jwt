import express from 'express'
import http from 'http'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import passport from 'passport'
import {body, validationResult} from 'express-validator'
import cors from 'cors';
import path from 'path';
import multer, { memoryStorage } from 'multer';    
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import bodyParser  from 'body-parser';
import { initializeApp } from "firebase/app";
import config from './config.js'
const firebaseConfig = {
    apiKey: "AIzaSyCKHRftGxf8_ID9Epk9m2f-Qwb1KFeQilY",
    authDomain: "personal-project-tekweb.firebaseapp.com",
    projectId: "personal-project-tekweb",
    storageBucket: "personal-project-tekweb.appspot.com",
    messagingSenderId: "1029326080042",
    appId: "1:1029326080042:web:edbe2eb5c5d6da01ac1b53"
  };

const firebaseApp = initializeApp(firebaseConfig);
import {getStorage, ref, uploadBytes, uploadBytesResumable, getDownloadURL} from 'firebase/storage';


// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, 'uploads/');
//     },
//     filename: function (req, file, cb) {
//       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//       const fileExtension = path.extname(file.originalname);
//       cb(null, uniqueSuffix + fileExtension);
//     }
// });

let upload = multer({storage: multer.memoryStorage(),
     filename: function (req, file, cb) {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const fileExtension = path.extname(file.originalname);
          cb(null, uniqueSuffix + fileExtension);
}});

// const upload = multer({ storage: storage, limits: 100 });

import {User, File} from './db.js'

const app = express()
const server = http.createServer(app)

app.use(bodyParser.json());
app.use(express.static(__dirname + '/uploads'));
app.use(passport.initialize())
let allowOrigins = ['http://127.0.0.1:5500/', 'http://127.0.0.1:3000']
app.use(cors({origin: "*", credentials: true, optionsSuccessStatus: 200}))
import dotenv from 'dotenv'
dotenv.config()


import passportJwt from './passport-jwt.js'

app.use(cors());
app.get('/', (req, res) => {
    res.json({
        result:{
            message:"ok"
        }
    })
})


app.get('/users/:nim', async (req, res) => {
    let users = await User.find({nim: req.params.nim});
    return res.json({
        result: users
    });
})

app.put('/users/:nim', async (req, res) => {
    const nimUser = req.params.nim;
    const updatedData = req.body;
    try {
        let user = await User.findOneAndUpdate({nim: nimUser}, updatedData);
        if (!user) {
            return res.status(404).json( {errors: {
                message:'user not found'
            }})
        }
        return res.status(200).json( {result: {
            message:'user has been updated successfully'
        }})
    } catch (error) {
        return res.status(200).json( {errors: {
            message: error.message
        }})
    }
    
})

app.get('/users', async (req, res) => {
    let users = await User.find({});
    return res.json({
        result: users
    });
})

app.delete('/users/:nim', async (req, res) => {
    let response = await User.findOneAndRemove({nim: req.params.nim});
    if (!response) {
        return res.status(404).json( {errors: {
            message:'user not found'
        }})
    }
    return res.status(200).json( {result: {
        message:'user has been deleted successfully'
    }})
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
const firebaseStorage = getStorage(firebaseApp);
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


        let metadata = {
            contentType: req.file.mimetype
        }

        let id = randomUUID()
        let user = {    
            id: req.user.name,
            nim: req.user.nim,
            email: req.user.email
        }
        try {
            let imgId = randomUUID()
            let filename = imgId + req.file.originalname;
            const refer = ref(firebaseStorage, 'tekweb/'+ filename);
            let snapshot = await uploadBytesResumable(refer, req.file.buffer, metadata);
            let downloadUrl = await getDownloadURL(snapshot.ref)
            const fileStorage = new File({
                id, 
                filename: req.file.originalname,
                url: downloadUrl,
                uploaded_by: user
            })
            await fileStorage.save();
            return res.status(200).send({
                message: 'your lovely image uploaded successfully 💖',
                url: downloadUrl
            })
        } catch (error) {
            return res.status(400).send({ errors: {message: error.message} })
        }
    })

})
    
app.get('/images', async (req, res) => {
    let images = await File.find({}, { _id: 0 })
    res.json(images);
    // we'll create a Reference to that folder:

})
  

import mongoose from "mongoose";
import { randomUUID } from 'crypto'
import { useDatabase } from 'vuefire'

server.listen(process.env.PORT, () => {
    console.log('server running on http://localhost:3000')
    try {
        mongoose.connect(process.env.MONGO_URI).then((r) => console.log('connect to mongoDB' + r)) 
    } catch (error) {
        console.log(error.message)
    }
})