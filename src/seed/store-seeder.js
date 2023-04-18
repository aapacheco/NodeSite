//single instance file
//used for populating database with products for the store
//not executed each run.


var Stock = require('../models/storeStock');

var mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/shopping', {useNewUrlParser: true});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("we're connected!");
});

var storeStock = [
  new Stock({
    id: "001",
    quantity: 10
  }),

  new Stock({
    id: "002",
    quantity: 10
  }),

  new Stock({
    id: "003",
    quantity: 10
  }),

  new Stock({
    id: "004",
    quantity: 10
  })
];
var done = 0;
for(var index =0; index < storeStock.length; index++){
  storeStock[index].save(function(err, result){
    done++;
    if(done == storeStock.length-1){
      exit();
    }
  });
}

function exit(){
  mongoose.disconnect();
}
