const User = require('../models/user.model');
const Post = require('../models/posts.model');
const Picture = require('../models/picture.model');
const moment = require('moment');

module.exports.show = (req, res) => {
  const {_id} = res.locals.user;

// Find user
  User.findById(_id)
  .then((user) => {
      Post.find({owner_id: user._id})
      .then((posts) => {
        Picture.find({owner_id: user._id})
        .then((pictures) => {
          res.render('user/user', {
            user,
            pictures,
            posts
          });
        });
      });
  })
  .catch(err => {
    console.log(err);
  });
};

module.exports.edit = (req, res, next) => {
  res.render('user/edit');
};

module.exports.addPost = (req, res, next) => {
  res.send('sending post');
};

// edit from process
module.exports.saveChanges = (req, res, next) => {
  const {_id} = res.locals.user;
// Find user
  User.findById(_id)
  .then(user => {
    //new value
    user.petname = req.body.petname,
    user.ownername = req.body.ownername,
    user.bio = req.body.bio,
    user.city = req.body.location,
    user.location.lat = req.body.lat,
    user.location.lng = req.body.lng,
    user.animaltype = req.body.animaltype,
    user.breed = req.body.breed,
    user.birthdate = moment(req.body.birthdate).format('LL'),
    user.skills = req.body.skills,
    user.character = req.body.character,
    user.sex = req.body.sex;

    //save edited idea
    user.save()
    .then(user => {
      req.flash('success_msg', 'Profile changes saved');
      res.redirect('/user');
    });
  });
};



module.exports.savePic = (req, res) => {
  const {_id} = res.locals.user;

  const pic = new Picture({
    owner_id: req.session.passport.user,
    pic_path: `../../uploads/${req.file.filename}`,
    pic_name: req.file.originalname
  });

  pic.save()
  .then((picture) => {
    User.findById(_id)
    .then((user) => {
      user.pictures = picture.pic_path;

      user.save()
      .then(user => {
        res.redirect('/user');
      });
    });
  })
  .catch((err) => {
    console.log(err);
  });
};

module.exports.follow = (req, res, next) => {
  // Id of the user we want to follow
  const {id} = req.params;
  const sessionId = req.session.passport.user;

// Find the user in the session = currentUser
  User.findById(sessionId)
  .then((currentUser) => {
    // Find the user we want to follow = user
    User.findById(id)
    .then((user) => {
      const newFollower = {
          user_id: currentUser.id,
          petname: currentUser.petname,
          pic: currentUser.pictures,
          location: currentUser.location
      };

      const newFollowing = {
          user_id: user.id,
          petname: user.petname,
          pic: user.pictures,
          location: user.location
      };
      // If the followersarray is empty do this
      if (user.followers.length === 0) {
        user.followers.push(newFollower);
        currentUser.following.push(newFollowing);
        user.followersNumber += 1;
        currentUser.followingNumber += 1;
        currentUser.save();
        user.save();
        res.redirect(`/profile/${user.id}`);
      }
      else
      {
        // If the followersarray is not empty see if user is in there
        user.followers.forEach((follower) => {
          if (currentUser.id == follower.user_id) {
            for (var i = user.followers.length-1; i>=0; i--) {
                if (user.followers[i].user_id == currentUser.id) {
                    user.followersNumber -= 1;
                    user.followers.splice(i, 1);
                };
            };

            for (var i = currentUser.following.length-1; i>=0; i--) {
                if (currentUser.following[i].user_id == user.id) {
                    currentUser.followingNumber -= 1;
                    currentUser.following.splice(i, 1);
                };
            };

            currentUser.save();
            user.save();
            res.redirect(`/profile/${user.id}`);
          } else {
            user.followers.push(newFollower);
            currentUser.following.push(newFollowing);
            user.followersNumber += 1;
            currentUser.followingNumber += 1;
            currentUser.save();
            user.save();
            res.redirect(`/profile/${user.id}`);
            }
          });
        }
    });
  })
  .catch((err) => console.log(err));
};
