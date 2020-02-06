const express = require('express');
const { body } = require('express-validator');

const adminController = require('../controllers/admin');

const isAuth = require('../middleware/is-auth');

const router = express.Router();

// /admin/add-product => GET
router.get( '/add-product', isAuth, adminController.getAddProducts )

// /admin/add-product => POST
router.post( '/add-product', [
    body('title')
        .isString()
        .isLength({ min: 3 })
        .trim(),
    body('price')
        .isFloat(),
    body('description')
        .isLength({ min: 5, max: 400 })
        .trim()
], isAuth, adminController.postAddProducts )

// /admin/edit-product => GET
router.get( '/edit-product/:productId', isAuth, adminController.getEditProduct )

// /admin/edit-product => POST
router.post( '/edit-product', [
    body('title')
        .isString()
        .isLength({ min: 3 })
        .trim(),
    body('price')
        .isFloat(),
    body('description')
        .isLength({ min: 5, max: 400 })
        .trim()
], isAuth, adminController.postEditProduct )

// /admin/products => GET
router.get( '/products', isAuth, adminController.getProducts )

// /admin/delete-product => POST
router.delete( '/product/:productId', isAuth, adminController.deleteProduct )


module.exports = router;