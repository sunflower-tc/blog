var express = require('express');
var fs = require('fs');
var session = require('express-session');
var settings = require('./settings');
var path = require('path');
var MongoStore = require('connect-mongo')(session);
var db = require('./db');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash = require('connect-flash');

var route = require('./routes/index');
var user = require('./routes/user');
var article = require('./routes/article');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html',require('ejs').__express);
// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
var accessLog = fs.createWriteStream('access.log', {flags: 'a'});
app.use(logger('dev',{stream: accessLog}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret:settings.cookiesSecret,
   resave:true,
  saveUninitialized:true,
  store:new MongoStore({
 url:settings.url
  })
}));
app.use(flash());
app.use(function(req, res, next){
  res.locals.user=req.session.user;//渲染模板的对象
  res.locals.success=req.flash('success').toString();//渲染模板的对象
  res.locals.error=req.flash('error').toString();//渲染模板的对象
  res.locals.keyword='';
  next();
});
app.use('/', route);
app.use('/user', user);
app.use('/article', article);

// catch 404 and forward to error handler
app.use(function(req, res, next) {

 /* var err = new Error('Not Found');
  err.status = 404;
  next(err);*/
  res.render('404',{title:'404页面'})
});

// error handlers

// development error handler
// will print stacktrace
var errorLog = fs.createWriteStream('error.log', {flags: 'a'});
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    errorLog.write(err);
    console.log(err);
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {

  console.log(err);
  res.status(err.status || 500);

  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
