import mongoose from 'mongoose';
import User from './models/User.js';
import bcrypt from 'bcryptjs';

async function resetPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://specialistly_user:SpeciXlistly01@cluster0.jseized.mongodb.net/specialistlydb_prod?appName=Cluster0');
    
    console.log('Connected to MongoDB');
    
    // Generate new password hash
    const newPassword = await bcrypt.hash('password', 10);
    console.log('New hash:', newPassword);
    
    // Update user
    const result = await User.updateOne(
      { email: 'sivakumarganeshm@gmail.com' },
      { password: newPassword }
    );
    
    console.log('Update result:', result);
    
    // Verify the update
    const user = await User.findOne({ email: 'sivakumarganeshm@gmail.com' });
    console.log('User found:', user?.email);
    console.log('User password hash:', user?.password);
    
    // Test password comparison
    if (user) {
      const isValid = await user.comparePassword('password');
      console.log('Password comparison result:', isValid);
    }
    
    await mongoose.connection.close();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

resetPassword();
