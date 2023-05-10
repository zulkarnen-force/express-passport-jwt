import passport from "passport"
import {Strategy, ExtractJwt} from 'passport-jwt'
import {User} from "./db.js"
import { ObjectId  as Ole} from "mongoose"

let options = {}
options.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken()
options.secretOrKey = 'randomstring'

export default passport.use(new Strategy(options, async (jwt_payload, done) => {
    try {
        const user = await User.findOne({email: jwt_payload.email})
        done(null, user)
    } catch (error) {
        done(error, null)
    }
   
}))