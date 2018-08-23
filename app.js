//引入express模块
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
//引入cookie模块
var cookieParser = require('cookie-parser');
//引入session模块
var session = require('express-session');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();


//使用art-template模板引擎(渲染页面)
var template = require('art-template');
template.config('base', '');
template.config('extname', '.html');
app.engine('.html', template.__express);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

//加载一些中间件
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser('12345'));
//session配置
app.use(session({
    secret: '12345',    //与cookieParser中的一致
    name: 'testapp',    //这里的name值得是cookie的name，默认cookie的name是：connect.sid
    // cookie: {maxAge: 80000},   //设置maxAge是80000ms，即80s后session和相应的cookie失效过期
    resave: false,      //是否允许session重新设置
    saveUninitialized: true
}));
//配置静态资源路由
app.use(express.static(path.join(__dirname, 'public')));



//系统自带子路由
app.use('/', index);
//引入子路由
app.use('/Login', require('./routes/login'));
app.use('/Index', require('./routes/index'));
app.use('/users', users);
app.use('/Personal', require('./routes/personal'));
app.use('/Manage', require('./routes/manage'));


//定义路由，这里只是做一个测试
app.get('/test', function(req, res){
  res.send('hello world!!!');
});





// 请求状态为404时所做的处理
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// 错误处理
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});




module.exports = app;
