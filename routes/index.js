
/*
 * GET home page.
 */

exports.index = function(req, res){
	if (!req.session.username) {
		res.render('index.jade', { req:req , res:res});
	} else {
		res.redirect('userhome');
	}
};