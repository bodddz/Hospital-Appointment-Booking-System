/**
 * register.js - Handles user registration using the mock API
 */

document.getElementById('regRole').addEventListener('change', function(e) {
  var specContainer = document.getElementById('specContainer');
  if (e.target.value === 'doctor') {
    specContainer.style.display = 'block';
  } else {
    specContainer.style.display = 'none';
  }
});

document.getElementById('registerForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  var username = document.getElementById('regUsername').value.trim();
  var email = document.getElementById('regEmail').value.trim();
  var role = document.getElementById('regRole').value;
  var spec = document.getElementById('regSpec').value.trim();
  var password = document.getElementById('regPassword').value;
  var submitBtn = this.querySelector('button[type="submit"]');
  
  if (!username || !email || !password) {
    showToast('Please fill all required fields', 'warning');
    return;
  }
  
  if (password.length < 8) {
    showToast('Password must be at least 8 characters', 'warning');
    return;
  }
  
  if (role === 'doctor' && !spec) {
    showToast('Specialization is required for doctors', 'warning');
    return;
  }
  
  setBtnLoading(submitBtn, true);
  
  try {
    var hashed = await hashPassword(password);
    
    var newUser = {
      id: Date.now().toString(),
      username: username,
      email: email,
      role: role,
      passwordHash: hashed
    };
    
    if (role === 'doctor') {
      newUser.specialization = spec;
    }
    
    await api.register(newUser);
    
    showToast('Registration successful! Redirecting to login...', 'success');
    
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
    
  } catch (error) {
    showToast(error.message, 'error');
    setBtnLoading(submitBtn, false);
  }
});