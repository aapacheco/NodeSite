var express = require('express');
var router = express.Router();
var passport = require('passport');
var csrf = require('csurf');
var User = require('../models/user');
var Order = require('../models/order');
var Cart = require('../models/cart');
var Product = require('../models/product');
var Stock = require('../models/storeStock');
var url = require('url');

//Protect all routers with CSRF Protection
var csrfProtection = csrf();
router.use(csrfProtection);


//renders user profile - validates for user-logged-in session
router.get('/profile', isLoggedIn, function (req, res, next) {
  var isadmin = false;
  User.findById(req.user._id, function(err, user){

    console.log(user);
    if(err || !user){
      isadmin = false;
    } else {
      isadmin = user.isAdmin;

      Order.find({user: user._id}, function(err, orders) {
          if (err) {
              return res.write('Error!');
          }
          var cart;
          orders.forEach(function(order) {
              cart = new Cart(order.cart);
              order.items = cart.generateArray();
          });
          if(isadmin){
            res.render('/');
          } else {
            res.render('users/profile', {orders: orders, isAdmin: false});
          }
      });
    }
  });
});

//------------------------------Admin Section---------------------------------//
//view all customer accounts
router.get("/admin/customers", function(req, res, next){
  var messages = req.flash('error');
  var customers = [];

  User.find({}, function(err, users){
    for(var index = 0; index < users.length; index++){
      if(!users[index].isAdmin){
        customers.push(users[index]);
      }
    }
  });
  res.render('users/admin/customers',{customers:customers});
});

//view all orders for the selected customer by email and user id
router.get("/admin/orders/:email", function(req, res, next){
  User.findOne({email: req.params.email}, function(err, user){


      Order.find({user: user._id}, function(err, orders) {
          if (err) {
              return res.write('Error!');
          }
          var cart;
          orders.forEach(function(order) {
              cart = new Cart(order.cart);
              order.items = cart.generateArray();
          });

          res.render('users/admin/orders', {orders: orders, email:req.params.email});
      });
    });
  });

//delete a customer account and all of their orders.
//completely removes the item from the inventory
router.get('/admin/customers/delete/:email', function(req, res, next){
    var email = req.params.email;
    User.findOne({email:email}, function(err, user){
      if(err){
        req.flash("error", err);

      }
      var id = user._id;
      Order.find({user: id}, function(err, orders){
        if(err){
          req.flash("error", err);
        }

        //remove the user account and all of its orders
          user.remove(function(err, result){
            if(orders.length == 0){
              res.redirect('/users/admin/customers');
            }else{
              for(var index = 0; index < orders.length; index++){
                orders[index].remove(function(err, result){

                });
              }
              res.redirect('/users/admin/customers');
            }
        });
      });
    });
});

//delete a customer order
router.get("/admin/orders/:email/:id/remove", function(req, res, next){
  var orderId = req.params.id;
  Order.deleteOne({_id: orderId}, function(err, result){
    if(err){
      req.flash("error", err);
    }
  });
    User.findOne({email: req.params.email}, function(err, user){
      var id = user.id;
      Order.find({user: id}, function(err, orders){
        var url = '/users/admin/orders/' + user.email;
        res.redirect(url);
      });
    });
});

router.get('/admin/orders/:email/:id/update', function(req,res,next){
  var orderId = req.params.id;

  User.findOne({email: req.params.email}, function(err, user){
    Order.findOne({_id: orderId}, function(err, order) {
      if (err) {
        return res.write('Error!');
      }

      var cart = new Cart(order.cart);
      var cartArray = cart.generateArray();
      console.log(cartArray);
      res.render('users/admin/updateorder',
      {
        csrfToken: req.csrfToken(),
        email: req.params.email,
        id: req.params.id,
        cart: cart.generateArray(),
        totalPrice: cart.totalPrice
      });
    });
  });
});


//reduced the quantity of items within the item group in the cart
router.get('/admin/orders/:email/:id/update/increase/:_id', function(req, res, next) {
    var productId = req.params._id;
    var email = req.params.email;
    var o_id = req.params.id;
    var cart;
    Order.findOne({_id: req.params.id}, function(err, order){
      cart = new Cart(order.cart);


    Product.findById({_id: productId}, function(err, product){
      var stockID = product.id;

      Stock.findOne({id: stockID} ,function(err, stock){

        stock.outOfStock = ((stock.quantity < 1) ? true : false);

        //if the customer has more items in their cart for the specific product
        //than are available in the store, disable the checkout button
        if(order.cart.items[productId].quantity > (stock.quantity)){
          order.save(function(err, result){
            product.save(function(err,result){
              stock.save(function(err, result){
                res.render('users/admin/updateorder',
                {
                  email: email,
                  id: o_id,
                  cart: cart.generateArray(),
                  totalPrice: cart.totalPrice
                });
              });
            });
          });


        } else {
          stock.quantity -= 1;
          stock.outOfStock = ((stock.quantity < 1) ? true : false);
          cart.increaseByOne(productId);
          order.cart = cart;
          order.save(function(err, result){
            product.save(function(err,result){
              stock.save(function(err, result){
                res.render('users/admin/updateorder',
                {
                  email: email,
                  id: o_id,
                  cart: cart.generateArray(),
                  totalPrice: cart.totalPrice
                });
              });
            });
          });
      }
    });
  });
});
});

router.get('/admin/orders/:email/:id/update/decrease/:_id', function(req, res, next) {
  var productId = req.params._id;
  var email = req.params.email;
  var o_id = req.params.id;
  var cart;
  Order.findOne({_id: req.params.id}, function(err, order){
    cart = new Cart(order.cart);

  Product.findById({_id: productId}, function(err, product){
    var stockID = product.id;

    Stock.findOne({id: stockID} ,function(err, stock){

      stock.outOfStock = ((stock.quantity < 1) ? true : false);

      stock.quantity += 1;
      cart.decreaseByOne(productId);
      order.cart = cart;
      order.save(function(err, result){
        product.save(function(err,result){
          stock.save(function(err, result){
            res.render('users/admin/updateorder',
            {
              email: email,
              id: o_id,
              cart: cart.generateArray(),
              totalPrice: cart.totalPrice
            });
          });
        });
      });
    });
  });
});
});


//logs user out of current session - validates for user-logged-in session
router.get('/logout', isLoggedIn, function(req, res, next){
  req.logout();
  res.redirect('/');
})

//renders home screen - validates for user-logged-in session, if user is not logged in
//returns to home screen
router.use('/', notLoggedIn, function(req,res,next){
  next();
});

//renders user sign up form - passes csrfToken for security and checks for errors
router.get('/signup',  function(req,res,next){
  var messages = req.flash('error');
  res.render('users/signup',{ csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length>0});
});

//use defined strategy from passport.js
router.post('/signup', passport.authenticate('local.signup', {

    //handles failure to sign up properly
    failureRedirect: '/users/signup',
    failureFlash: true

    //if user signed up properly, return to previous session from last login
    //else render profile
}), function (req, res, next) {
    if (req.session.oldUrl) {
        var oldUrl = req.session.oldUrl;
        req.session.oldUrl = null;
        res.redirect(oldUrl);
    } else {
        res.redirect('/users/profile');
    }
});

//renders user sign in form - passes csrfToken for security and checks for errors
router.get(('/signin'), function(req, res, next){
  var messages = req.flash('error');
  res.render('users/signin',{ csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length>0});
});

//use defined strategy from passport.js
router.post('/signin', passport.authenticate('local.signin', {

    //handles failure to sign up properly
    failureRedirect: '/users/signin',
    failureFlash: true

    //if user signed up properly, return to previous session from last login
    //else render profile
}), function (req, res, next) {
    if (req.session.oldUrl) {
        var oldUrl = req.session.oldUrl;
        req.session.oldUrl = null;
        res.redirect(oldUrl);
    } else {
        res.redirect('/users/profile');
    }
});


//----------------------------Admin Section ---------------------------------//
//renders user sign up form - passes csrfToken for security and checks for errors
router.get('/admin/signup',  function(req,res,next){
  var messages = req.flash('error');
  res.render('users/admin/signup',{ csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length>0});
});

//use defined strategy from passport.js
router.post('/admin/signup', passport.authenticate('local.signup', {

    //handles failure to sign up properly
    failureRedirect: '/users/admin/signup',
    failureFlash: true

    //if user signed up properly, return to previous session from last login
    //else render profile
}), function (req, res, next) {
    if (req.session.oldUrl) {
        var oldUrl = req.session.oldUrl;
        req.session.oldUrl = null;
        res.redirect(oldUrl);
    } else {
        res.redirect('/');
    }
});

//renders user sign in form - passes csrfToken for security and checks for errors
router.get(('/admin/signin'), function(req, res, next){
  var messages = req.flash('error');
  res.render('users/admin/signin',{ csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length>0});
});

//use defined strategy from passport.js
router.post('/admin/signin', passport.authenticate('local.signin', {

    //handles failure to sign up properly
    failureRedirect: '/users/admin/signin',
    failureFlash: true

    //if user signed up properly, return to previous session from last login
    //else render profile
}), function (req, res, next) {
    if (req.session.oldUrl) {
        var oldUrl = req.session.oldUrl;
        req.session.oldUrl = null;
        res.redirect(oldUrl, { isAdmin: req.user.isAdmin});
    } else {
        res.redirect('/');
    }
});

module.exports = router;

//defined check for user-logged-in session via authentication check
function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/');
}

//defined check for user-not-logged-in session via authentication check
function notLoggedIn(req, res, next){
  if(!req.isAuthenticated()){
    return next();
  }
  res.redirect('/');
}
