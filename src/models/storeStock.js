var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Product = require('../models/product');

var schema = new Schema({
  id: String,
  quantity: Number,
  outOfStock: {type: Boolean, default: false}
});


// schema.methods.checkQty = function(cart){
//   var msg = false
//   var error = 0;
//   for(var index = 0; index < cart.length; index++){
//     var id = items[index].id;
//     var currentStock = 0;
//     var orderStock = cart.items[index].quantity;
//
//
//     //check to see if there is existing stock to satisfy order
//     this.findOne({id: id}, function(err, stockItem){
//       if(err){
//         return false;
//       }
//       if(!stockItem){
//         return false;;
//       }
//       currentStock = stockItem.quantity;
//       if(currentStock < 1){
//         Product.updateOne({id: id}, {$set:{outOfStock: true}});
//         Stock.updateOne({id: id}, {$set:{outOfStock: true}});
//       } else {
//         Product.updateOne({id: id}, {$set:{outOfStock: false}});
//         Stock.updateOne({id: id}, {$set:{outOfStock: false}});
//       }
//     });
//
//     //if there is enough stock, place order and update Stock
//     //else return error message
//     error = orderStock - currentStock; //calculate stock error to see if customer is orgering more than current inventory allows
//     console.log("Error:" + error);
//     if(error > 0){
//       break;
//     }
//   };
//
//   if(currentStock > orderStock){
//     this.find({id: id}, function(err, item){
//       if(item.quantity <= orderStock){
//         return true;
//       }else{
//         return false;
//       }
//     });
//   };
//
// };

module.exports = mongoose.model('Stock', schema);
