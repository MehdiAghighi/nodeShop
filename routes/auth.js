const express = require('express');
const {
    check, body
} = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post(
    '/login',
    [
      body('email')
        .isEmail()
        .withMessage('Please enter a valid email address.')
        .normalizeEmail(),
      body('password', 'Password has to be valid.')
        .isLength({ min: 5 })
        .isAlphanumeric()
    ],
    authController.postLogin
  );

router.post('/signup', 
    [
        check('email')
        .isEmail() // Check If it's and email
        .withMessage('Please Enter a Valid Email !')
        .normalizeEmail()
        .custom((value, { req }) => {    // check if a user with same email already exists
            return User.findOne({email: value})
              .then(userDoc => {
                    if (userDoc) {
                        return Promise.reject('E-mail Alredy Exists, Choose a differrent One');
                    }
                })
        }),
        body('password', 
        'Please Enter a password at least 5 chars')
        .isLength({ min: 5 }) // check if password is at least 5 characters
        .isAlphanumeric() // check if password is alpha numberic
        .trim(),
        body('confirmPassword')
        .trim()
        .custom((value, { req }) => {  // check if passwords match each other
            if (value !== req.body.password) {
                throw new Error('Passwords Should Match!');
            }
            return true;
        })
    ]
        , authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;