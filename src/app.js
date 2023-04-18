//main application

//define basic packages used (see more within js file)
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');
var expressHandlebars = require('express-handlebars');


//router groupings
var indexRouter = require('./routes/index');
var userRouter = require('./routes/user');

//mongoose package
var mongoose = require('mongoose');
var app = express();


//for security verification csrfToken passing
var session = require('express-session');

//user verification
var passport = require('passport');

//displaying messages
var flash = require('connect-flash');

//for email validation and validation of other data
var validator = require('express-validator');

//Establishing a connection to the DB used for storing the data
var Store = require('connect-mongo')(session);

//connect to DB and use passport signup/signin strategy
mongoose.connect('mongodb://127.0.0.1:27017/shopping', {useNewUrlParser: true});
require('./config/passport');


// view engine setup
app.engine('.handlebars', expressHandlebars({defaultLayout: 'layout', extname: '.handlebars'}));
app.set('view engine', '.handlebars');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//initializing the validator for user information during signup and signin
app.use(validator());

//used for session tracking
app.use(cookieParser());

//defining sessions & flash
app.use(
  session({
    secret: 'mysupersecret',
    resave: false,
    saveUninitialized: false,
    store: new Store({mongooseConnection: mongoose.connection}),
    cookie: {maxAge: 180 * 60 * 1000}
  }));

//used for displaying error messages to the user
app.use(flash());

//user login session initialization
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

//global login variable used to manipulate session based on whether
//the user is logged in or not
app.use(function(req, res, next){
  res.locals.login = req.isAuthenticated();
  res.locals.session = req.session;
  if(req.isAuthenticated()){
    res.locals.isAdmin = req.user.isAdmin;
  } else {
    res.locals.isAdmin = false;
  }
  next();
});

//router groupings
app.use('/users', userRouter);
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



module.exports = app;
