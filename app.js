const path = require("path");

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const tunnel = require('tunnel-ssh');

require('dotenv').config();

const rootDir = require('./util/path');

const errorsController = require("./controllers/error");

const User = require('./models/user');

const app = express();

var sshConfig = {
  username: process.env.SERVER_USERNAME,
  password: process.env.SERVER_PASSWORD,
  host: process.env.SERVER_IP,
  port: 22,
  dstHost: process.env.SERVER_IP,
  dstPort: 27017,
  localHost: 'localhost',
  localPort: 5381
};

const actions = async (app, mongodbUri) => {
  const store = new MongoDBStore({
    uri: `${mongodbUri}?connectTimeoutMS=10`,
    collection: 'sessions',
  },
  function (err) {
    if (err) {
      console.log(err);
    }
  });

store.on('error', function (err) {
  console.log(err);
});

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now().toString() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg") {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

const csrfProtection = csrf();

app.set('view engine', 'ejs');
app.set("views", "views");

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(multer({
  storage: fileStorage,
  fileFilter: fileFilter
}).single('image'));

app.use(express.static(path.join(rootDir, "public")));
app.use("/images", express.static(path.join(rootDir, "images")));

app.use(session({
  secret: process.env.SESSION_SECRET,
  saveUninitialized: false,
  resave: false,
  store: store,
}));

app.use(csrfProtection)
app.use(flash());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
})

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => {
      return next(err);
    });
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.use("/500", errorsController.get500);
app.use(errorsController.get404);

// Error Handler
app.use((error, req, res, next) => {
  console.log(error);
  res.status(500).render("500", {
    pageTitle: "Server Error",
    path: "500",
  })
})

mongoose.connect(mongodbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(result => {
    mongoose.set('debug', true);
    app.listen(4000);
  })
  .catch(err => console.log(err))
}

if (process.env.PROCESS_MACHINE === "PC") {
  console.log("PC")
  const MONGODB_URI = process.env.MONGODB_URI;
  tunnel(sshConfig, async function (error, server) {
    await actions(app, MONGODB_URI);
  })
} 
else if (process.env.PROCESS_MACHINE === "SERVER") {
  console.log("SERVER");
  const MONGODB_URI = process.env.MONGODB_URI;
  actions(app, MONGODB_URI)
}