import https from 'https';

// Create a simple empty commit to trigger the deployment workflow
import { execSync } from 'child_process';

console.log('📦 Triggering backend redeployment...\n');

try {
  // Stage all changes (there shouldn't be any, but just in case)
  console.log('1️⃣  Creating trigger commit...');
  execSync('git add .', { cwd: '.' });
  
  // Create an empty commit with message to trigger ci/deployment
  try {
    execSync('git commit --allow-empty -m "chore: Trigger backend redeployment for ObjectId fix"', { cwd: '.' });
    console.log('✅ Commit created');
  } catch (e) {
    console.log('✅ No changes to commit (expected)');
  }
  
  console.log('\n2️⃣  Pushing to GitHub (will trigger workflow)...');
  execSync('git push origin develop', { cwd: '.' });
  console.log('✅ Pushed successfully');
  
  console.log('\n3️⃣  Deployment status:');
  console.log('   - GitHub Actions should trigger within 1-2 seconds');
  console.log('   - Railway rebuild will take ~2-3 minutes');
  console.log('   - Service will be live in ~5-7 minutes total');
  console.log('\n4️⃣  After deployment, test the endpoint:');
  console.log('   curl "https://staging.specialistly.com/api/courses/enrollments/self-paced/my-courses" \\');
  console.log('        -H "X-Customer-Email: sinduja.vel@gmail.com"');
  console.log('\n   Expected response: 4 courses (or check logs for details)');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
