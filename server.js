const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const morgan = require('morgan');
const MongoStore = require('connect-mongo');
const session = require('express-session');
const path = require('path');

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
app.use(express.static(path.join(__dirname, "public")));

app.use(passUserToView);

//routes
app.get('/', async (req, res) => {
  const user = req.session.user;
  if (!user) return res.render('index.ejs', { user: null });

  try {
    const subscriptions = await subscription.find({ owner: user._id });

    const active = subscriptions.filter(s => s.status === 'Active');
    const cancelled = subscriptions.filter(s => s.status === 'Cancelled');
    const paused = subscriptions.filter(s => s.status === 'Paused');

    const totalMonthlyCostByCurrency = active.reduce((totals, sub) => {
      let monthly = 0;
      if (sub.subType === 'Weekly') monthly = sub.price * 4;
      else if (sub.subType === 'Monthly') monthly = sub.price;
      else if (sub.subType === 'Yearly') monthly = sub.price / 12;

      totals[sub.currency] = (totals[sub.currency] || 0) + monthly;
      return totals;
    }, {});

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const limit = new Date(today);
    limit.setDate(limit.getDate() + 30);

    const upcomingRenewals = active
      .map(sub => {
        const obj = sub.toObject();
        let date = obj.renewalDate ? new Date(obj.renewalDate) : null;

        if (date && obj.subType !== 'Trial') {
          date.setHours(0, 0, 0, 0);
          while (date < today) {
            if (obj.subType === 'Weekly') date.setDate(date.getDate() + 7);
            else if (obj.subType === 'Monthly') date.setMonth(date.getMonth() + 1);
            else if (obj.subType === 'Yearly') date.setFullYear(date.getFullYear() + 1);
            else break;
            date.setHours(0, 0, 0, 0);
          }
        } else {
          date = null;
        }

        obj.nextRenewalDate = date;
        return obj;
      })
      .filter(sub => sub.nextRenewalDate && sub.nextRenewalDate >= today && sub.nextRenewalDate <= limit)
      .sort((a, b) => a.nextRenewalDate - b.nextRenewalDate)
      .slice(0, 5);

    res.render('index.ejs', {
      user,
      subscriptions: { active, cancelled, paused },
      totalMonthlyCostByCurrency,
      upcomingRenewals
    });

  } catch (err) {
    console.log(err);
    res.render('index.ejs', { user });
  }
});

app.use('/auth', authController);
app.use(isSignedIn);
app.use('/subscriptions', subscriptionsController);


app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});