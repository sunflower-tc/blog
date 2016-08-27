var mongoose=require('mongoose');
var settings=require('../settings');
mongoose.connect(settings.url);
var ObjectId=mongoose.Schema.Types.ObjectId;
//用户model
mongoose.model('User',new mongoose.Schema({
       username:{type:String,isRequired:true},
       password:{type:String,isRequired:true},
       email:{type:String,isRequired:true},
      avatar:{type:String}
}));　

//文章model
mongoose.model('Article',new mongoose.Schema({
    title:{type:String,isRequired:true},
    content:{type:String,isRequired:true},
    createAt:{type:Date,default:Date.now()},
    pv:{type:Number,default:0},//浏览量
    user:{type:ObjectId,ref:'User'},
    //评论
    comments:[{
        user:{type:ObjectId,ref:'User'},
        content:{type:String},
        createAt:{type:Date,default:Date.now()},
    }]
}));
global.Model=function(modelName){
      return mongoose.model(modelName);
}








