const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const Product = require("../models/product");
const Order = require('../models/order');


exports.getProducts = (req, res, next) => {
  Product.find()
    .then(products => {
      console.log(req.session.isLoggedIn);
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'Shop | Products List',
        path: '/products',

      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: `Shop | ${product.title}`,
        path: "/products",

      })
    }).catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  Product.find()
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop | Home Page',
        path: '/',

      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });


};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId', 'title')
    .execPopulate()
    .then(user => {
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products,

      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};


exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;

  Product.findById(prodId)
    .then(product => {
      req.user.addToCart(product);
      res.redirect("/cart");
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return {
          product: {
            ...i.productId._doc
          },
          quantity: i.quantity
        };
      });

      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      });

      return order.save();
    })
    .then(() => {
      req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders")
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({
      "user.userId": req.user._id
    })
    .then(orders => {
      res.render('shop/orders', {
        pageTitle: 'Shop | Orders',
        path: '/orders',
        orders: orders,
      });
    })
};

exports.getCheckout = (req, res, next) => {
  res.render('shop/checkout', {
    pageTitle: 'Shop | Checkout',
    path: '/checkout',
  });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  const invoiceName = "invoice-" + orderId + ".pdf";
  const invoicePath = path.join("data", "invoices", invoiceName);

  Order.findById(orderId)
    .then(order => {
      if (!order) {
        throw new Error('No Order Found For Invoice !');
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        throw new Error('Unauthorized ! Login With Correct User');
      }
      
      const pdfDoc = new PDFDocument();
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="' + invoiceName + '"');
      
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);

      pdfDoc.fontSize(26).text('Invoice', {
        align: 'center',
        // underline: true
      });
      pdfDoc.text('---------------------', {
        align: 'center',
        // underline: true
      });
      pdfDoc.moveDown()
      let totalPrice = 0;
      order.products.forEach(item => {
        totalPrice += item.quantity * item.product.price;
        pdfDoc.fontSize(15).text(
          item.product.title + 
          ' - ' +
          item.quantity + 
          ' x ' + 
          '$' + item.product.price
        )
      })
      pdfDoc.moveDown()
      pdfDoc.fontSize(20).text('---------------------', {
        align: 'center',
        // underline: true
      });
      pdfDoc.text('Total Price: $' + totalPrice, {
        align: 'center',
        // underline: true
      })
      pdfDoc.end();

      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {
      //     return next(err);
      //   } else {
      //     res.setHeader('Content-Type', 'application/pdf');
      //     res.setHeader('Content-Disposition', 'attachment; filename="' + invoiceName + '"');
      //     res.send(data);
      //   }
      // })

      // const file = fs.createReadStream(invoicePath);
      // file.pipe(res);

    })
    .catch(err => next(err));

};