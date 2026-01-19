const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const morgan = require('morgan');
const MongoStore = require('connect-mongo');
const session = require('express-session');

const authController = require('./controllers/auth.js');

const port = process.env.PORT ? process.env.PORT :'3000';
mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('connected', () => {
  console.log(`Conneted to MongoDB ${mongoose.connection.name}`);
});

app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
//app.use(morgan('dev'));
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        store: MongoStore.MongoStore.create({
            mongoUrl: process.env.MONGODB_URI,
        }),
    })
);

//routes
app.get('/', (req, res) => {
    res.render('index.ejs', { user: req.session.user });
});

app.use('/auth', authController);

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});