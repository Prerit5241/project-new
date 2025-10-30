const User = require('../models/User');
const { NotFoundError, BadRequestError } = require('../utils/errors');

/**
 * Add or subtract coins from a user's balance
 * @param {string} userId - The ID of the user
 * @param {number} amount - The amount of coins to add (positive) or subtract (negative)
 * @returns {Promise<Object>} The updated user object
 */
const updateUserCoins = async (userId, amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new BadRequestError('Invalid coin amount');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Calculate new balance
  const newBalance = user.coins + amount;
  if (newBalance < 0) {
    throw new BadRequestError('Insufficient coins');
  }

  // Update user's coin balance
  user.coins = newBalance;
  await user.save();

  return user;
};

/**
 * Get user's coin balance
 * @param {string} userId - The ID of the user
 * @returns {Promise<number>} The user's coin balance
 */
const getUserCoinBalance = async (userId) => {
  const user = await User.findById(userId).select('coins');
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user.coins;
};

/**
 * Transfer coins between users
 * @param {string} fromUserId - The ID of the user sending coins
 * @param {string} toUserId - The ID of the user receiving coins
 * @param {number} amount - The amount of coins to transfer
 * @returns {Promise<Object>} Result of the transfer
 */
const transferCoins = async (fromUserId, toUserId, amount) => {
  if (amount <= 0) {
    throw new BadRequestError('Amount must be positive');
  }

  const session = await User.startSession();
  session.startTransaction();

  try {
    const [fromUser, toUser] = await Promise.all([
      User.findById(fromUserId).session(session),
      User.findById(toUserId).session(session)
    ]);

    if (!fromUser || !toUser) {
      throw new NotFoundError('One or both users not found');
    }

    if (fromUser.coins < amount) {
      throw new BadRequestError('Insufficient coins for transfer');
    }

    // Perform the transfer
    fromUser.coins -= amount;
    toUser.coins += amount;

    await Promise.all([
      fromUser.save({ session }),
      toUser.save({ session })
    ]);

    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      fromUserId: fromUser._id,
      toUserId: toUser._id,
      amount,
      newBalance: fromUser.coins
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

module.exports = {
  updateUserCoins,
  getUserCoinBalance,
  transferCoins
};
