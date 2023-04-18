var express = require('express');
var router = express.Router();
var Product = require('../models/product');
var Cart = require('../models/cart');
var Order = require('../models/order');
var Stock = require('../models/storeStock');
var User = require('../models/user');
var passport = require('passport');
var fs = require('fs');


/* GET home page. */
router.get('/', function(req, res, next) {
  if(req.query.search){
    const regx = new RegExp(escreg(req.query.search), 'gi');
    //configures default layout of 3 items wide
    var stock = {};
    Stock.find({}, function(err, inventory){
      stock = inventory;
    });
    Product.find({name: regx}, function(err, products){


      var nothingFound;
      if(products.length < 1){
        nothingFound = "No results found!";
      }

      var productChunks = [];
      var chunkSize = 3;

      for(var i = 0;i < stock.length; i++){

        for(var j = 0; j < products.length; j++){

          if(stock[i].id == products[j].id){

            products[j].outOfStock = stock[i].outOfStock;
            products[j].save(function(err, result){
              //do nothing
            });
          }
        }
      }

      for(var index =0; index < products.length; index += chunkSize){
        productChunks.push(products.slice(index, index + chunkSize));
      }
      res.render('shop/index', {products:productChunks, msg:nothingFound});
    });
  } else {
    //configures default layout of 3 items wide
    var stock = {};
    Stock.find({}, function(err, inventory){
      stock = inventory;
    });
    Product.find({}, function(err, products){
      var productChunks = [];
      var chunkSize = 3;

      for(var i = 0;i < stock.length; i++){

        for(var j = 0; j < products.length; j++){

          if(stock[i].id == products[j].id){

            products[j].outOfStock = stock[i].outOfStock;
            products[j].save(function(err, result){
              //do nothing
            });
          }
        }
      }

      for(var index =0; index < products.length; index += chunkSize){
        productChunks.push(products.slice(index, index + chunkSize));
      }
      res.render('shop/index', {products:productChunks});
    });
  }
});

router.get('/thankyou', function(req, res, next){
  res.render('shop/thankyou');
});


//Add To Cart
router.get('/add-to-cart/:id', function(req, res, next){
  //get new product id
  var productId = req.params.id;

  //check if current cart exists, if not, create new one with empty javascript object
  //if cart exists, pass it to the new cart
  var cart = new Cart(req.session.cart ? req.session.cart : {});
  Product.findById(productId, function(err, product){
    if(err){
      return res.redirect('/');
    }
    var stockID = product.id;
    Stock.findOne({id: stockID} ,function(err, stock){

      stock.outOfStock = ((stock.quantity < 1) ? true : false);

      if(stock.outOfStock){
        stock.save(function(err, result){
          res.redirect('/');
        });

      } else {
        stock.quantity -= 1;
        stock.outOfStock = ((stock.quantity < 1) ? true : false);
        stock.save(function(err, result){
          cart.add(product, product._id);
          req.session.cart = cart;
          res.redirect('/');
        });
      }

    });
  });
});

//shopping Cart view. checks if current session contains Cart
//if yes, passes products as an array and total price to shoppingCart.handlebars
router.get('/shoppingCart', function(req,res,next){
  if(!req.session.cart){
    return res.render('shop/shoppingCart', { products: null});
  }

  Stock.find({}, function(err, inventory){
    if (err) {
        return done(err);
    }
    //no items
    if (!inventory) {
        return done(null, false, {message: 'No Items.'});
    }

    //find all stocks and sync outOfStock values with Products every time the
    //cart is loaded
    Product.find({}, function(err, products){
      for(var i = 0;i < inventory.length; i++){
        for(var j = 0; j < products.length; j++){
          if(inventory[i].id == products[j].id){
            products[j].outOfStock = inventory[i].outOfStock;
            products[j].save(function(err, result){
              //do nothing
            });
          }
        }
      }

      var cart = new Cart(req.session.cart);
      var cartArray = cart.generateArray();
      console.log(cartArray);
      res.render('shop/shoppingCart',
              {
                products: cart.generateArray(),
                totalPrice: cart.totalPrice,
                canCheckout: true,
              });
    });
  });
});

//reduced the quantity of items within the item group in the cart
router.get('/increase/:id', function(req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});


    Product.findById({_id: productId}, function(err, product){
      var stockID = product.id;

      Stock.findOne({id: stockID} ,function(err, stock){

        stock.outOfStock = ((stock.quantity < 1) ? true : false);

        //if the customer has more items in their cart for the specific product
        //than are available in the store, disable the checkout button
        if(req.session.cart.items[productId].quantity > (stock.quantity)){
            stock.save(function(err, result){
              res.render('shop/shoppingCart',
                      {
                        products: cart.generateArray(),
                        totalPrice: cart.totalPrice,
                        canCheckout: false,
                      });
            });

        } else {
          stock.quantity -= 1;
          stock.outOfStock = ((stock.quantity < 1) ? true : false);
          stock.save(function(err, result){
            cart.increaseByOne(productId);
            req.session.cart = cart;
            res.redirect('/shoppingCart');
          });

      }
    });
  });
});

router.get('/decrease/:id', function(req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});


    Product.findById({_id: productId}, function(err, product){
      var stockID = product.id;

      Stock.findOne({id: stockID} ,function(err, stock){

        //if the item grouping within the customers cart has less than or equal to the
        //exact inventory of that item in available stock, enable the checkout button
        if(req.session.cart.items[productId].quantity <= (stock.quantity)){
          stock.quantity += 1;
          stock.outOfStock = ((stock.quantity < 1) ? true : false);
          cart.decreaseByOne(productId);
          req.session.cart = cart;
            stock.save(function(err, result){
              res.render('shop/shoppingCart',
                      {
                        products: cart.generateArray(),
                        totalPrice: cart.totalPrice,
                        canCheckout: true,
                      });
            });

        } else {
          stock.quantity += 1;
          stock.outOfStock = ((stock.quantity < 1) ? true : false);
          stock.save(function(err, result){
            cart.decreaseByOne(productId);
            req.session.cart = cart;
            res.redirect('/shoppingCart');
          });
        }
      });
    });
});


//completely removes the item from the cart
router.get('/remove/:id', function(req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});

    Product.findById({_id: productId}, function(err, product){
      var stockID = product.id;

      //get the current quantity of the item group from the cart
      //and put them back into stock inventory count, and update the flags
      Stock.findOne({id: stockID} ,function(err, stock){
        var qty = req.session.cart.items[productId].quantity;
        stock.quantity += qty;
        stock.outOfStock = ((stock.quantity < 1) ? true : false);

          stock.save(function(err, result){
            cart.removeItem(productId);
            req.session.cart = cart;
            res.redirect('/shoppingCart');
          });
      });
    });
});


//completely removes the item from the inventory
router.get('/delete/:id', function(req, res, next){
    var productId = req.params.id;
    Product.remove({id:productId}, function(err, product){
      if(err){
        req.flash("error", err);

      }
    });
    Stock.remove({id:productId}, function(err, product){
      if(err){
        req.flash("error", err);

      }
    });
    res.redirect('/');
});

//takes the user to the checkout view of the current session if a cart exists
router.get('/checkout', function(req, res, next) {
  if(!req.user){
    res.redirect('/users/signin');

  }else{
    if (!req.session.cart) {
        return res.redirect('/shoppingCart');
    }
    var cart = new Cart(req.session.cart);
    var errMsg = req.flash('error')[0];
    res.render('shop/checkout', { total: cart.totalPrice, errMsg: errMsg, noError: !errMsg});
  }
});

//order completion
router.post('/checkout', function(req, res, next) {

    if (!req.session.cart) {
        return res.redirect('/shoppingCart');
    }
    var cart = new Cart(req.session.cart);

    //credit card charge code here

    var order = new Order({
        user: req.user,
        cart: cart,
        address: req.body.address,
        name: req.body.name,
    });

    order.save(function(err, result) {
        req.flash('success', 'Thank you for your order!');
        req.session.cart = null;
        res.redirect('/thankyou');
    });


});

router.get('/updateProduct/:_id', function(req,res,next){
  var productId = req.params._id;
  Product.findById(productId, function(err, product){
    //return error
    if (err) {
        return done(err);
    }
    //product exists already
    if (!product) {
        req.flash('error','Product No Longer Exists.');
    }

    Stock.findOne({id: product.id}, function(err,stock){
      //return error
      if (err) {
          return done(err);
      }
      //product exists already
      if (!stock) {
          req.flash('error','Stock No Longer Exists.');
      }
      res.render('shop/updateProduct', {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        quantity: stock.quantity,
        imagePath: product.imagePath,
        outOfStock: !stock.outOfStock
      });
    });


  });
});


router.post('/updateProduct/:_id', function(req,res,next){

  req.checkBody("price", "Price must be a positive value").isFloat({min: 0});
  req.checkBody("quantity", "Inventory must be a positive integer").isInt({min: 0});

  //return any errors to be passed to the user
  var errors = req.validationErrors();
  if (errors) {
      var messages = [];
      errors.forEach(function(error) {
         messages.push(error.msg);
      });
      //flash the errors back
      req.flash('error', messages);
  }

  var productId = req.params._id;
  Product.findById(productId, function(err, product){
	      if(err){
	        console.log("Error Selecting : %s ", err);
        }

	      if (!product){
	        return done(null, false, {message: "Product Does Not Exist."});
        }

        Stock.findOne({id: product.id}, function(err,stock){
          if(err){
            console.log("Error Selecting : %s ", err);
          }

          if(!stock){
            return done(null, false, {message: "Stock Does Not Exist."});
          }

          product.id = stock.id;
          product.name = req.body.name;
          product.description = req.body.description;
          product.price = req.body.price;
          product.imagePath = req.body.imagePath;
          stock.quantity = req.body.quantity;
          stock.outOfStock = ((stock.quantity < 1) ? true : false);
          product.outOfStock = stock.outOfStock;
          product.save(function(err, result){
            stock.save(function(err, result){
    					res.redirect('/');
    				});
          });
        });
			});
});



//user defined
router.post('/', function(req,res,next) {
  //validates the requirements for password and email
  req.checkBody('id', 'You Must Enter An Id').notEmpty();
  req.checkBody('quantity', 'You Must Enter A Stock Quantity').notEmpty();

  //return any errors to be passed to the user
  var errors = req.validationErrors();
  if (errors) {
      var messages = [];
      errors.forEach(function(error) {
         messages.push(error.msg);
      });
      //flash the errors back
      req.flash('error', messages);
      return done(null, false, req.flash('error', messages));
  }

  Stock.findOne({id: req.body.id}, function (err, stock) {

      //return error
      if (err) {
          return done(err);
      }
      //product exists already
      if (stock) {
          return done(null, false, {message: 'ID is already in use.'});
      }

      //no errors - create inventory item
      var newStock = new Stock();
      newStock.id = req.body.id;
      newStock.quantity = req.body.quantity;
      if(req.body.quantity < 1){
        newStock.outOfStock = true;
      } else {
        newStock.outOfStock = false;
      }

      var newProduct = new Product();
      newProduct.id = req.body.id;
      newProduct.name = ("New Product " + req.body.id);
      newProduct.description = "Description";
      newProduct.price = 0;
      newProduct.quantity = 1;
      newProduct.imagePath = "URL";
      newProduct.outOfStock = newStock.outOfStock;

      newProduct.save(function(err, result){
        newStock.save(function(err, result) {
          res.redirect('/');

        });
      });

  });
});

router.get('/viewInJSON', function(req,res,next){

      var myproductsjson = [];
      var a_product = {};
      var stock = {};

      Stock.find({}, function(err, inventory){
        stock = inventory;
      });
      Product.find({}, function(err, products){
        for(var i = 0;i < stock.length; i++){

          for(var j = 0; j < products.length; j++){

            if(stock[i].id == products[j].id){
              console.log('Stock ID: ' + stock[i].id);
              console.log('Products ID: ' + products[j].id);

              a_product.id = products[j].id;
              a_product.name = products[j].name;
              a_product.description = products[j].description;
              a_product.price =  products[j].price;
              a_product.quantity = stock[i].quantity;
              a_product.imagePath = products[j].imagePath;
              a_product.outOfStock = products[j].outOfStock;

              myproductsjson.push(a_product);
              a_product = {};
            }
          }
        }
        var jsonstring = JSON.stringify(myproductsjson, null, 2)
        fs.writeFile(__dirname + '/../json/productData.json', jsonstring, function (err) {
          if (err) throw err;
          console.log('File Updated!');
        });
        res.header('Content-Type', 'application/json');
        res.send(jsonstring);
      });
});


router.get('/viewInXML', function(req, res, next){

  var myproductsxml = "";
  var myproducts = "";
  var stock = {};
  Stock.find({}, function(err, inventory){
    stock = inventory;
  });
  Product.find({}, function(err, products){
    var myproducts = [];
    for(var i = 0;i < stock.length; i++){
      for(var j = 0; j < products.length; j++){
        if(stock[i].id == products[j].id){
          myproducts += '<product>\n' +
          '<id>' + products[j].id + '</id>\n' +
          '<name>' + products[j].name + '</name>\n'+
          '<description>' + products[j].description + '</description>\n' +
          '<price>' + products[j].price + '</price>\n' +
          '<quantity>' + stock[i].quantity + '</quantity>\n' +
          '<imagePath>' + products[j].imagePath + '</imagePath>\n' +
          '<outOfStock>' + products[j].outOfStock + '</outOfStock>\n' +
          '</product>\n';
        }
      }
    }
    myproductsxml = '<?xml version="1.0"?>\n<products>' + myproducts + '</products>\n';
    fs.writeFile(__dirname + '/../xml/productData.xml', myproductsxml, function (err) {
      if (err) throw err;
      console.log('File Updated!');
      
      res.header('Content-Type', 'application/xml');
      fs.readFile(__dirname + '/../xml/productData.xml', function(err, data){
        console.log("tracer" + data);
        if(err) throw err;
        res.send(data);
      });
    });
  });

});

module.exports = router;

//defined check for user-logged-in session via authentication check
function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/');
}

function escreg(text){
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};
