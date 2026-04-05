import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.staging' });

const Website = mongoose.model('Website', new mongoose.Schema({}, { strict: false }));
const Page = mongoose.model('Page', new mongoose.Schema({}, { strict: false }));

async function checkPages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const db = mongoose.connection.db;
    
    const websites = await db.collection('websites').find({}).toArray();
    console.log('\n=== Cloned Websites & Pages in Staging ===\n');
    
    for (const website of websites) {
      const pageCount = await db.collection('pages').countDocuments({ websiteId: website._id });
      console.log(`Website: ${website.branding?.siteName || 'Unnamed'} (${website.subdomain})`);
      console.log(`  Pages: ${pageCount}`);
      console.log(`  Published: ${website.isPublished ? 'YES' : 'NO'}`);
      console.log(`  Creator: ${website.creatorEmail}`);
      
      if (pageCount > 0) {
        const pages = await db.collection('pages').find({ websiteId: website._id }).toArray();
        pages.forEach(page => {
          console.log(`    - Page: "${page.title || 'Untitled'}" (${page.status})`);
        });
      }
      console.log('');
    }
    
    console.log(`Total: ${websites.length} websites cloned\n`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkPages();
