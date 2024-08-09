
module.exports = (req, res, next) => {
    if (req.session.isLoggedIn) {
        // If user is logged in, prevent accessing the login page
        return res.redirect('/city');
    }
    next();
}
