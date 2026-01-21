const express = require('express');
const router = express.Router();

const User = require('../models/user.js');
const Subscription = require('../models/subscription.js');

router.get('/', async (req, res) => {
    try {
        const status = req.query.status;
        const sortBy = req.query.sortBy;

        const query = { owner: req.session.user._id };
        if (status === 'Active' || status === 'Paused' || status === 'Cancelled') {
            query.status = status;
        }
        let sortOption = {};
        if (sortBy === 'renewalDate') {
            sortOption.renewalDate = 1; 
        }
        const userSubscriptions = await Subscription.find(query).sort(sortOption);
        res.locals.subscriptions = userSubscriptions;
        res.render('subscriptions/index.ejs', { 
            user: req.session.user,
            subscriptions: userSubscriptions,
            currentStatus: status || 'All',
            currentSort: sortBy || 'None'    
        });
    } catch (error) {
        console.log(error);
        res.redirect('/');
    }
});

router.get('/new', async (req, res) => {
    res.render('subscriptions/new.ejs');
});

router.post('/', async (req, res) => {
    try {
        req.body.owner = req.session.user._id;
        await Subscription.create(req.body);
        res.redirect('/subscriptions');
    } catch (error) {
        console.log(error);
        res.redirect('/subscriptions');
    }
});

router.get('/:subscriptionId', async (req, res) => {
    try {
        const populatedSubscriptions = await Subscription.findById(req.params.subscriptionId).populate('owner');
        if (!populatedSubscriptions) {  
            return res.redirect('/subscriptions');
        }
        res.render('subscriptions/show.ejs', { subscription: populatedSubscriptions }); 
     } catch (error) {
        console.log(error);
        res.redirect('/'); 
    }
});

router.delete('/:subscriptionId', async (req, res) => {
    try {
        const subscriptionToDelete = await Subscription.findById(req.params.subscriptionId);
        if (subscriptionToDelete.owner.equals(req.session.user._id)) {
            await subscriptionToDelete.deleteOne();
            res.redirect('/subscriptions');
        } else {
            res.send('You do not have permission to delete this subscription.');
        }
    } catch (error) {
        console.log(error);
        res.redirect('/subscriptions');
    }
});

router.get('/:subscriptionId/edit', async (req, res) => {
    try {
        const subscriptionToEdit = await Subscription.findById(req.params.subscriptionId);
        res.render('subscriptions/edit.ejs', { subscription: subscriptionToEdit });
    } catch (error) {
        console.log(error);
        res.redirect('/subscriptions');
    }
});

router.put('/:subscriptionId', async (req, res) => {
    try {
        const currentSubscription = await Subscription.findById(req.params.subscriptionId);
        if (currentSubscription.owner.equals(req.session.user._id)) {
            await currentSubscription.updateOne(req.body);      
            res.redirect('/subscriptions/' + req.params.subscriptionId);
        } else {
            res.send('You do not have permission to edit this subscription.');
        }
    } catch (error) {
        console.log(error);
        res.redirect('/subscriptions');
    }
});

module.exports = router;