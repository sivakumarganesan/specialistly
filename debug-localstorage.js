// Save this as browser console snippet and run it

// 1. Check token in localStorage
const token = localStorage.getItem('authToken');
console.log('authToken in localStorage:', token ? 'YES' : 'NO');
console.log('Token length:', token?.length || 0);

// 2. Check if user logged in
const user = localStorage.getItem('user');
console.log('user in localStorage:', user ? 'YES' : 'NO');

// 3. Check all localStorage keys
console.log('All localStorage keys:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  const value = localStorage.getItem(key);
  console.log(`  ${key}: ${typeof value === 'string' && value.length > 100 ? value.substring(0, 100) + '...' : value}`);
}

// 4. Try manual API call with token
if (token) {
  fetch('/api/page-builder/websites', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(r => r.json())
  .then(d => console.log('API Response:', d))
  .catch(e => console.error('API Error:', e.message));
} else {
  console.log('No token - cannot test API');
}
