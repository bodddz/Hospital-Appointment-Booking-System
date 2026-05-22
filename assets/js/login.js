/**
 * login.js - Handles authentication and seeded data using the mock API
 */

// Basic Admin Seed (run synchronously on load if empty, or force update admin1)
(function seedAdmin() {
  var users = getFromStorage('users', []);
  (async function() {
    var hashedAdmin = await hashPassword('admin123');
    var adminIndex = users.findIndex(u => u.username === 'admin1');
    
    if (adminIndex === -1) {
      users.push({
        id: 'admin-0',
        username: 'admin1',
        passwordHash: hashedAdmin,
        role: 'admin'
      });
      setToStorage('users', users);
      console.log('Seeded initial admin user (admin1 / admin123)');
    } else {
      // Force update the password hash in case it was stored as plaintext previously
      users[adminIndex].passwordHash = hashedAdmin;
      setToStorage('users', users);
    }
  })();
})();

document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  var u = document.getElementById('loginUsername').value;
  var p = document.getElementById('loginPassword').value;
  var submitBtn = this.querySelector('button[type="submit"]');
  
  if (!u || !p) {
    showToast('Please enter username and password', 'warning');
    return;
  }
  
  setBtnLoading(submitBtn, true);

  try {
    const response = await api.login(u, p);
    const user = response.user;
    
    // Save JWT token
    localStorage.setItem('authToken', response.token);
    
    // Save minimal info to session state
    setToStorage('loggedInUser', {
      id: user.id,
      username: user.username,
      role: user.role,
      specialization: user.specialization
    });
    
    showToast('Login successful!', 'success');
    
    // Redirect based on role
    setTimeout(() => {
      if (user.role === 'patient') window.location.href = 'patient.html';
      else if (user.role === 'doctor') window.location.href = 'doctor.html';
      else if (user.role === 'admin') window.location.href = 'admin.html';
    }, 500); // short delay to show the toast before page unloads
    
  } catch (error) {
    showToast(error.message, 'error');
    setBtnLoading(submitBtn, false);
  }
});
