var express = require('express');
//引入路由模块，用于后面路由的配置
var router = express.Router();
//引入数据库模块
var db = require('../module/db');
//获取用户表模型
var User = db.user;

//定义登录get路由，跳转到登录页面
router.get('/login', (req, res)=>{
    if(req.session.userName){
        res.redirect('/Index');
    }else{
        res.render('login/login');
    }
});

//定义登录post路由，处理用户登录
router.post('/login', (req, res)=>{
    var acc = req.body.account;
    var pwd = req.body.password;
    if(acc == 'admin' && pwd == 'admin'){
        req.session.userName = 'manager';
        req.session.userId = null;
        res.json({status: 200, msg: '管理员登录，准备跳转!!'});
    }else{
        //到数据库中查找用户输入的账号密码是否存在，存在则进入主页，不存在则提示错误信息
        User.findOne({where: {account: acc, password: pwd}}).then(function(result){
            if(result){
                //设置用户session，包括用户名和用户id
                req.session.userName = acc;
                req.session.userId = result.id;
                res.json({status: 200, msg: '登录成功，准备跳转!!'});
            }else {
                res.json({status: 400, msg: '账号密码错误，请重新输入...'});
            }
        }).catch(function(err){
            console.log('出错信息为: ' + err.message);
        });
    }
});

//退出登录
router.get('/logout', (req, res)=>{
    req.session.userName = null;
    res.redirect('/Index');
});

//定义注册get路由，跳转到注册页面
router.get('/register', (req, res)=>{
    res.render('login/register');
});

//定义注册post路由，注册用户名并存到数据库
router.post('/register', (req, res)=>{
    var regData = req.body;
    var account = regData.account;
    var password = regData.password;
    var email = regData.email;
    //将用户填写的注册信息存入数据库，如果该用户存在则报错
    User.findOne({where: {account:account}}).then(function(result1){
        if(!result1){
            User.create({
                account: account,
                password: password,
                email: email,
                commonBonus: 30,
                originBonus: 0,
                signature: ''
            }).then(function(result2){
                res.json({status: 1});
            }).catch(function(err){
                res.json({status: 0, msg: '注册失败，请联系管理员!'});
            });
        }else {
            res.json({status: 0, msg: '用户已经存在!!'});
        }
    }).catch(function(err2){
        console.log('出错信息为: ' + err2.message);
    })
});

//接收忘记密码get路由，跳转到忘记密码页面
router.get('/forget_pwd', (req, res)=>{
    res.render('login/forget-pwd');
});

//跳转重设密码页面
router.post('/forget_pwd', (req, res)=>{
    var account = req.body.account;
    var email = req.body.email;
    User.findOne({where: {account: account, email: email}}).then(function(result){
        if(result){
            res.json({status: 200, userId: result.id});
        }else{
            res.json({status: 400});
        }
    }).catch(function(err){
        console.log('错误信息为: ' + err.message);
    });
});

//重新设置密码get路由
router.get('/reset_pwd', (req, res)=>{
    var uid = req.query.user;
    res.render('login/reset-pwd', {uid: uid});
});

//重新设置密码post路由
router.post('/reset_pwd', (req, res)=>{
    var uid = req.body.userId * 1;
    var pwd = req.body.password;
    User.update({password: pwd}, {where: {id: uid}}).then(function(){
        res.redirect('/Login/login');
    });
});




//导出子模块
module.exports = router;