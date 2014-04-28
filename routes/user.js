exports.loginCheck = function (db,req,res) {
	var username = req.body.username;
	var password = req.body.password;
	db.collection('userlist').findOne({'username': username}, function (err,items) {
		if (items != null) {
			if (items.password === password) {
				console.log('Logged in');
				req.session.username = items.username;
				res.redirect('userhome');
			} else {
				console.log('Password doesn\'t match');
				res.redirect('errorHandle/2');
			}
		} else {
			console.log('Username not found');
			res.redirect('errorHandle/1');
		}
	});
}

exports.register = function (req,res) {
	if(!req.session.username) {
		res.render('register.jade', {req:req, res:res});
	} else {
		res.redirect('userhome');
	}
}

exports.registerSave = function (db,req,res) {
	var username = req.body.username;
	var email = req.body.email;
	var password = req.body.password;
	db.collection('userlist').findOne({'username': username}, function (err,items) {
		if (items === null) {
			db.collection('userlist').save({'username':username, 'email':email, 'password':password, 'phonelist':[]}, function (err,items) {
				if (!err) {
					req.session.username = items.username;
					res.redirect('userhome');
				} else {
					console.log('Error in registering');
					res.redirect('errorHandle/4');
				}
			});
		} else {
			console.log('Username already exists');
			res.redirect('errorHandle/3');
		}
	});
}

exports.userhome = function (db,req,res) {
	if (req.session.username) {
		displayTable (db,req,res);
	} else {
		res.redirect('/');
	}
}

var displayTable = function (db,req,res) {
	var username = req.session.username;
	db.collection('userlist').findOne({ 'username': username }, function (err,items) {
		if (!err) {
			res.render('userhome.jade', { req:req , res:res , 'phonelist' : items.phonelist});
		} else {
			console.log('Unable to fetch data');
			res.redirect('errorHandle/5');
		}
	});
}

exports.addContact = function (db,req,res) {
	var username = req.session.username;
	var name = req.body.name;
	var phoneno = req.body.phoneno;
	var email = req.body.email;
	var temp = 0;

	db.collection('userlist').findOne({ 'username': username}, function (err,items) {
		for (var i=0 ; i<items.phonelist.length ; ++i) {
			if (items.phonelist[i].name === name) {
				temp = 1;
				break;
			}
		}

		if (temp === 0) {
			addContactNewName(db,req,res,username,name,phoneno,email);
		} else {
			addContactExistingName(db,req,res,username,name,phoneno,email);
		}
	});
}

var addContactExistingName = function (db,req,res,username,name,phoneno,email) {
	db.collection('userlist').update(
	{
		'username': username,
		'phonelist.name': name
	},
	{
		$push: {
			'phonelist.$.phoneno': phoneno,
			'phonelist.$.email': email,
		}
	},
	function (err) {
		if (!err) {
			res.redirect('userhome');
		}
		else {
			console.log('Error in upgrading contact list');
			res.redirect('errorHandle/6');
		}
	}
	);
}

var addContactNewName = function (db,req,res,username,name,phoneno,email) {
	db.collection('userlist').update(
	{
		'username': username,
	},
	{
		$push: {
			'phonelist': {
				'name': name,
				'phoneno': [phoneno],
				'email': [email]	
			}
		}
	},
	function (err) {
		if (!err) {
			res.redirect('userhome');
		}
		else {
			console.log('Error in upgrading contact list');
			res.redirect('errorHandle/6');
		}
	}
	);	
}

exports.removeContact = function (db,req,res,name) {
	var username = req.session.username;
	db.collection('userlist').update(
	{
		'username': username
	},
	{
		$pull: {
			'phonelist': {
				'name': name
			}
		}
	},
	function (err) {
		if (!err) {
			res.redirect('userhome');
		}
		else {
			console.log('Error in removing contact');
			res.redirect('errorHandle/7');
		}
	}
	);
}

exports.removePhoneno = function (db,req,res,name,phoneno) {
	console.log('name = ' + name);
	console.log('phoneno = ' + phoneno);
	var username = req.session.username;
	db.collection('userlist').update(
		{
			'username': username,
			'phonelist.name': name
		},
		{
			$pull: {
				'phonelist.$.phoneno': phoneno
			}
		},
	function (err,items) {
		if (!err) {
			res.redirect('userhome');
		}
		else {
			console.log('Error in removing phoneno : ' + err);
			res.redirect('userhome');
		}
	}
	);
}

exports.removeEmail = function (db,req,res,name,email) {
	var username = req.session.username;
	db.collection('userlist').update(
	{
		'username': username,
		'phonelist.name': name
	},
	{
		$pull: {
			'phonelist.$.email': email
		}
	},
	function (err) {
		if (!err) {
			res.redirect('userhome');
		}
		else {
			console.log('Error in removing email');
			res.redirect('userhome');
		}
	}
	);
}

exports.changePassword = function (db,req,res) {
	var username = req.session.username;
	var password = req.body.password;

	db.collection('userlist').update(
	{
		'username': username
	},
	{
		$set: {
			'password': password
		}
	},
	function (err) {
		if (!err) {
			res.redirect('userhome');
		} else {
			console.log('Error in changing password');
			res.redirect('errorHandle/8');
		}
	}
	);
}

exports.deleteUser = function (db,req,res) {
	var username  = req.session.username;
	console.log('username = ' + username);
	db.collection('userlist').findOne({'username': username}, function (err,items) {
		console.log('items = ' + JSON.stringify(items));
		if (!err) {
			db.collection('deleted_userlist').save({
				'username': items.username,
				'email': items.email,
				'password': items.password,
				'phonelist': {
					'name': items.name,
					'phoneno': [items.phoneno],
					'email': [items.email]
				}
			}, function (err) {
				if (!err) {
					db.collection('userlist').remove({'username': username}, function (err) {
						if (!err) {
							res.redirect('logout');
						} else {
							console.log('Unable to delete user');
							res.redirect('errorHandle/9');
						}
					});
				} else {
					console.log('Unable to delete user');
					res.redirect('errorHandle/9');
				}
			}
			);
		} else {
			console.log('Unable to delete user');
			res.redirect('errorHandle/9');
		}
	});
}

exports.errorHandle = function (db,req,res,errno) {
	db.collection('errorhandler').findOne({'errno': errno}, function (err,items) {
		if (!err) {
			res.render('errorHandle.jade', {'items':items});
		}
	});
}
