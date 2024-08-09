module.exports = (req, res, next) => {
    if (!req.session.isTime) {
        if(!req.session.isLoggedIn){
            return res.redirect('/login');
        }else{
            return res.redirect('/city');
        }
    }
    next();
}