const db = require('../../models')
const Tweet = db.Tweet
const User = db.User
const Like = db.Like
const Reply = db.Reply
const Followship = db.Followship

const maxDescLen = 50

const adminController = {
  getTweets: async (req, res) => {
    const tweets = await Tweet.findAll({
      raw: true,
      nest: true,
      include: [User],
      order: [
        ['createdAt', 'DESC'], // Sorts by createdAt in descending order
      ],
    })

    tweets.map(tweet => {
      tweet.description = tweet.description.length <= maxDescLen ? tweet.description : tweet.description.substring(0, maxDescLen) + "..."
    })

    return res.json({ tweets })
  },

  // 列出所有使用者
  getUsers: (req, res) => {
    Promise.all([
      User.findAll({
        include: [
          Tweet,
          { model: User, as: 'Followings' },
          { model: User, as: 'Followers' }
        ],
        where: { role: "user" }
      }),
      Tweet.findAll({
        raw: true,
        nest: true,
        include: [Like]
      })
    ]).then(([users, tweets]) => {

      let usersData =
        users.map(user => ({
          ...user.dataValues,
          followersCount: user.Followers.length,
          followingsCount: user.Followings.length,
          tweetCount: user.Tweets.length,
          likeCount: tweets.filter(tweet => tweet.UserId === user.dataValues.id).reduce((accumulator, currentValue) => {
            const addCount = currentValue.Likes.UserId ? 1 : 0
            return accumulator + addCount
          }, 0)
        }))
      usersData = usersData.sort((a, b) => b.tweetCount - a.tweetCount)
      res.render('admin/users', { users: usersData })
    })
  }
}

module.exports = adminController