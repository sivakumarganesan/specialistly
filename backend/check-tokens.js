import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
mongoose.connect(process.env.MONGODB_URI);

const tokenSchema = new mongoose.Schema({}, { collection: 'useroauthtokens', strict: false });
const Token = mongoose.model('Token', tokenSchema);

const userSchema = new mongoose.Schema({}, { collection: 'users', strict: false });
const User = mongoose.model('User', userSchema);

(async () => {
  try {
    // Find all tokens with valid (non-pending) values
    const validTokens = await Token.find({ 
      zoomAccessToken: { $ne: 'pending', $exists: true, $ne: null }
    });
    
    console.log('✓ Users with VALID Zoom tokens:');
    for (const token of validTokens) {
      const user = await User.findById(token.userId);
      console.log('  - User:', user?.email || token.userId);
      console.log('    Zoom Email:', token.zoomEmail);
      console.log('    Token Expires:', new Date(token.zoomAccessTokenExpiry));
    }
    
    if (validTokens.length === 0) {
      console.log('  (none found)');
    }
    
    // Find all tokens with pending values
    const pendingTokens = await Token.find({ 
      zoomAccessToken: 'pending'
    });
    
    console.log('\n❌ Users with PENDING tokens:');
    for (const token of pendingTokens) {
      const user = await User.findById(token.userId);
      console.log('  - User:', user?.email || token.userId);
    }
    
    if (pendingTokens.length === 0) {
      console.log('  (none found)');
    }
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
