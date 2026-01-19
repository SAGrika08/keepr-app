const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const User = require('../models/user.js');

// render sign-up/sign-in form
router.get('/sign-up', (req, res) => {
    res.render('auth/sign-up.ejs');
});

router.get ('/sign-in', (req, res) => {
    res.render('auth/sign-in.ejs');
});

router.get('/sign-out', (req, res) => {
    req.session.destroy((err) => {
        res.redirect('/');  
    });
});

router.post('/sign-up', async (req, res) => {
    try {
       const userInDatabase = await User.findOne({ username: req.body.username });
         if (userInDatabase) {
              return res.send('Username already taken');
         }  
         if (req.body.password !== req.body.confirmPassword) {
              return res.send('Passwords do not match');
         }

         const hashedPassword = await bcrypt.hashSync(req.body.password, 10);
         req.body.password = hashedPassword;

         await User.create(req.body);

            res.redirect('/auth/sign-in');  
    } catch (error) {
        console.log(error);
        res.redirect('/');
    }
});

router.post('/sign-in', async (req, res) => {
    try {
        const userInDatabase = await User.findOne({ username: req.body.username });
        if (!userInDatabase) {
            return res.send('Invalid username or password');
        }

        const passwordMatches = await bcrypt.compareSync(req.body.password, userInDatabase.password);
        if (!passwordMatches) {
            return res.send('Invalid username or password');
        }

        req.session.user = {
            _id: userInDatabase._id,
            username: userInDatabase.username
        };
        req.session.save(() => {
            res.redirect('/');
        });
    } catch (error) {
        console.log(error);
        res.redirect('/');
    }
});

module.exports = router;