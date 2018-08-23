var express = require('express');
var router = express.Router();
var db = require('../module/db');
var Image = db.image;
var HotSearch = db.hotSearch;
var User = db.user;
var Focus = db.focus;


//主页路由：首先判断登录者是否为管理员，如果是则做特殊处理，不是则跳到下一条路由
router.get('/', (req, res, next)=>{
    if(req.session.userName == 'manager'){
        res.render('manage/review', {user: req.session.userName});
    }else{
        next();
    }
})


//主页路由
router.get('/', (req, res)=>{
    var userName = null;
    if(req.session.userName){
        userName = req.session.userName;
    }
    Image.findAndCountAll({where: {parentKind: '设计', isPass: 1}, limit: 7}).then(function(design){
        var designData = design.rows;
        Image.findAndCountAll({where: {parentKind: '摄影', isPass: 1}, limit: 7}).then(function(photo){
            var photoData = photo.rows;
            Image.findAndCountAll({where: {parentKind: '多媒体', isPass: 1}, limit: 7}).then(function(media){
                var mediaData = media.rows;
                res.render('index/index', {user: userName, designData: designData, photoData: photoData, mediaData: mediaData});
            });
        });
    }).catch(function(err){
        console.log('错误信息为: ' + err.message);
    });
});


//二级分类页面
router.get('/grand_classify', (req, res)=>{
    var userName = req.session.userName || null;
    var kind = req.query.kind;
    var pKind = req.query.pKind;
    Image.findAll({where: {kind: kind, parentKind: pKind, isPass: 1}}).then(function(result){
        res.render('index/grand_classify', {user: userName, imgData: result, grandson: kind});
    }).catch(function(err){
        console.log('错误信息为: ' + err.message);
    });
});


//素材详情页
router.get('/work_detail', (req, res)=>{
    var userName = req.session.userName;
    var uid = req.session.userId || 0;
    var imgId = req.query.id;
    Image.findOne({where: {id: imgId}}).then(function(result){
        var num = result.imgName.split('-')[0];
        var theDate = result.uploadDate;
        var year = theDate.getFullYear();
        var month = theDate.getMonth()+1
        if(month < 10){
            month = '0' + month;
        }
        var whichDay = theDate.getDate();
        if(whichDay < 10){
            whichDay = '0' + whichDay;
        }
        var uploadDate = year + '-' + month + '-' + whichDay;
        var size = (Number(result.fileSize)/1000).toFixed(2);
        User.findOne({where: {id: result.userId}}).then(function(result2){
            var uploader = result2.account;
            Focus.findOne({where: {fansId: uid, imageId: imgId}}).then(function(result3){
                var isCollect = 0;
                if(result3){
                    isCollect = 1;
                }
                res.render('index/work_detail', {user: userName, uploaderId: result.userId, uploader: uploader, workData: result, num: num, uploadDate: uploadDate, size: size, isCollect: isCollect});
            })
        }).catch(function(err2){
            console.log('err2错误信息为: ' + err2.message);
        });
    }).catch(function(err){
        console.log('错误信息为: ' + err.message);
    });
});


//获取用户信息接口
router.get('/get_user_info', (req, res)=>{
    var userName = req.session.userName || null;
    User.findOne({where: {account: userName}}).then(function(result){
        if(result){
            res.json({userInfo: result});
        }else{
            res.json({status: 400});
        }
    }).catch(function(err){
        console.log('错误信息为: ' + err.message);
    });
});


//扣除用户积分
router.post('/use_bonus', (req, res)=>{
    var userName = req.session.userName;
    console.log(req.body);
    if(req.body.originBonus){
        var originBonus = req.body.originBonus;
        var totalBonus = req.body.totalBonus;
        var currentBonus = totalBonus - originBonus;
        User.update({originBonus: currentBonus}, {where: {account: userName}}).then(function(){
            res.json({status: 200});
        });
    }else if(req.body.commonBonus){
        var commonBonus = req.body.commonBonus;
        var totalBonus = req.body.totalBonus;
        var currentBonus = totalBonus - commonBonus;
        User.update({commonBonus: currentBonus}, {where: {account: userName}}).then(function(){
            res.json({status: 200});
        });
    }else{
        res.json({status: 400});
    }
});


//用户收藏素材功能
router.post('/collect_handle', (req, res)=>{
    var fansId = req.body.fansId;
    var imgId = req.body.imgId;
    var userId = req.body.userId;
    Focus.create({
        userId: userId,
        fansId: fansId,
        imageId: imgId
    }).then(function(){
        res.json({status: 200});
    }).catch(function(err){
        console.log('错误信息为: ' + err.message);
    });
});


//用户取消收藏功能
router.post('/discollect_handle', (req, res)=>{
    var fansId = req.body.fansId;
    var imgId = req.body.imgId;
    Focus.destroy({where: {fansId: fansId, imageId: imgId}}).then(function(){
        res.json({status: 200});
    }).catch(function(err){
        console.log('错误信息为: ' + err.message);
    });
});


//用户搜索功能
router.get('/search', (req, res)=>{
    var keywords = req.query.keywords;
    //判断用户输入的关键字是否为空字符串，如果是空字符则刷新当前页面
    if(keywords == ''){
        res.json({status: 200});
    }else{
        Image.findAll({where: {$or: [{kind: {$like: '%'+keywords+'%'}}, {parentKind: {$like: '%'+keywords+'%'}}], isPass: 1}}).then(function(result1){
            HotSearch.findOne({where: {keywords: keywords}}).then(function(result2){
                if(result2){
                    var reCount = result2.count + 1;
                    HotSearch.update({count: reCount, update: Date.now()}, {where: {keywords: keywords}}).then(function(){
                        res.json({data: result1});
                    });
                }else{
                    HotSearch.create({keywords: keywords, count: 1, createDate: Date.now(), update: Date.now()}).then(function(){
                        res.json({data: result1});
                    });
                }
            });
        }).catch(function(err){
            console.log('错误信息为: ' + err.message);
        });
    }
});


//热搜功能
router.get('/show_hot_search', (req, res)=>{
    //计算本周一时间
    var lastWeek = new Date();
    var lastMonth = lastWeek.getMonth();
    var toDate = lastWeek.getDate();
    var newDate = toDate - 7;
    if(newDate <= 0){
        newDate += 30;
        lastWeek.setMonth(lastMonth - 1);
    }
    lastWeek.setDate(newDate);
    //筛选出12条记录
    HotSearch.findAll({where: {update: {gt: lastWeek}}, limit: 12, order: 'count DESC'}).then(function(result){
        res.json({data: result});
    }).catch(function(err){
        console.log('错误信息为: ' + err.message);
    });
});


//帮助中心路由
router.get('/help', (req, res)=>{
    res.render('index/help');
});


module.exports = router;
