var express = require('express');
var router = express.Router();
var db = require('../module/db');
var Image = db.image;
var User = db.user;


//待处理路由
router.get('/wait_handle', (req, res)=>{
    Image.findAll({where: {isPass: 0}}).then(function(result){
        for(var i=0; i<result.length; i++){
            result[i].size = (Number(result[i].fileSize)/1000).toFixed(2);
            var year = result[i].uploadDate.getFullYear();
            var month = result[i].uploadDate.getMonth() + 1;
            var day = result[i].uploadDate.getDate();
            var hour = result[i].uploadDate.getHours();
            var minute = result[i].uploadDate.getMinutes();
            result[i].uploadTime = year + '.' + month + '.' + day + '&#x3000;&#x3000;' + hour + ':' + minute;
            if(result[i].isOrigin == 1){
                result[i].type = '原创';
            }else{
                result[i].type = '普通';
            }
        }
        res.render('manage/wait_handle', {waitData: result});
    }).catch(function(err){
        console.log('错误信息为：' + err.message);
    });
});


//计算待处理图片的数量接口
router.get('/wait_count', (req, res)=>{
    Image.count({where: {isPass: 0}}).then(function(number){
        res.json({num: number});
    }).catch(function(err){
        console.log('错误信息为：' + err.message);
    });
});


//处理通过操作
router.post('/judge_pass', (req, res)=>{
    //获取图片id
    var imgId = req.body.imgId;
    //获取图片星级
    var star = Number(req.body.star);
    var now = new Date();
    var getBonus = null;
    Image.findOne({where: {id: imgId}}).then(function(result){
        var isOrigin = result.isOrigin;
        var userId = result.userId;
        //处理原创图片
        if(isOrigin == 1){
            switch(star){
                case 1:
                    getBonus = 10;
                    break;
                case 2:
                    getBonus = 15;
                    break;
                case 3:
                    getBonus = 20;
                    break;
                case 4:
                    getBonus = 30;
                    break;
                case 5:
                    getBonus = 50;
                    break;
                default:
                    break;
            }
            User.findOne({where: {id: userId}}).then(function(result2){
                var originBonus = result2.originBonus;
                var newOrigin = originBonus*1 + getBonus*1;
                var bonusRequire = getBonus * 2;
                //将用户所获得的原创积分存入用户表
                User.update({originBonus: newOrigin}, {where: {id: userId}}).then(function(){
                    //将图片下载所需要的积分存入图片表
                    Image.update({bonusRequire: bonusRequire, isPass: 1, passDate: now}, {where: {id: imgId}}).then(function(){
                        //计算待处理图片的数量
                        Image.count({where: {isPass: 0}}).then(function(number){
                            res.json({status: 200, num: number});
                        });
                    });
                });
            }).catch(function(err2){
                console.log('err2出错信息为：' + err2.message);
            });
        }else{
            switch(star){
                case 1:
                    getBonus = 5;
                    break;
                case 2:
                    getBonus = 10;
                    break;
                case 3:
                    getBonus = 15;
                    break;
                case 4:
                    getBonus = 20;
                    break;
                case 5:
                    getBonus = 30;
                    break;
                default:
                    break;
            }
            User.findOne({where: {id: userId}}).then(function(result2){
                var commonBonus = result2.commonBonus;
                var newOrigin = commonBonus*1 + getBonus*1;
                var bonusRequire = getBonus * 2;
                //将用户所获得的普通积分存入用户表
                User.update({commonBonus: newOrigin}, {where: {id: userId}}).then(function(){
                    //将图片下载所需要的积分存入图片表
                    Image.update({bonusRequire: bonusRequire, isPass: 1, passDate: now}, {where: {id: imgId}}).then(function(){
                        res.json({status: 200});
                    });
                });
            }).catch(function(err3){
                console.log('err3出错信息为：' + err3.message);
            });
        }
    }).catch(function(err){
        console.log('err出错信息为：' + err.message);
    });
});


router.post('/judge_dispass', (req, res)=>{
    var imgId = req.body.imgId;
    var reason = req.body.reason;
    Image.update({reason: reason, isPass: -1}, {where: {id: imgId}}).then(function(){
        res.json({status: 200});
    })
});


//通过路由
router.get('/pass', (req, res)=>{
    Image.findAll({where: {isPass: 1}}).then(function(result){
        for(var i=0; i<result.length; i++){
            result[i].size = (Number(result[i].fileSize)/1000).toFixed(2);
            var year = result[i].uploadDate.getFullYear();
            var month = result[i].uploadDate.getMonth() + 1;
            var day = result[i].uploadDate.getDate();
            var hour = result[i].uploadDate.getHours();
            var minute = result[i].uploadDate.getMinutes();
            result[i].uploadTime = year + '.' + month + '.' + day + '&#x3000;&#x3000;' + hour + ':' + minute;
            var passYear = result[i].passDate.getFullYear();
            var passMonth = result[i].passDate.getMonth() + 1;
            var passDay = result[i].passDate.getDate();
            var passHour = result[i].passDate.getHours();
            var passMinute = result[i].passDate.getMinutes();
            result[i].passTime = passYear + '.' + passMonth + '.' + passDay + '&#x3000;&#x3000;' + passHour + ':' + passMinute;
            if(result[i].isOrigin == 1){
                result[i].type = '原创';
            }else{
                result[i].type = '普通';
            }
        }
        res.render('manage/pass', {passData: result});
    }).catch(function(err){
        console.log('错误信息为：' + err.message);
    });
});


//未通过路由
router.get('/dispass', (req, res)=>{
    Image.findAll({where: {isPass: -1}}).then(function(result){
        for(var i=0; i<result.length; i++){
            result[i].size = (Number(result[i].fileSize)/1000).toFixed(2);
            var year = result[i].uploadDate.getFullYear();
            var month = result[i].uploadDate.getMonth() + 1;
            var day = result[i].uploadDate.getDate();
            var hour = result[i].uploadDate.getHours();
            var minute = result[i].uploadDate.getMinutes();
            result[i].uploadTime = year + '.' + month + '.' + day + '&#x3000;&#x3000;' + hour + ':' + minute;
            if(result[i].isOrigin == 1){
                result[i].type = '原创';
            }else{
                result[i].type = '普通';
            }
        }
        res.render('manage/dispass', {dispassData: result});
    }).catch(function(err){
        console.log('错误信息为：' + err.message);
    });
});


//导出路由模块
module.exports = router;