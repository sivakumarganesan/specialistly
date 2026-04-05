import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.staging') });

const BACKEND_URL = process.env.BACKEND_URL || 'https://staging.specialistly.com/api';
const adminEmail = 'sivakumarganeshm@gmail.com';
const adminPassword = 'StagingTest123!';

console.log('🚀 Creating Test Website in Staging\n');
console.log('═'.repeat(60));

try {
  // Step 1: Login
  console.log('\n📝 Step 1: Login as admin...');
  const loginRes = await axios.post(`${BACKEND_URL}/auth/login`, {
    email: adminEmail,
    password: adminPassword,
  });

  const token = loginRes.data.token;
  console.log('✅ Logged in successfully\n');

  // Step 2: Create website
  console.log('📝 Step 2: Create test website...');
  const createWebsiteRes = await axios.post(
    `${BACKEND_URL}/page-builder/websites`,
    {
      name: 'Test Specialist Site',
      tagline: 'Professional testing website for Specialistly staging',
      colors: {
        primary: '#3B82F6',
        secondary: '#ec4899',
      },
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const website = createWebsiteRes.data.data;
  console.log(`✅ Website created!`);
  console.log(`   Name: ${website.branding.siteName}`);
  console.log(`   Subdomain: ${website.subdomain}`);
  console.log(`   ID: ${website._id}`);
  console.log(`   URL: https://${website.subdomain}.specialistly.com\n`);

  // Step 3: Verify we can fetch the website
  console.log('📝 Step 3: Verify website retrieval...');
  const getWebsiteRes = await axios.get(
    `${BACKEND_URL}/page-builder/websites/${website._id}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  console.log(`✅ Website retrieved successfully`);
  console.log(`   Creator: ${getWebsiteRes.data.data.creatorEmail}\n`);

  // Step 4: Create a page
  console.log('📝 Step 4: Create home page...');
  const createPageRes = await axios.post(
    `${BACKEND_URL}/page-builder/websites/${website._id}/pages`,
    {
      title: 'Home',
      slug: 'home',
      description: 'Home page for test website',
      order: 1,
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const page = createPageRes.data.data;
  console.log(`✅ Page created!`);
  console.log(`   Title: ${page.title}`);
  console.log(`   Slug: ${page.slug}`);
  console.log(`   ID: ${page._id}\n`);

  // Step 5: Get pages
  console.log('📝 Step 5: Fetch all pages for website...');
  const getPagesRes = await axios.get(
    `${BACKEND_URL}/page-builder/websites/${website._id}/pages`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  console.log(`✅ Pages retrieved!`);
  console.log(`   Total pages: ${getPagesRes.data.data.length}`);
  getPagesRes.data.data.forEach((p, i) => {
    console.log(`     ${i + 1}. ${p.title}`);
  });
  console.log();

  // Step 6: Publish website
  console.log('📝 Step 6: Publish website...');
  const publishRes = await axios.put(
    `${BACKEND_URL}/page-builder/websites/${website._id}/publish`,
    { isPublished: true },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  console.log(`✅ Website published!`);
  console.log(`   Published: ${publishRes.data.data.isPublished}\n`);

  // Step 7: Ensure subdomain
  console.log('📝 Step 7: Ensure subdomain configuration...');
  const subdomainRes = await axios.put(
    `${BACKEND_URL}/page-builder/websites/${website._id}/ensure-subdomain`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  console.log(`✅ Subdomain configured!`);
  console.log(`   Subdomain: ${subdomainRes.data.data.subdomain}\n`);

  // Summary
  console.log('═'.repeat(60));
  console.log('\n✨ TEST COMPLETE!\n');
  console.log('📊 Created Resources:');
  console.log(`   Website ID: ${website._id}`);
  console.log(`   Website URL: https://${website.subdomain}.specialistly.com`);
  console.log(`   Page ID: ${page._id}`);
  console.log();
  console.log('🔗 Next Steps:');
  console.log(`   1. Visit: https://${website.subdomain}.specialistly.com`);
  console.log('   2. Upload media to Cloudflare R2');
  console.log('   3. Add sections to pages');
  console.log('   4. Test Cloudflare subdomain routing');
  console.log();
  console.log('✅ All endpoints working correctly!');
  console.log('═'.repeat(60));

} catch (error) {
  console.error('\n❌ Error:', error.message);
  if (error.response?.data) {
    console.error('Response:', error.response.data);
  }
  process.exit(1);
}
