const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g., 'users', 'products', 'courses'
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

/**
 * Get next numeric ID for a given collection name with predefined ranges.
 * Users: 100+ range
 * Products: 1000+ range
 * Courses: 2000+ range  
 * Categories: 50+ range
 * Orders: 10000+ range
 */
async function getNextId(modelName) {
  // ✅ Define starting ranges for different models
  const modelRanges = {
    'userId': 100,        // Users start at 101, 102, 103...
    'productId': 1000,    // Products start at 1001, 1002, 1003...
    'courseId': 2000,     // Courses start at 2001, 2002, 2003...
    'categoryId': 50,     // Categories start at 51, 52, 53...
    'orderId': 10000      // Orders start at 10001, 10002, 10003...
  };

  // ✅ Get the starting range for this model (default to 0 if not defined)
  const startingRange = modelRanges[modelName] || 0;

  const counter = await Counter.findByIdAndUpdate(
    modelName,               // _id in counters collection
    { $inc: { seq: 1 } },    // increment sequence
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  // ✅ If this is a new counter and it's below the starting range, set it to starting range
  if (counter.seq <= startingRange) {
    const updatedCounter = await Counter.findByIdAndUpdate(
      modelName,
      { $set: { seq: startingRange + 1 } }, // Set to starting range + 1
      { new: true }
    );
    return updatedCounter.seq;
  }

  return counter.seq;
}

/**
 * ✅ Initialize counter ranges (run this once to set up ranges)
 */
async function initializeCounterRanges() {
  const ranges = {
    'userId': 100,
    'productId': 1000,    
    'courseId': 2000,     
    'categoryId': 50,     
    'orderId': 10000      
  };

  for (const [modelName, startRange] of Object.entries(ranges)) {
    try {
      // Check if counter exists
      const existingCounter = await Counter.findById(modelName);
      
      if (!existingCounter) {
        // Create new counter at starting range
        await Counter.create({
          _id: modelName,
          seq: startRange
        });
        console.log(`✅ Initialized ${modelName} counter at ${startRange}`);
      } else if (existingCounter.seq < startRange) {
        // Update existing counter to starting range if it's below
        await Counter.findByIdAndUpdate(
          modelName,
          { $set: { seq: startRange } }
        );
        console.log(`✅ Updated ${modelName} counter to ${startRange}`);
      }
    } catch (error) {
      console.error(`❌ Error initializing ${modelName} counter:`, error);
    }
  }
}

/**
 * ✅ Get the current maximum ID for a model type (useful for migrations)
 */
async function getCurrentMaxId(modelName) {
  const counter = await Counter.findById(modelName);
  return counter ? counter.seq : 0;
}

/**
 * ✅ Set counter to specific value (useful for migrations)
 */
async function setCounterValue(modelName, value) {
  const counter = await Counter.findByIdAndUpdate(
    modelName,
    { $set: { seq: value } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

/**
 * ✅ Get next ID with validation
 */
async function getNextIdWithValidation(modelName) {
  const validModels = [
    'userId', 'productId', 'courseId', 'categoryId', 'orderId'
  ];
  
  if (!validModels.includes(modelName)) {
    throw new Error(`Invalid model name: ${modelName}. Valid models: ${validModels.join(', ')}`);
  }
  
  return await getNextId(modelName);
}

module.exports = Counter;
module.exports.getNextId = getNextId;
module.exports.initializeCounterRanges = initializeCounterRanges;
module.exports.getCurrentMaxId = getCurrentMaxId;
module.exports.setCounterValue = setCounterValue;
module.exports.getNextIdWithValidation = getNextIdWithValidation;
 