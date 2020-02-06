const {
  validationResult
} = require('express-validator');
const mongoose = require('mongoose');

const Product = require("../models/product");
const fileHelper = require('../util/file');

exports.getAddProducts = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Admin | Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: []
  });
};

exports.postAddProducts = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;


  if (!image) {
    return res.status(422).render('admin/edit-product', {
      path: '/add-product',
      pageTitle: 'Add Product',
      errorMessage: "Attached File Can be only PNG, JPG, JPEG",
      hasError: true,
      editing: false,
      product: {
        title: title,
        price: price,
        description: description
      },
      validationErrors: []
    });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      path: '/add-product',
      pageTitle: 'Add Product',
      errorMessage: errors.array()[0].msg,
      hasError: true,
      editing: false,
      product: {
        title: title,
        price: price,
        description: description
      },
      validationErrors: errors.array()
    });
  }

  const imageUrl = 'images/' + image.filename;

  // console.log(req.user._id);
  const product = new Product({
    // _id: new mongoose.Types.ObjectId('5e2b4780b12b24295039b68f'),
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user
  });
  product
    .save()
    .then(result => {
      // console.log(result);
      console.log('Created Product');
      res.redirect('/admin/products');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;

  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Admin | Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        hasError: false,
        errorMessage: null,
        validationErrors: []
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
  const updatedDescription = req.body.description;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      path: '/add-product',
      pageTitle: 'Add Product',
      errorMessage: errors.array()[0].msg,
      hasError: true,
      editing: true,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDescription,
        _id: prodId
      },
      validationErrors: errors.array()
    });
  }

  Product.findById(prodId)
    .then(product => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect('/');
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDescription;
      if (image) {
        fileHelper.deleteFile(product.imageUrl);
        product.imageUrl = 'images/' + image.filename;
      }
      return product
        .save()
        .then(result => {
          console.log('UPDATED PRODUCT');
          res.redirect('/admin/products')
        })
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};


exports.getProducts = (req, res, next) => {
  Product.find({
      userId: req.user._id
    })
    // .select('title price -_id')
    // .populate('userId', 'name email')
    .then(products => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin | Products List',
        path: '/admin/products',

      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(prod => {
      if (!prod) {
        throw new Error('Product Not Found For Deletion');
      }
      fileHelper.deleteFile(prod.imageUrl);
      return Product.deleteOne({
        _id: prodId,
        userId: req.user._id
      });
    })
    .then(() => {
      console.log('DESTROYED PRODUCT');
      res.status(200).json({ message: "Success !" })
    })
    .catch(err => {
      res.status(500).json({ message: "Product Deletion Failed!" });
    });
}