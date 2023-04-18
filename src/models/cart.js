//model definition for the cart object, if undefined, assign default values
module.exports = function Cart(oldCart){
  this.items = oldCart.items || {};
  this.totalQuantity = oldCart.totalQuantity || 0;
  this.totalPrice = oldCart.totalPrice || 0;

  this.add = function(item, id){
    var storedItem = this.items[id];

    //check if item exists in cart for item grouping, if not, create item grouping
    if(!storedItem){
      storedItem = this.items[id] = {item: item, quantity: 0, price: item.price};
    }


    //increase product grouping for item and total price of the grouping
    storedItem.quantity++;
    storedItem.price = (storedItem.item.price * storedItem.quantity);

    //update cart total quantity and total price
    this.totalQuantity++;
    this.totalPrice += storedItem.item.price;
  }

  //returns cart as an array object for display
  this.generateArray = function(){
    var arr = [];
    for(var id in this.items){
      arr.push(this.items[id]);
    }
    return arr;
  };


  this.removeItem = function(id) {
      if(this.items.length = 1){
        delete this.items[id];
        this.items = {};
        this.totalQuantity = null;
        this.totalPrice = 0;
      } else {
        this.totalQuantity -= this.items[id].quantity;
        this.totalPrice -= this.items[id].price;
        delete this.items[id];
      }


    };

  this.decreaseByOne = function(id) {
      if (this.items[id].quantity <= 1) {
        this.totalQuantity -= this.items[id].quantity;
        this.totalPrice -= this.items[id].price;
        delete this.items[id];

        if(this.totalQuantity < 1){
          {
            delete this.items[id];
            this.totalQuantity = null;
            this.totalPrice = 0;
            this.items = {};
          }
        }

      }else {
        this.items[id].quantity--;
        this.items[id].price -= this.items[id].item.price;
        this.totalQuantity--;
        this.totalPrice -= this.items[id].item.price;
    }
  };

  this.increaseByOne = function(id) {
      this.items[id].quantity++;
      this.items[id].price += this.items[id].item.price;
      this.totalQuantity++;
      this.totalPrice += this.items[id].item.price;
  };
};
