var passport = require('passport');
var User = require('../models/user');
var Stock = require('../models/storeStock');
var Product = require('../models/product');
var Cart = require('../models/cart');
var Order = require('../models/order');
var LocalStrategy = require('passport-local').Strategy;
var url = require('url');


passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
      });
});

//defines the signup validation scheme as well as password encryption
//for new users
passport.use('local.signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, function (req, email, password, done) {

    var currentURL = req.url;
    //validates the requirements for password and email
    req.checkBody('email', 'Invalid email').notEmpty().isEmail();
    req.checkBody('password', 'Invalid password').notEmpty().isLength({min:4});

    //return any errors to be passed to the user
    var errors = req.validationErrors();
    if (errors) {
        var messages = [];
        errors.forEach(function(error) {
           messages.push(error.msg);
        });
        //flash the errors back
        return done(null, false, req.flash('error', messages));
    }

    //if no errors in the data entered, check the user DB for an existing user
    //by email lookup
    User.findOne({'email': email}, function (err, user) {

        //return error
        if (err) {
            return done(err);
        }
        //user exists already
        if (user) {
            return done(null, false, {message: 'Email is already in use.'});
        }

        //no errors - create user
        var newUser = new User();
        newUser.email = email;
        newUser.password = newUser.encryptPassword(password);

        if(currentURL.includes("/admin/signup")){
          newUser.isAdmin = true;
        } else {
          newUser.isAdmin = false;

        }

        newUser.save(function(err, result) {
           if (err) {
               return done(err);
           }
           return done(null, newUser);
        });
    });
}));


//defines the signup validation scheme as well as password encryption
//for new users
passport.use('local.signin', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, function(req, email, password, done) {

    //validates the requirements for password and email or username
    req.checkBody('email', 'Invalid email').notEmpty().isEmail();
    req.checkBody('password', 'Invalid password').notEmpty();

    //return any errors to be passed to the user
    var errors = req.validationErrors();
    if (errors) {
        var messages = [];
        errors.forEach(function(error) {
            messages.push(error.msg);
        });
        //flash the errors back
        return done(null, false, req.flash('error', messages));
    }

    //if no errors in the data entered, check the user DB for an existing user
    //by email lookup
    User.findOne({'email': email}, function (err, user) {

        //return error
        if (err) {
            return done(err);
        }

        //user does not exist
        if (!user) {
            return done(null, false, {message: 'No user found.'});
        }

        //invalid password entered
        if (!user.validPassword(password)) {
            return done(null, false, {message: 'Wrong password.'});
        }

        //user found, return user
        return done(null, user);
    });
}));
