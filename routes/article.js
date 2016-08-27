var express = require('express');
var router = express.Router();
var auth = require('../middle');
var async = require('async');
var markdown = require('markdown').markdown;
/* GET users listing. */
//显示文章列表
/*pageNum页数 pageSize 每条页数*/
router.get('/list', function (req, res) {

    /*搜索功能*/
    var keyword = req.query.keyword;
    var orderBy = req.query.orderBy||'createAt';
    var order = req.query.order?parseInt(req.query.order):-1;
    var pageNum = req.query.pageNum ? parseInt(req.query.pageNum) : 1;
    var pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 5;


    var query = {};
    if (keyword) {
        var reg = new RegExp(keyword, 'i');
        query['$or'] = [{title: reg}, {content: reg}]

    }
    var orderObj={};
    if(orderBy){
        orderObj[orderBy]=order;
    }
    /*skip值得是跳过几条 limit限制最大取多少*/
    Model('Article').find(query).count(function (err, count) {
        Model('Article').find(query).sort(orderObj).skip(pageSize * (pageNum - 1)).limit(pageSize).populate('user').exec(function (err, docs) {
            docs.forEach(function (docs) {
                docs.content = markdown.toHTML(docs.content);
            });
            res.render('article/list', {
                title: '文章列表',
                articles: docs,
                keyword: keyword,
                pageNum: pageNum,
                pageSize: pageSize,
                orderBy:orderBy,
                order:order,
                totalPage: Math.ceil(count / pageSize)

            });

        });
    });

});
//请求add页面
router.get('/add', auth.checkLogin, function (req, res) {
    res.render('article/add', {title: '发表文章', article: {}});
});
//发表文章
router.post('/add', auth.checkLogin, function (req, res) {
    var article = req.body;
    var _id = article._id;
    console.log(article);
    console.log(_id);

    if (_id) {
        Model('Article').update(
            {_id: _id},
            {$set: {title: article.title, content: article.content}}, function (err, result) {
                if (err) {
                    req.flash('error', '发表文章失败');
                    return res.redirect('back');
                } else {
                    req.flash('success', '发表文章成功');
                    return res.redirect('/');//如果前台是通过ajax请求词
                }
            })
    } else {
        article.user = req.session.user._id;//获取session中注册成功当前用户的id
        //因为_id优质，为空 但是数据库里面Id不能为空所以报错 我们删掉_id,让数据库生成新的ID

        delete article._id;
        article.createAt=Date.now();
        Model('Article').create(article, function (err, doc) {
            if (err) {
                req.flash('error', '发表文章失败');
                return res.redirect('back');
            } else {
                req.flash('success', '发表文章成功');
                return res.redirect('/');
            }
        })
    }


});
//并行节约时间
router.get('/detail/:_id', function (req, res) {
  async.parallel({
      pv:function(cb){
          Model('Article').update({_id:req.params._id},  {$inc:{pv:1}},function(err,result){
              cb(err,result);
        })
      },
     doc:function(cb){
         Model('Article').findById(req.params._id).populate('comments.user').exec(
             function(err,doc){
                 cb(err,doc)
             })
     }
      },
      function(err,result){
          res.render('article/detail',{title:'文章详情',article:result.doc});
      })



 /*   Model('Article').findById(req.params._id).populate('comments.user').exec(
        function (err, doc) {
            doc.pv=doc.pv+1;
            doc.save(function(err,newDoc){
                res.render('article/detail', {title: '文章详情', article: doc});
            })
        })*/
});
router.get('/delete/:_id', function (req, res) {
    Model('Article').findById(req.params._id, function (err, doc) {
        if (doc) {
            if (req.session.user._id == doc.user) {
                Model('Article').remove({_id: req.params._id}, function (err, result) {
                    res.redirect('/')
                });
            } else {
                req.flash('error', '不是你发表的不能删除');
                res.redirect('back')
            }
        } else {
            res.redirect('back')
        }
    })
});


router.get('/edit/:_id', function (req, res) {
    var _id = req.params._id;

    Model('Article').findById(_id, function (err, doc) {
        res.render('article/add.html', {title: '修改文章', article: doc})
    })

});
router.post('/comment',function(req,res){
      var comment=req.body;
    comment.user=req.session.user._id;
    Model('Article').findById(comment.articleId,function(err,doc){
         doc.comments.push(comment);
        doc.save(function(err,newDoc){
            if (err) {
                req.flash('error', '评论文章失败');
                return res.redirect('back');
            } else {
                req.flash('success', '评论文章成功');
                return res.redirect('back');
            }
        })
    })
})
module.exports = router;
