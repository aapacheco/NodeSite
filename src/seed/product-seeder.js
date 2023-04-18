//single instance file
//used for populating database with products for the store
//not executed each run.


var Product = require('../models/product');

var mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/shopping', {useNewUrlParser: true});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("we're connected!");
});

var products = [
  new Product({
    id: "001",
    name: "The Legend Of Zelda Heroes Poster",
    description: "The Legend Of Zelta is a gaming franchise by Nintendo.",
    price: 12.00,
    quantity: 1,
    imagePath: "https://cdn.europosters.eu/image/750/posters/the-legend-of-zelda-link-i22805.jpg",
    outOfStock: false
  }),

  new Product({
    id: "002",
    name: "Apple iPhone X",
    description: "The newest iPhone by Apple.",
    price: 1000.00,
    quantity: 1,
    imagePath: "https://staticshop.o2.co.uk/product/images/iphone-x-space-grey-sku-header.png",
    outOfStock: false
  }),

  new Product({
    id: "003",
    name: "New Orleans Saints - Drew Brees Signed Helmet",
    description: "This is a New Orleans Saints Full Size Replica Helmet that has been hand signed by Drew Brees. This item has been certified authentic by Beckett Authentication (BAS) and comes with their serial numbered sticker and matching certificate of authenticity.",
    price: 569.00,
    quantity: 1,
    imagePath: "https://cdn11.bigcommerce.com/s-ycbvq3ez/images/stencil/1280x1280/products/122518/137845/P1090790__47999.1532477671.1280.1280__02690.1532745466.jpg",
    outOfStock: false
  }),

  new Product({
    id: "004",
    name: "TaylorMade M5 Driver",
    description: "This is the newest driver from TaylorMades 'M' Family.",
    price: 549.00,
    quantity: 1,
    imagePath: "https://keyassets.timeincuk.net/inspirewp/live/wp-content/uploads/sites/5/2018/10/M5.jpg",
    outOfStock: false
  })
];
var done = 0;
for(var index =0; index < products.length; index++){
  products[index].save(function(err, result){
    done++;
    if(done == products.length-1){
      exit();
    }
  });
}

function exit(){
  mongoose.disconnect();
}
