
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');

var mongo = require('mongoskin');
var db = mongo.db("mongodb://localhost:27017/phone_dir", {native_parser:true});	

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.cookieParser());
app.use(express.session({secret: '1234567890QWERTY'}));
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.post('/registerSave', function (req,res,next) { user.registerSave(db,req,res); });
app.post('/loginCheck', function (req,res,next) { user.loginCheck(db,req,res); });
app.post('/addContact', function (req,res,next) { user.addContact(db,req,res); });
app.get('/userhome', function (req,res,next) { user.userhome(db,req,res); });

app.get('/removeContact/:name', function (req,res,next) { user.removeContact(db,req,res,req.params.name); });
app.get('/removePhoneno/:name/:phoneno', function (req,res,next) { user.removePhoneno(db,req,res,req.params.name,req.params.phoneno); });
app.get('/removeEmail/:name/:email', function (req,res,next) { user.removeEmail(db,req,res,req.params.name,req.params.email); });

app.post('/changePassword', function (req,res,next) { user.changePassword(db,req,res); });
app.get('/deleteUser', function (req,res,next) { user.deleteUser(db,req,res); });

app.get('/logout', function (req,res,next) {
	console.log(JSON.stringify(req.session.userObject)); 
	req.session.destroy();
	console.log('Logged out'.green);
	res.redirect('/');
});

app.get('/errorHandle/:errno', function (req,res,next) { user.errorHandle(db,req,res,req.params.errno); });

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
