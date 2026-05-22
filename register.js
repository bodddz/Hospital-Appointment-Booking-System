// Show/hide specialization field based on role selection
const regRole = document.getElementById('regRole');
const specContainer = document.getElementById('specContainer');
regRole.addEventListener('change', function () {
    if (this.value === 'doctor') {
        specContainer.style.display = 'block';
    } else {
        specContainer.style.display = 'none';
    }
});

// Registration logic (update to store email)
document.getElementById('registerForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;
    const specialization = document.getElementById('regSpec').value.trim();

    let users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.some(u => u.username === username)) {
        document.getElementById('registerMsg').textContent = 'Username already exists!';
        return;
    }
    if (users.some(u => u.email === email)) {
        document.getElementById('registerMsg').textContent = 'Email already registered!';
        return;
    }
    const newUser = {
        id: Date.now().toString(),
        username,
        email,
        password,
        role,
        status: 'Active'
    };
    if (role === 'doctor') {
        newUser.specialization = specialization;
    }
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('loggedInUser', JSON.stringify(newUser));
    // Redirect based on role
    if (role === 'doctor') {
        window.location.href = 'doctor.html';
    } else {
        window.location.href = 'patient.html';
    }
});