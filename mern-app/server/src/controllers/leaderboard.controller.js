const User = require('../models/User.model');
const Project = require('../models/Project.model');
const CodexEntry = require('../models/CodexEntry.model');
const Community = require('../models/Community.model');
const Discussion = require('../models/Discussion.model');
const Hackathon = require('../models/Hackathon.model');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get leaderboard rankings
// @route   GET /api/v1/leaderboard
// @access  Public
const getLeaderboard = asyncHandler(async (req, res) => {
  const users = await User.find({})
    .select('displayName username avatar title bio skills score createdAt')
    .sort({ score: -1, createdAt: 1 })
    .limit(50)
    .lean();

  const rankedUsers = users.map((user, index) => ({
    rank: index + 1,
    ...user,
  }));

  res.json({
    success: true,
    data: rankedUsers,
    message: 'Leaderboard retrieved successfully',
  });
});

// @desc    Recalculate leaderboard scores for all users
// @route   POST /api/v1/leaderboard/recalculate
// @access  Private / Admin
const recalculateScores = asyncHandler(async (req, res) => {
  // Formula: projects*10 + codexEntries*5 + communitiesOwned*8 + discussionPosts*3 + hackathonRegistrations*7
  const users = await User.find({}).select('_id score');

  let updatedUsersCount = 0;

  for (const user of users) {
    const [
      projects,
      codexEntries,
      communitiesOwned,
      discussionPosts,
      hackathonRegistrations,
    ] = await Promise.all([
      Project.countDocuments({ owner: user._id }),
      CodexEntry.countDocuments({ author: user._id }),
      Community.countDocuments({ owner: user._id }),
      Discussion.countDocuments({ author: user._id }),
      Hackathon.countDocuments({ participants: user._id }),
    ]);

    const calculatedScore =
      projects * 10 +
      codexEntries * 5 +
      communitiesOwned * 8 +
      discussionPosts * 3 +
      hackathonRegistrations * 7;

    await User.findByIdAndUpdate(user._id, { score: calculatedScore });
    updatedUsersCount++;
  }

  res.json({
    success: true,
    data: {
      updatedUsersCount,
    },
    message: `Recalculated scores for ${updatedUsersCount} users successfully`,
  });
});

module.exports = {
  getLeaderboard,
  recalculateScores,
};
