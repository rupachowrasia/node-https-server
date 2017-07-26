var fs = require('fs');
var https = require('https');

var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');

var passport = require('passport');
var passportLocal = require('passport-local');
var passportHttp = require('passport-http');

var app = express();

// req -x509 -nodes -days 365 -newkey rsa:1024 -out my.crt -keyout my.key [need to create cert and key]
var server = https.createServer({
	cert: fs.readFileSync(__dirname + '/my.crt'),
	key: fs.readFileSync(__dirname + '/my.key')
}, app);

app.set('views', __dirname + '/view');
app.set('view engine', 'ejs');

// middleware
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
	secret: 'secretkeygoeshere',
	resave: true,
	saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new passportLocal.Strategy(verifyCredentials));
passport.use(new passportHttp.BasicStrategy(verifyCredentials));

function verifyCredentials(username, password, done){
	if(username === password){
		done(null, {id: username, name: username});
	} 
	else {
		done(null, null);
	}
}

passport.serializeUser(function(user, done){
	done(null, user.id);
});

passport.deserializeUser(function(id, done){
	done(null, {id: id, name:id});
});

function ensureAuthenticate(req, res, next){
	if(req.isAuthenticated()){
		next();
	} else {
		res.send(403);
	}
}

// route
app.get('/', function(req, res){
	res.render('index', {
		isAuthenticated: req.isAuthenticated(),
		user: req.user
	});
});

app.get('/login', function(req, res){
	res.render('login');
});

app.get('/logout', function(req, res){
	req.logout('');
	res.redirect('/');
});

app.post('/login', passport.authenticate('local'), function(req, res){
	res.redirect('/');
});

app.use('/api', passport.authenticate('basic'));

app.get('/api/data', ensureAuthenticate, function(req, res){
	res.json([
		{ value: 'aaa'},
		{ value: 'bbb'},
	]);
});

server.listen(3000, function(req, res){
	console.log('server is up!!');
});
