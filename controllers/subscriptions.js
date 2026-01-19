const express = require('express');
const router = express.Router();

const User = require('../models/user.js');
const Subscription = require('../models/subscription.js');

router.get('/', async (req, res) => {
    try {
        const userSubscriptions = await Subscription.find({ owner: req.session.user._id });
        res.locals.subscriptions = userSubscriptions;
        res.render('subscriptions/index.ejs', { user: req.session.user });
    } catch (error) {
        console.log(error);
        res.redirect('/');
    }
});

module.exports = router;