const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const User = require('../Models/User');


passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromHeader('authorization'),
    secretOrKey: process.env.JWT_SECRET
}, async (payload, done) => {
    try {
        const user = User.query().where({ id: payload.id }).first();
        if (!user) done(null, false);

        done(null, user);
    } catch (error) {
        done(error, false);
    }
}));