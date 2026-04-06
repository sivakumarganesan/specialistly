import { MongoClient } from 'mongodb';

const stagingUri = 'mongodb+srv://staging_user:Innovations26@cluster-staging.nynoyv.mongodb.net/specialistly_staging?retryWrites=true&w=majority';

(async () => {
  const client = new MongoClient(stagingUri);
  try {
    await client.connect();
    const db = client.db('specialistly_staging');
    
    // Check if website with subdomain "staging" already exists
    const existing = await db.collection('websites').findOne({ subdomain: 'staging' });
    if (existing) {
      console.log('✅ Website with subdomain "staging" already exists');
      console.log('   Name:', existing.branding?.siteName);
      process.exit(0);
    }
    
    // Get first website as template
    const websites = await db.collection('websites').find({}).toArray();
    if (websites.length === 0) {
      console.error('❌ No websites in staging database. Did the restore work?');
      process.exit(1);
    }
    
    const template = websites[0];
    const stagingWebsite = {
      creatorEmail: 'staging-site@specialistly.local',
      subdomain: 'staging',
      isConfigured: true,
      branding: template.branding || {
        siteName: 'Staging Website',
        tagline: 'Staging Environment',
        primaryColor: '#3B82F6',
        secondaryColor: '#ec4899',
        fontFamily: 'Inter',
        buttonStyle: 'pill',
        buttonRadius: '8px'
      },
      theme: template.theme || { mode: 'light' },
      content: template.content || { selectedCourses: [], selectedServices: [] },
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('websites').insertOne(stagingWebsite);
    console.log('✅ Created website for subdomain "staging"');
    console.log('   ID:', result.insertedId);
    console.log('   Name:', stagingWebsite.branding.siteName);
    process.exit(0);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
})();
