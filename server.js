const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const morgan = require('morgan');
const MongoStore = require('connect-mongo');
const session = require('express-session');

const subscription = require('./models/subscription.js');
const user = require('./models/user.js');
const isSignedIn = require('./middleware/is-signed-in.js');
const passUserToView = require('./middleware/pass-user-to-view.js');
const authController = require('./controllers/auth.js');
const subscriptionsController = require('./controllers/subscriptions.js');


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

app.use(passUserToView);

//routes
app.get('/', async(req, res) => {
    const user = req.session.user;
        if (!user) {
            return res.render('index.ejs', { user: null });
        }
        try {
            const subscriptions = await subscription.find({ owner: user._id });
            const activeSubscriptions = subscriptions.filter(sub => sub.status === 'Active');
            const cancelledSubscriptions = subscriptions.filter(sub => sub.status === 'Cancelled');
            const pausedSubscriptions = subscriptions.filter(sub => sub.status === 'Paused');

            const totalMonthlyCost = activeSubscriptions.reduce((total, sub) => {
                const currency = sub.currency || ';
            
                if (sub.subType === 'Weekly') monthlyPrice = (Number(sub.price) || 0) * 4;
                else if (sub.subType === 'Monthly') monthlyPrice = (Number(sub.price) || 0);
                else if (sub.subType === 'Yearly') monthlyPrice = (Number(sub.price) || 0) / 12;
                else monthlyPrice = 0;
                return total + monthlyPrice;
            }, 0);

            const today = new Date();
            const next30Days = new Date();
            next30Days.setDate(today.getDate() + 30);

            const upcomingRenewals = activeSubscriptions.filter(sub => {
                if (!sub.renewalDate) return false;
                return sub.renewalDate >= today && sub.renewalDate <= next30Days;
            }).sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate)).slice(0, 5);

            return res.render('index.ejs', {
                user: req.session.user,
                subscriptions: {
                    active: activeSubscriptions,
                    cancelled: cancelledSubscriptions,
                    paused: pausedSubscriptions,
                },
                totalMonthlyCost,
                upcomingRenewals
            });

    } catch (error) {
        console.log(error);
        return res.render('index.ejs', { user: req.session.user });
    }
});

app.use('/auth', authController);
app.use(isSignedIn);
app.use('/subscriptions', subscriptionsController);


app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});