// Authentication check
const user = JSON.parse(localStorage.getItem("loggedInUser"));
if (!user || user.role !== "admin") {
    window.location.href = "login.html";
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function () {
    loadOverview();
    loadUsers();
    loadDepartments();
    loadAppointments();
    loadSettings();
    setupEventListeners();
});

// Navigation
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
}

// Overview Section
function loadOverview() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const appointments = JSON.parse(localStorage.getItem('appointments')) || [];

    const totalUsers = users.length;
    const totalDoctors = users.filter(u => u.role === 'doctor').length;
    const totalPatients = users.filter(u => u.role === 'patient').length;
    const totalAppointments = appointments.length;

    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('totalDoctors').textContent = totalDoctors;
    document.getElementById('totalPatients').textContent = totalPatients;
    document.getElementById('totalAppointments').textContent = totalAppointments;

    loadRecentActivity();
}

function loadRecentActivity() {
    const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
    const users = JSON.parse(localStorage.getItem('users')) || [];

    // Sort appointments by date
    appointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const recentActivity = document.getElementById('recentActivity');
    recentActivity.innerHTML = '';

    // Show last 5 activities
    appointments.slice(0, 5).forEach(apt => {
        const patient = users.find(u => u.id === apt.patientId);
        const doctor = users.find(u => u.id === apt.doctorId);

        const activity = document.createElement('div');
        activity.className = 'card';
        activity.innerHTML = `
            <p><strong>${new Date(apt.createdAt).toLocaleString()}</strong></p>
            <p>New appointment scheduled:</p>
            <p>Patient: ${patient ? patient.username : 'Unknown'}</p>
            <p>Doctor: ${doctor ? doctor.username : 'Unknown'}</p>
            <p>Date: ${new Date(apt.date).toLocaleDateString()}</p>
            <p>Status: ${apt.status}</p>
        `;
        recentActivity.appendChild(activity);
    });
}

// User Management
function loadUsers() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userList = document.getElementById('userList');
    userList.innerHTML = '';

    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.role}</td>
            <td>${user.email || 'N/A'}</td>
            <td>${user.status || 'Active'}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="editUser('${user.id}')" class="btn-secondary">Edit</button>
                    <button onclick="deleteUser('${user.id}')" class="btn-danger">Delete</button>
                </div>
            </td>
        `;
        userList.appendChild(row);
    });
}

function addNewUser() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Add New User</h2>
            <form id="newUserForm">
                <div class="form-group">
                    <label>Username</label>
                    <input type="text" id="username" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="email" required>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="password" required>
                </div>
                <div class="form-group">
                    <label>Role</label>
                    <select id="role" required>
                        <option value="patient">Patient</option>
                        <option value="doctor">Doctor</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <button type="submit" class="btn-primary">Add User</button>
                <button type="button" onclick="this.parentElement.parentElement.parentElement.remove()" class="btn-secondary">Cancel</button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('newUserForm').addEventListener('submit', function (e) {
        e.preventDefault();

        const newUser = {
            id: Date.now().toString(),
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            role: document.getElementById('role').value,
            status: 'Active'
        };

        const users = JSON.parse(localStorage.getItem('users')) || [];
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        modal.remove();
        loadUsers();
        loadOverview();
    });
}

function editUser(userId) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.id === userId);

    if (!user) return;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Edit User</h2>
            <form id="editUserForm">
                <div class="form-group">
                    <label>Username</label>
                    <input type="text" id="username" value="${user.username}" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="email" value="${user.email || ''}" required>
                </div>
                <div class="form-group">
                    <label>Role</label>
                    <select id="role" required>
                        <option value="patient" ${user.role === 'patient' ? 'selected' : ''}>Patient</option>
                        <option value="doctor" ${user.role === 'doctor' ? 'selected' : ''}>Doctor</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="status" required>
                        <option value="Active" ${user.status === 'Active' ? 'selected' : ''}>Active</option>
                        <option value="Inactive" ${user.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
                <button type="submit" class="btn-primary">Update User</button>
                <button type="button" onclick="this.parentElement.parentElement.parentElement.remove()" class="btn-secondary">Cancel</button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('editUserForm').addEventListener('submit', function (e) {
        e.preventDefault();

        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            users[userIndex] = {
                ...users[userIndex],
                username: document.getElementById('username').value,
                email: document.getElementById('email').value,
                role: document.getElementById('role').value,
                status: document.getElementById('status').value
            };

            localStorage.setItem('users', JSON.stringify(users));
            modal.remove();
            loadUsers();
            loadOverview();
        }
    });
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const updatedUsers = users.filter(u => u.id !== userId);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        loadUsers();
        loadOverview();
    }
}

// Department Management
function loadDepartments() {
    const departments = JSON.parse(localStorage.getItem('departments')) || [];
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const departmentList = document.getElementById('departmentList');
    departmentList.innerHTML = '';

    departments.forEach(dept => {
        const headDoctor = users.find(u => u.id === dept.headDoctorId);
        const doctorsInDept = users.filter(u => u.role === 'doctor' && u.departmentId === dept.id);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${dept.name}</td>
            <td>${headDoctor ? headDoctor.username : 'Not Assigned'}</td>
            <td>${doctorsInDept.length}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="editDepartment('${dept.id}')" class="btn-secondary">Edit</button>
                    <button onclick="deleteDepartment('${dept.id}')" class="btn-danger">Delete</button>
                </div>
            </td>
        `;
        departmentList.appendChild(row);
    });
}

function addNewDepartment() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Add New Department</h2>
            <form id="newDepartmentForm">
                <div class="form-group">
                    <label>Department Name</label>
                    <input type="text" id="deptName" required>
                </div>
                <div class="form-group">
                    <label>Head Doctor</label>
                    <select id="headDoctor">
                        <option value="">Select Head Doctor</option>
                    </select>
                </div>
                <button type="submit" class="btn-primary">Add Department</button>
                <button type="button" onclick="this.parentElement.parentElement.parentElement.remove()" class="btn-secondary">Cancel</button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Populate doctors dropdown
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const doctors = users.filter(u => u.role === 'doctor');
    const headDoctorSelect = document.getElementById('headDoctor');

    doctors.forEach(doctor => {
        const option = document.createElement('option');
        option.value = doctor.id;
        option.textContent = doctor.username;
        headDoctorSelect.appendChild(option);
    });

    document.getElementById('newDepartmentForm').addEventListener('submit', function (e) {
        e.preventDefault();

        const newDepartment = {
            id: Date.now().toString(),
            name: document.getElementById('deptName').value,
            headDoctorId: document.getElementById('headDoctor').value,
            createdAt: new Date().toISOString()
        };

        const departments = JSON.parse(localStorage.getItem('departments')) || [];
        departments.push(newDepartment);
        localStorage.setItem('departments', JSON.stringify(departments));

        modal.remove();
        loadDepartments();
    });
}

// Appointment Management
function loadAppointments() {
    const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const appointmentList = document.getElementById('appointmentList');
    appointmentList.innerHTML = '';

    appointments.forEach(apt => {
        const patient = users.find(u => u.id === apt.patientId);
        const doctor = users.find(u => u.id === apt.doctorId);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(apt.date).toLocaleDateString()}</td>
            <td>${apt.time}</td>
            <td>${patient ? patient.username : 'Unknown'}</td>
            <td>${doctor ? doctor.username : 'Unknown'}</td>
            <td>${apt.status}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="editAppointment('${apt.id}')" class="btn-secondary">Edit</button>
                    <button onclick="deleteAppointment('${apt.id}')" class="btn-danger">Delete</button>
                </div>
            </td>
        `;
        appointmentList.appendChild(row);
    });
}

// Settings
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('hospitalSettings')) || {
        hospitalName: '',
        contactEmail: '',
        contactPhone: '',
        address: ''
    };

    document.getElementById('hospitalName').value = settings.hospitalName;
    document.getElementById('contactEmail').value = settings.contactEmail;
    document.getElementById('contactPhone').value = settings.contactPhone;
    document.getElementById('address').value = settings.address;
}

function setupEventListeners() {
    // Settings form submission
    document.getElementById('settingsForm').addEventListener('submit', function (e) {
        e.preventDefault();

        const settings = {
            hospitalName: document.getElementById('hospitalName').value,
            contactEmail: document.getElementById('contactEmail').value,
            contactPhone: document.getElementById('contactPhone').value,
            address: document.getElementById('address').value
        };

        localStorage.setItem('hospitalSettings', JSON.stringify(settings));
        alert('Settings saved successfully!');
    });

    // Search functionality
    document.getElementById('userSearch').addEventListener('input', function (e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#userList tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });

    // Appointment filter
    document.getElementById('appointmentFilter').addEventListener('change', function (e) {
        const status = e.target.value;
        const rows = document.querySelectorAll('#appointmentList tr');

        rows.forEach(row => {
            if (status === 'all') {
                row.style.display = '';
            } else {
                const rowStatus = row.querySelector('td:nth-child(5)').textContent.toLowerCase();
                row.style.display = rowStatus === status ? '' : 'none';
            }
        });
    });
}

// Logout
function logout() {
    localStorage.removeItem("loggedInUser");
    window.location.href = "index.html";
}

function editAppointment(appointmentId) {
    const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const apt = appointments.find(a => a.id === appointmentId);
    if (!apt) return;
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Edit Appointment</h2>
            <form id="editAppointmentForm">
                <div class="form-group">
                    <label>Date</label>
                    <input type="date" id="editAptDate" value="${apt.date}" required>
                </div>
                <div class="form-group">
                    <label>Time</label>
                    <input type="text" id="editAptTime" value="${apt.time}" required>
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="editAptStatus">
                        <option value="pending" ${apt.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="confirmed" ${apt.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="cancelled" ${apt.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
                <button type="submit" class="btn-primary">Update Appointment</button>
                <button type="button" onclick="this.parentElement.parentElement.parentElement.remove()" class="btn-secondary">Cancel</button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('editAppointmentForm').addEventListener('submit', function (e) {
        e.preventDefault();
        apt.date = document.getElementById('editAptDate').value;
        apt.time = document.getElementById('editAptTime').value;
        apt.status = document.getElementById('editAptStatus').value;
        localStorage.setItem('appointments', JSON.stringify(appointments));
        modal.remove();
        loadAppointments();
        loadOverview();
    });
}

function deleteAppointment(appointmentId) {
    if (confirm('Are you sure you want to delete this appointment?')) {
        let appointments = JSON.parse(localStorage.getItem('appointments')) || [];
        appointments = appointments.filter(a => a.id !== appointmentId);
        localStorage.setItem('appointments', JSON.stringify(appointments));
        loadAppointments();
        loadOverview();
    }
}

function editDepartment(deptId) {
    const departments = JSON.parse(localStorage.getItem('departments')) || [];
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const dept = departments.find(d => d.id === deptId);
    if (!dept) return;
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Edit Department</h2>
            <form id="editDepartmentForm">
                <div class="form-group">
                    <label>Department Name</label>
                    <input type="text" id="editDeptName" value="${dept.name}" required>
                </div>
                <div class="form-group">
                    <label>Head Doctor</label>
                    <select id="editHeadDoctor">
                        <option value="">Select Head Doctor</option>
                        ${users.filter(u => u.role === 'doctor').map(doc => `<option value="${doc.id}" ${dept.headDoctorId === doc.id ? 'selected' : ''}>${doc.username}</option>`).join('')}
                    </select>
                </div>
                <button type="submit" class="btn-primary">Update Department</button>
                <button type="button" onclick="this.parentElement.parentElement.parentElement.remove()" class="btn-secondary">Cancel</button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('editDepartmentForm').addEventListener('submit', function (e) {
        e.preventDefault();
        dept.name = document.getElementById('editDeptName').value;
        dept.headDoctorId = document.getElementById('editHeadDoctor').value;
        localStorage.setItem('departments', JSON.stringify(departments));
        modal.remove();
        loadDepartments();
    });
}

function deleteDepartment(deptId) {
    if (confirm('Are you sure you want to delete this department?')) {
        let departments = JSON.parse(localStorage.getItem('departments')) || [];
        departments = departments.filter(d => d.id !== deptId);
        localStorage.setItem('departments', JSON.stringify(departments));
        loadDepartments();
    }
} 