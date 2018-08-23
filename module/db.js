//引入mysql的orm，采用的orm是sequelize
var Sequelize = require('sequelize');

//配置数据库信息，前三个参数分别为数据库名，数据库管理员的账号和密码
var sequelize = new Sequelize('img_share', 'root', '123456', {
    host: 'localhost',
    dialect: 'mysql'
});

//定义数据模型
//用户表
var User = sequelize.define('user', {
    id: {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true},
    account: Sequelize.STRING,
    password: Sequelize.STRING,
    touxiang: Sequelize.STRING,
    email: Sequelize.STRING,
    commonBonus: Sequelize.INTEGER,
    originBonus: Sequelize.INTEGER,
    signature: Sequelize.STRING
}, {timestamps: false, tableName: 'user'});


//图片素材表
var Image = sequelize.define('image', {
    id: {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true},
    userId: {type: Sequelize.INTEGER, references:{model: User, key: 'id'}},
    imgName: Sequelize.STRING,
    isOrigin: Sequelize.INTEGER,
    bonusRequire: Sequelize.INTEGER,
    uploadDate: Sequelize.DATE,
    isPass: Sequelize.INTEGER,
    kind: Sequelize.STRING,
    parentKind: Sequelize.STRING,
    fileName: Sequelize.STRING,
    link: Sequelize.STRING,
    fileType: Sequelize.STRING,
    fileSize: Sequelize.STRING,
    passDate: Sequelize.DATE,
    reason: Sequelize.STRING
}, {timestamps: false, tableName: 'image'});

//关注表
var Focus = sequelize.define('focus', {
    id: {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true},
    userId: {type: Sequelize.INTEGER, references:{model: User, key: 'id'}},
    fansId: Sequelize.INTEGER,
    imageId: Sequelize.STRING
}, {timestamps: false});


//热搜表
var HotSearch = sequelize.define('hot_search', {
    keywords: {type: Sequelize.STRING, primaryKey: true},
    count: Sequelize.INTEGER,
    createDate: Sequelize.DATE,
    update: Sequelize.DATE
}, {timestamps: false, tableName: 'hot_search'});

//做表连接
User.hasMany(Focus);
User.hasMany(Image);
Image.hasOne(Focus);
Focus.belongsTo(User);
Image.belongsTo(User);
Focus.belongsTo(Image);


//模块导出
module.exports = {
    user: User, 
    image: Image,
    focus: Focus,
    hotSearch: HotSearch
};