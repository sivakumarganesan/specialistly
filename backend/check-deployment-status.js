import https from 'https';

console.log('🔍 Checking GitHub Actions Deployment Status\n');

const options = {
  hostname: 'api.github.com',
  port: 443,
  path: '/repos/sivakumarganesan/specialistly/actions/runs?event=push&branch=develop&per_page=5',
  method: 'GET',
  headers: {
    'User-Agent': 'Node.js',
    'Accept': 'application/vnd.github.v3+json'
  }
};

https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.workflow_runs && json.workflow_runs.length > 0) {
        const run = json.workflow_runs[0];
        console.log('Latest Deploy to Staging Run:');
        console.log(`  Status: ${run.status}`);
        console.log(`  Conclusion: ${run.conclusion || 'IN PROGRESS'}`);
        console.log(`  Started: ${new Date(run.created_at).toLocaleString()}`);
        console.log(`  URL: ${run.html_url}\n`);

        if (run.status === 'in_progress') {
          console.log('⏳ Deployment still in progress...');
          console.log('   Wait 2-3 more minutes for Railway to complete the deployment');
        } else if (run.status === 'completed' && run.conclusion === 'success') {
          console.log('✅ Deployment completed successfully!');
          console.log('   Railway may still need 30sec to 1min to fully restart the service');
          console.log('   Try again in 1 minute');
        } else if (run.status === 'completed' && run.conclusion === 'failure') {
          console.log('❌ Deployment failed!');
          console.log('   Check the workflow logs for errors');
        }
      }
    } catch(e) {
      console.log('Response:', data.substring(0, 500));
    }
  });
}).on('error', err => {
  console.error('Error:', err.message);
});
