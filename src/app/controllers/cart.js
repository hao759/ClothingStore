const Cart = require("../models/cart");

exports.viewCart = (req, res) => {
  res.render("cart");
};

function runUpdate(condition, updateData) {
  return new Promise((resolve, reject) => {
    Cart.findOneAndUpdate(condition, updateData, { upsert: true })
      .then((result) => resolve())
      .catch((err) => reject(err));
  });
}

exports.addItemToCart = async (req, res) => {
  Cart.findOne({ user: req.user._id }).then(async (cart) => {
    if (cart) {
      //if cart already exists then update cart by quantity
      let promiseArray = [];
      req.body.cartItems.forEach((cartItem) => {
        const product = cartItem.product;
        const item = cart.cartItems.find((c) => c.product == product);
        let condition, update;
        if (item) {
          condition = { user: req.body._id, "cartItems.product": product };
          update = {
            $set: {
              "cartItems.$": cartItem,
            },
          };
        } else {
          condition = { user: req.user._id };
          update = {
            $push: {
              cartItems: cartItem,
            },
          };
        }
        promiseArray.push(runUpdate(condition, update));
      });
      Promise.all(promiseArray)
        .then((response) => res.status(201).json({ response }))
        .catch((error) => res.status(400).json({ error }));
    } else {
      //if cart not exist then create a new cart
      const cart = new Cart({
        user: req.user._id,
        cartItems: req.body.cartItems,
      });

      let data = await cart.save();
      if (data) {
        return res.status(201).json({ data });
      }
    }
  });
};

exports.getCartItems = async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate(
    "cartItems.product",
    "_id name price productImage"
  );
  if (cart) {
    let data = [];
    cart.cartItems.forEach((item, index) => {
      data[index] = {
        _id: item.product._id.toString(),
        name: item.product.name,
        img: item.product.productImage,
        price: item.product.price,
        qty: item.quantity,
      };
    });
    res.status(200).json({ cartItems: data });
  }
};

// new update remove cart items
// exports.removeCartItems = (req, res) => {
//   const { productId } = req.body.payload;
//   if (productId) {
//     Cart.update(
//       { user: req.body._id },
//       {
//         $pull: {
//           cartItems: {
//             product: productId,
//           },
//         },
//       }
//     ).exec((error, result) => {
//       if (error) return res.status(400).json({ error });
//       if (result) {
//         res.status(202).json({ result });
//       }
//     });
//   }
// };
