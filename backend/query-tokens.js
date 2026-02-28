import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
await mongoose.connect(process.env.MONGODB_URI);

const userSchema = new mongoose.Schema({}, { collection: 'users', strict: false });
const User = mongoose.model('User', userSchema);

const tokenSchema = new mongoose.Schema({}, { collection: 'useroauthtokens', strict: false });
const Token = mongoose.model('Token', tokenSchema);

// Find specialists with this email
const specialists = await User.find({ email: 'sivakumarganeshm@gmail.com' }).lean();
console.log('\n📧 Specialists with email sivakumarganeshm@gmail.com:');
console.log('Count:', specialists.length);
specialists.forEach(s => console.log('  - ID:', s._id, '| Name:', s.name || 'N/A'));

console.log('\n🔑 All OAuth Token Records:');
const allTokens = await Token.find({}).lean();
console.log('Total token records:', allTokens.length);

console.log('\n✅ Valid Token Exchanges (non-pending):');
const validTokens = await Token.find({ 
  zoomAccessToken: { $nin: ['pending', null, ''], $exists: true }
}).lean();
console.log('Count:', validTokens.length);
validTokens.forEach(t => {
  console.log('  - User ID:', t.userId);
  console.log('    Zoom Email:', t.zoomEmail);
  console.log('    Zoom User ID:', t.zoomUserId);
  console.log('    Token length:', t.zoomAccessToken?.length || 0, 'chars');
  console.log('    Expires:', new Date(t.zoomAccessTokenExpiry));
});

console.log('\n❌ Pending Token Exchanges:');
const pendingTokens = await Token.find({ 
  zoomAccessToken: 'pending'
}).lean();
console.log('Count:', pendingTokens.length);
pendingTokens.forEach(t => {
  console.log('  - User ID:', t.userId);
  console.log('    Status: All fields pending');
});

console.log('\n📋 Mapping User IDs to Emails:');
const allTokensWithUsers = await Token.find({}).lean();
for (const token of allTokensWithUsers) {
  const user = await User.findById(token.userId).lean();
  const tokenStatus = token.zoomAccessToken === 'pending' ? '❌ PENDING' : '✅ VALID';
  console.log(`\n  Token for User: ${user?.email || 'Unknown'} [${user?._id}]`);
  console.log(`    Status: ${tokenStatus}`);
  if (token.zoomAccessToken !== 'pending') {
    console.log(`    Zoom: ${token.zoomEmail}`);
  }
}

process.exit(0);
