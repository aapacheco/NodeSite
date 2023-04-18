var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
  id: String,
  name: String,
  description: String,
  price: Number,
  quantity: Number,
  imagePath: String,
  outOfStock: {type: Boolean, default: false}
});

module.exports = mongoose.model('Product', schema);
