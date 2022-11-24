const Post = require("../models/Post");
const cloudinary = require("../middleware/cloudinary");
const Comment = require("../models/Comment");
// const User = require('../models/Profile')

module.exports = {
  getCreatePostPage: async (req, res) => {
    try {
      const posts = await Post.find({ user: req.user.id });
      res.render("createPost.ejs", { posts: posts, user: req.user });
    } catch (error) {
      console.log(err);
    }
  },
  getProfile: async (req, res) => {
    try {
      const posts = await Post.find({ user: req.user.id });
      res.render("profile.ejs", { posts: posts, user: req.user });
    } catch (err) {
      console.log(err);
    }
  },
  getFeed: async (req, res) => {
    try {
      const posts = await Post.find().sort({ createdAt: "desc" }).lean(); //Post is the model (required above), .lean() ()is mongoose) is for getting the raw object from mongo (documents on mongo, while similar to "objects" actually include more than you need) this will be faster
      console.log(posts);
      res.render("feed.ejs", { posts: posts });
  
    } catch (err) {
      console.log(err);
    }
  },
  createPost: async (req, res) => {
    try {
      let result;
      if (req.file !== undefined) {
         result = await cloudinary.uploader.upload(req.file.path)
      } else {
        result = ''
      }
      // Upload image to cloudinary
      // const result = await cloudinary.uploader.upload(req.file.path);
       //upload is from the cloudinary package

      await Post.create({
        image: result.secure_url, //result declared above
        cloudinaryId: result.public_id,
        caption: req.body.caption,
        likes: 0,
        user: req.user.id,
        userName: req.user.userName,
       
      });
      console.log("Post has been added!");
      res.redirect("/getCreatePostPage");
    } catch (err) {
      console.log(err);
    }
  },
  getPost: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id); //.id is the variable from the route
      console.log('get post=', req)
      const comments = await Comment.find({post: req.params.id}).sort({ createdAt: "asc" }).lean();
      res.render("post.ejs", { post: post, user: req.user, comments: comments });
      // res.render("post.ejs", { post: post, user: req.user});

    } catch (err) {
      console.log(err);
    }
  },
  likePost: async (req, res) => {
    try {
      await Post.findOneAndUpdate( //Post is the name of the model (first parameter) in post model file
        { _id: req.params.id },
        {
          $inc: { likes: 1 }, //$inc is a increment thing included with mongo/mongoose. This is a number because it is defined in the schema as such
      // create an interface that adds the username of the person that like the post to an array. so that they cant like the post twice.
        }
      );

      // await Post.findOneAndUpdate({ _id: req.params.id }, { $inc: { likes: 1 }, })
      console.log("Likes +1");
      res.redirect(`/post/${req.params.id}`);
    } catch (err) {
      console.log(err);
    }
  },
  deletePost: async (req, res) => {
    try {
      // Find post by id
      let post = await Post.findById({ _id: req.params.id }); //Post is the model. find the post using the id from the url (this makes sure the post exists before you 'destroy' it)
      // Delete image from cloudinary
      if (post.cloudinaryId != null) {
        await cloudinary.uploader.destroy(post.cloudinaryId);
      }
      // await cloudinary.uploader.destroy(post.cloudinaryId); 
      //post declared above. This line is to get rid of the picture on cloudinary
      // Delete post from db
      await Post.remove({ _id: req.params.id }); //Post is the model, here we remove the post from the collection
      console.log("Deleted Post");
      res.redirect("/profile");
    } catch (err) {
      res.redirect("/profile");
    }
  },
}