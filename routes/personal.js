const express = require('express');
const router = express.Router();
var db = require('../module/db');
var User = db.user;
var Focus = db.focus;
var Image = db.image;

//配置文件上传
var multer = require('multer');
//通过 filename 属性定制(文件上传)
var storage1 = multer.diskStorage({
    destination: './public/uploads/origin-file/',
    filename: function (req, file, cb) {
        //设置保存文件名
        cb(null, Date.now() + '-' + file.originalname);
    }
});
var upload1 = multer({storage: storage1});
//通过 filename 属性定制(图片上传)
var storage2 = multer.diskStorage({
    destination: './public/uploads/',
    filename: function (req, file, cb) {
        //设置保存图片名
        cb(null, Date.now() + '-' + file.originalname);
    }
});
var upload2 = multer({storage: storage2});

//头像上传配置
var storage3 = multer.diskStorage({
    destination: './public/uploads/touxiang/',
    filename: function (req, file, cb) {
        var defind = req.session.userId + '-touxiang' + file.originalname.substring(file.originalname.lastIndexOf('.'));
        //设置保存图片名
        cb(null, defind);
    }
});
var upload3 = multer({storage: storage3});


//个人中心页面
router.get('/', (req, res)=>{
    var userName = req.session.userName;
    res.render('person/index', {user: userName});
});


//用户信息iframe
router.get('/index2',(req, res)=>{
    var account = req.session.userName;
    User.findOne({where: {account: account}, include: [Focus]}).then(function(result){
        var userInfo = {};
        //user表
//      userInfo.imageName = result.account;
        userInfo.account = account;
        userInfo.touxiang = result.touxiang;
        userInfo.email = result.email;
        userInfo.signature = result.signature;
        var bonus = result.commonBonus;
        userInfo.totalBonus = bonus;
        if(bonus <= 100){
            userInfo.userLevel = 'LV1';
        }else if(bonus >= 101 && bonus <= 500){
            userInfo.userLevel = 'LV2';
        }else if(bonus >= 501 && bonus <= 2000){
            userInfo.userLevel = 'LV3';
        }else if(bonus >= 2001 && bonus <= 5000){
            userInfo.userLevel = 'LV4';
        }else if(bonus >= 5001 && bonus <= 10000){
            userInfo.userLevel = 'LV5';
        }else if(bonus >= 10001 && bonus <= 50000){
            userInfo.userLevel = 'LV6';
        }else if(bonus >= 50001 && bonus <= 100000){
            userInfo.userLevel = 'LV7';
        }else if(bonus >= 100001 && bonus <= 300000){
            userInfo.userLevel = 'LV8';
        }else if(bonus >= 300001 && bonus <= 800000){
            userInfo.userLevel = 'LV9';
        }else {
            userInfo.userLevel = 'LV10';
        }
        //连接focus表查找粉丝数
        userInfo.totalFans = result.focus.length;
        //单独查找focus表获取关注数
        Focus.count({where: {fansId: result.id}}).then(function(result2){
            userInfo.totalFocus = result2;
            res.render('person/index2', {userInfo: userInfo});
        }).catch(function(err2){
            console.log('err2出错，出错信息为: ' + err2.message);
        });
    }).catch(function(err){
        console.log('错误信息为: ' + err.message);
    });
});


//个人信息可编辑页面
router.get('/user_editor', (req, res)=>{
    var uid = req.session.userId;
    User.findOne({where: {id: uid}}).then(function(result){
        var account = result.account;
        var email = result.email;
        var signature = result.signature;
        res.render('person/user_editor', {email: email, signature: signature});
    }).catch(function(err){
        console.log('错误信息为: ' + err.message);
    });
});

//用户编辑个人信息
router.post('/user_editor', (req, res)=>{
    console.log(req.session.userName)
    var uid = req.session.userId;
    var email = req.body.email;
    var signature = req.body.signature;
    User.update({email: email, signature: signature}, {where: {id: uid}}).then(function(result){
        res.redirect('/Personal/index2');
    }).catch(function(err){
        console.log('错误信息为: ' + err.message);
    });
});


//用户上传头像
router.post('/touxiang_upload', upload3.single('file'), (req, res)=>{
    var uid = req.session.userId;
    var touxiang = req.file.filename;
    console.log('头像文件为：' + touxiang);
    User.update({touxiang: touxiang}, {where: {id: uid}}).then(function(){
        res.json({status: 200});
    }).catch(function(err){
        console.log('错误信息为: ' + err.message);
    });
});


//作品上传iframe
router.get('/works_upload', (req, res)=>{
    res.render('person/works_upload');
});


//文件上传
router.post('/works_upload', upload1.single('user-works'), (req, res)=>{
    var userId = req.session.userId;
    var originName = req.file.originalname;
    var fileName = originName.substring(0, originName.lastIndexOf('.'));
    var link = '/uploads/origin-file/' + req.file.filename;
    var fileType = req.file.mimetype;
    var fileSize = req.file.size;
    var isOrigin = Number(req.body.isOrigin);
    var uploadDate = Date.now();
    var parentKind = req.body.parentKind * 1;
    var kind = req.body.kind;
    var pKind = null;
    switch(parentKind){
        case 1:
            pKind = '设计';
            break;
        case 2:
            pKind = '摄影';
            break;
        case 3:
            pKind = '多媒体';
            break;
        default:
            break;
    }
    // 存储用户上传的文件信息
    Image.create({
        userId: userId,
        pKind: pKind,
        fileName: fileName,
        link: link,
        fileType: fileType,
        fileSize: fileSize,
        isOrigin: isOrigin,
        uploadDate: uploadDate,
        isPass: 0,
        kind: kind,
        parentKind: pKind
    }).then(function(result){
        res.json({imgId: result.id});
    }).catch(function(err){
        console.log('result错误信息为: ' + err.message);
    });
});


//图片上传
router.post('/preview_upload', upload2.single('works-preview'), (req, res)=>{
    var imgId = req.body.imgId;
    var imgName = req.file.filename;
    //存储用户上传的预览图
    Image.update({imgName: imgName}, {where: {id: imgId}}).then(function(){
        res.json({status: 200});
    }).catch(function(err){
        console.log('错误信息为: ' + err.message);
    });
});


//用户作品管理
router.get('/works_manage', (req, res)=>{
    var uid = req.session.userId;
    Image.findAll({where: {userId: uid}}).then(function(result){
        var pass = [];
        var waitPass = [];
        var dispass = [];
        if(result){
            result.forEach(function(item){
                item.imgLink = '/uploads/' + item.imgName;
                item.fileSize = (Number(item.fileSize)/1000).toFixed(2);
                switch(item.isPass){
                    case 0:
                        waitPass.push(item);
                        break;
                    case 1:
                        pass.push(item);
                        break;
                    case -1:
                        dispass.push(item);
                        break;
                    default:
                        break;
                }
            });
        }
        var data = {
            totalWait: waitPass.length,
            totalDispass: dispass.length,
            total: result.length,
            totalImg: result,
            waitImg: waitPass,
            dispassImg: dispass
        }
        res.render('person/works_manage', {data: data});
    }).catch(function(err){
        console.log('错误信息为: ' + err.message);
    });
});


//用户删除图片操作
router.get('/delete/:imgId?', (req, res)=>{
    //删除一个素材
    if(req.params.imgId){
        var imgId = req.params.imgId;
        Image.destroy({where: {id: imgId}}).then(function(){
            res.redirect('/Personal/works_manage');
        });
    }else if(req.query.index){          //批量删除
        var index = req.query.index;
        var arr = index.split(',');
        // 将数组中的字符串转化成Number类型
        var newArr = arr.map(function(item){
            return Number(item);
        });
        var uid = req.session.userId;
        Image.destroy({where: {userId: uid, id: newArr}}).then(function(result){
            res.redirect('/Personal/works_manage');
        });
    }
});


//专辑管理，作品展示功能
router.get('/my_works/:page?', (req, res)=>{
    var uid = req.session.userId;
    var currentPage = (req.params.page * 1) || 0;
    var countStart = currentPage * 7;
    if(req.query.parentKind){
        var classify = req.query.parentKind;
        //对特定分类做分页查询
        Image.findAndCountAll({where: {userId: uid, isPass: 1, parentKind: classify}, limit: 7, offset: countStart}).then(function(result){
            var imgData = result.rows;
            res.render('person/my_works', {data: imgData, currentPage: currentPage, totalPage: Math.floor(result.count/7), kind: classify});
        }).catch(function(err){
            console.log('错误信息为: ' + err.message);
        });
    }else {
        //分页查询
        Image.findAndCountAll({where: {userId: uid, isPass: 1}, limit: 7, offset: countStart}).then(function(result){
            var imgData = result.rows;
            res.render('person/my_works', {data: imgData, currentPage: currentPage, totalPage: Math.floor(result.count/7)});
        }).catch(function(err){
            console.log('错误信息为: ' + err.message);
        });
    }
});


//用户作品收藏
router.get('/works_collection/:page?', (req, res)=>{
    var fansId = req.session.userId;
    var currentPage = (req.params.page * 1) || 0;
    var countStart = currentPage * 10;
    Focus.findAndCountAll({where: {fansId: fansId}, limit: 10, offset: countStart, include: [Image]}).then(function(result){
        res.render('person/works_collection', {imageData: result.rows, currentPage: currentPage, totalPages: Math.floor(result.count/10)});
    }).catch(function(err){
        console.log('错误信息为: ' + err.message);
    });
});


//用户积分
router.get('/bonus', (req, res)=>{
    var uid = req.session.userId;
    User.findOne({where: {id: uid}}).then(function(result){
        var commonBonus = result.commonBonus;
        var originBonus = result.originBonus;
        res.render('person/bonus', {commonBonus: commonBonus, originBonus: originBonus});
    }).catch(function(err){
        console.log('错误信息为：' + err.message);
    });
});


//用户等级
router.get('/user_level', (req, res)=>{
    var uid = req.session.userId;
    User.findOne({where: {id: uid}}).then(function(result){
        //普通等级
        var commonBonus = result.commonBonus;
        var commonLevel = '';
        var commonName = '';
        if(commonBonus <= 100){
            commonLevel = 'LV1';
            commonName = '图网列兵'
        }else if(commonBonus >= 101 && commonBonus <= 500){
            commonLevel = 'LV2';
            commonName = '图网下士';
        }else if(commonBonus >= 501 && commonBonus <= 2000){
            commonLevel = 'LV3';
            commonName = '图网中士';
        }else if(commonBonus >= 2001 && commonBonus <= 5000){
            commonLevel = 'LV4';
            commonName = '图网上士';
        }else if(commonBonus >= 5001 && commonBonus <= 10000){
            commonLevel = 'LV5';
            commonName = '图网少尉';
        }else if(commonBonus >= 10001 && commonBonus <= 50000){
            commonLevel = 'LV6';
            commonName = '图网中尉';
        }else if(commonBonus >= 50001 && commonBonus <= 100000){
            commonLevel = 'LV7';
            commonName = '图网上尉';
        }else if(commonBonus >= 100001 && commonBonus <= 300000){
            commonLevel = 'LV8';
            commonName = '图网少校';
        }else if(commonBonus >= 300001 && commonBonus <= 800000){
            commonLevel = 'LV9';
            commonName = '图网中校';
        }else {
            commonLevel = 'LV10';
            commonName = '图网元帅';
        }
        //原创等级
        var originBonus = result.originBonus;
        var originLevel = '';
        var originName = '';
        if(originBonus <= 100){
            originLevel = 'LV1';
            originName = '图网列兵'
        }else if(originBonus >= 101 && originBonus <= 500){
            originLevel = 'LV2';
            originName = '图网下士';
        }else if(originBonus >= 501 && originBonus <= 2000){
            originLevel = 'LV3';
            originName = '图网中士';
        }else if(originBonus >= 2001 && originBonus <= 5000){
            originLevel = 'LV4';
            originName = '图网上士';
        }else if(originBonus >= 5001 && originBonus <= 10000){
            originLevel = 'LV5';
            originName = '图网少尉';
        }else if(originBonus >= 10001 && originBonus <= 50000){
            originLevel = 'LV6';
            originName = '图网中尉';
        }else if(originBonus >= 50001 && originBonus <= 100000){
            originLevel = 'LV7';
            originName = '图网上尉';
        }else if(originBonus >= 100001 && originBonus <= 300000){
            originLevel = 'LV8';
            originName = '图网少校';
        }else if(originBonus >= 300001 && originBonus <= 800000){
            originLevel = 'LV9';
            originName = '图网中校';
        }else {
            originLevel = 'LV10';
            originName = '图网元帅';
        }
        res.render('person/user_level', {commonLevel: commonLevel, commonName: commonName, originLevel: originLevel, originName: originName});
    }).catch(function(err){
        console.log('错误信息为：' + err.message);
    });
});




//导出子模块
module.exports = router;