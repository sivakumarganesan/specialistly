// Check if API authentication is working
// Open browser console and run this:

const token = localStorage.getItem('authToken');
console.log('Token exists:', !!token);
console.log('Token length:', token?.length || 0);

if (token) {
  try {
    const parts = token.split('.');
    const payload = JSON.parse(atob(parts[1]));
    console.log('Token email:', payload.email);
    console.log('Token role:', payload.role);
    console.log('Token expiry:', new Date(payload.exp * 1000));
  } catch(e) {
    console.error('Failed to parse token:', e.message);
  }
}

// Also check the current user email in the page
console.log('Current page user:', document.body.innerText.includes('Nithya') ? 'Nithya' : 'Unknown');
