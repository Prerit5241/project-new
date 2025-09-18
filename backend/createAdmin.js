// createAdmin.js
require('dotenv').config(); // Load env variables
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const { getNextId } = require('./models/Counter'); // ✅ directly import helper

async function createAdmin() {
  try {
    // 1️⃣ Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📡 Connected to MongoDB');

    // 2️⃣ Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('❌ Admin already exists');
      await mongoose.disconnect();
      return;
    }

    // 3️⃣ Get next numeric ID (auto-increment)
    const nextUserId = await getNextId('users');

    // 4️⃣ Hash password (this plain password will be used to log in)
    const plainPassword = 'StrongAdminPassword123';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // 5️⃣ Create admin user
    const adminUser = new User({
      _id: nextUserId,
      name: 'Initial Admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully');
    console.log(`👉 Login email: admin@example.com`);
    console.log(`👉 Login password: ${plainPassword}`);

    // 6️⃣ Close DB connection
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error creating admin:', err);
    await mongoose.disconnect();
  }
}

// Run the script once
createAdmin();
