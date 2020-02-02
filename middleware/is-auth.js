module.exports = ( req, res, next ) => {
    if (!req.session.isLoggedIn) {
        return res.status(404).render("404", {
            pageTitle: "Not Found",
            path: "404",
            isAuthenticated: req.session.isLoggedIn
        })
    }
    next();
}