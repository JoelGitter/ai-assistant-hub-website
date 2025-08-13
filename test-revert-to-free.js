const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const User = require('./models/User');

async function revertUserToFree(email) {
  try {
    console.log(`Reverting user ${email} to free plan...`);
    
    const user = await User.findOne({ email });
    if (!user) {
      console.error('User not found:', email);
      return;
    }
    
    console.log('Current subscription:', user.subscription);
    
    // Update to free plan (simulating payment failure)
    await user.updateSubscription({
      status: 'inactive',
      plan: 'free',
      usage: {
        ...user.subscription.usage,
        requestsLimit: 10 // Back to free tier limit
      }
    });
    
    // Reload user to see changes
    const updatedUser = await User.findOne({ email });
    console.log('Updated subscription:', updatedUser.subscription);
    
    console.log('✅ User successfully reverted to free plan!');
    
  } catch (error) {
    console.error('Error reverting user:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Usage: node test-revert-to-free.js user@example.com
const email = process.argv[2];
if (!email) {
  console.log('Usage: node test-revert-to-free.js user@example.com');
  process.exit(1);
}

revertUserToFree(email); 