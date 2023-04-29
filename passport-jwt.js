import passport from "passport"
import {Strategy, ExtractJwt} from 'passport-jwt'
import User from "./db.js"
let options = {}
options.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken()
options.secretOrKey = 'randomstring'

export default passport.use(new Strategy(options, (jwt_payload, done) => {
    try {
        const user = User.findOne({id: jwt_payload.id})
        done(null, user)
    } catch (error) {
        done(error, null)
    }
   
}))