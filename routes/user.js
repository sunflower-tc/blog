var express = require('express');
var util = require('../util');
var auth = require('../middle');
var router = express.Router();

/* GET users listing. */

router.get('/reg',auth.checkNotLogin, function(req, res, next) {
  res.render('user/reg',{title:'注册'});
});
router.get('/login',auth.checkNotLogin, function(req, res, next) {
  res.render('user/login',{title:'登录'});
});
//注册
router.post('/reg',auth.checkNotLogin, function(req, res, next) {
    var user=req.body;
  if(user.password!=user.repassword){
      req.flash('error','密码和重复密码不一致');
      return  res.redirect('back');
  }
  //1.对用户密码加密
  //2.得到头像
  user.password=util.md5(user.password);
  user.avatar='http://secure.gravatar.com/avatar/'+util.md5(user.email)+'?s=20';//s=32像素

  //向数据库保存用户
  Model('User').create(user,function(err,doc){
         if(err){
             req.flash('error','注册失败');
           return   res.redirect('back');
         }else{
           //
            req.flash('success','注册成功');
           req.session.user=doc;
           return  res.redirect('/');
         }
  })
});


router.post('/login',auth.checkNotLogin ,function(req, res, next) {
    var user=req.body;
  user.password=util.md5(user.password);
 Model('User').findOne(user,function(err,doc){
    if(err){
        req.flash('error','登录失败');
      return   res.redirect('back');
    }else{
      if(doc){
        req.session.user=doc;
          req.flash('success','登录成功');
        return   res.redirect('/');
      }else{
        return   res.redirect('/user/reg');
      }
    }
  })
});
router.get('/logout',auth.checkLogin, function(req, res, next) {
     req.session.user=null;
    req.flash('success','退出成功');
    return res.redirect('/user/login');
});
module.exports = router;
