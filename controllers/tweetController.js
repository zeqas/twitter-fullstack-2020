const db = require('../models')
const user = require('../models/user')
const Tweet = db.Tweet
const Reply = db.Reply
const User = db.User
const Followship = db.Followship

const helpers = require('../_helpers')

const tweetController = {
  // 首頁
  getTweets: (req, res) => {
    return Promise.all([
      Tweet.findAll({
        include: [User, Reply],
        order: [
          ['createdAt', 'DESC'], // Sorts by createdAt in descending order
        ]
      }),
      User.findAll({
        include: [
          Tweet,
          { model: User, as: 'Followings' },
          { model: User, as: 'Followers' }
        ],
        where: { role: "user" }
      }),
    ]).then(([users, tweets]) => {
      // 列出 追隨數前十名的使用者
      
      // console.log(users.map(user => ({
      //   ...user.dataValues,
        
      // })))
      const topUsers =
        users.map(user => ({
          ...user.dataValues,
          followerCount: user.dataValues.User.dataValues.followerCount,
          isFollowed: req.user.Followings.map(d => d.id).includes(user.id) //登入使用者是否已追蹤該名user
        }))
          .sort((a, b) => b.followerCount - a.followerCount)
          .slice(0, 10)
      console.log(topUsers) // 印出來的會是 tweets而不是 users
      // console.log(tweets.map(tweet => ({
      //   ...tweet.dataValues,
        
      // })))
      const data = tweets.map(tweet => ({
        ...tweet.dataValues,
        // likeCount: tweets.filter(tweet => tweet.UserId === user.dataValues.id).reduce((accumulator, currentValue) => {
        //   const addCount = currentValue.Likes.UserId ? 1 : 0
        //   return accumulator + addCount
        // }),
        description: tweet.dataValues.description,
        createdAt: tweet.dataValues.createdAt,
        userName: tweet.dataValues.name,
        userAccount: tweet.dataValues.account,
      }))

      return res.render('tweets', {
        tweets: data,
        users: topUsers,
        theUser: helpers.getUser(req).id
      })
    })
  },

  postTweet: async (req, res) => {
    let { description } = req.body
    if (!description.trim()) {
      req.flash('error_messages', '推文不能空白！')
      return res.redirect('back')
    }
    if (description.length > 140) {
      req.flash('error_messages', '推文不能為超過140字！')
      return res.redirect('back')
    }
    await Tweet.create({
      description: req.body.description,
      UserId: helpers.getUser(req).id
    })
    res.redirect('/tweets')
  },
  getTweet: async (req, res) => {
    // return Tweet.findByPk(req.params.id, {
    //   include: [
    //     ,
    //     // { model: User, as: 'Followers' },
    //     // { model: User, as: 'LikedUsers' },
    //     // { model: Reply, include: [User] }
    //   ]
    // })
    //   // .then(tweet => tweet.increment('viewCounts'))
    //   .then(tweet => {
    //     // const isFollowed = tweet.Followers.map(d => d.id).includes(req.user.id)
    //     // const isLiked = tweet.LikedUsers.map(d => d.id).includes(req.user.id)
    //     return res.render('tweet', {
    //       tweet: tweet.toJSON(),
    //       // isFollowed,
    //       // isLiked
    //     })
    //   })
    // console.log(req.params.id)
    try {
      const tweet = await Tweet.findByPk(
        req.params.id, {
        include: [
          User,
          { model: Reply, include: [User] }
        ],
        order: [['Replies', 'createdAt', 'DESC']]
      })
      console.log('tweet:', tweet)
      return res.render('tweet', { tweet: tweet.toJSON() })
    } catch (e) {
      console.log(e.message)
    }
  },
}

module.exports = tweetController
