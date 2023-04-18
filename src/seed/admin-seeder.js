//single instance file
//used for populating database with products for the store
//not executed each run.


var Admin = require('../models/admin');

var mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/admins', {useNewUrlParser: true});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("we're connected!");
});

var admins = [
  new Admin({
    email: "admin@admin.net",
    password: "cs602_adminsecret",
  })];

var done = 0;
for(var index =0; index < admins.length; index++){
  admins[index].save(function(err, result){
    done++;
    if(done == admins.length-1){
      exit();
    }
  });
}

function exit(){
  mongoose.disconnect();
}
