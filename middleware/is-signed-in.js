const isSignedIn = (req, res, next) => {    
    if (req.session.user) {
        return next();
    } else {
        return res.redirect('/auth/sign-in');
    }
};

module.exports = isSignedIn;