/**
 * admin.js — Admin dashboard logic.
 * Requires utils.js and api.js
 */

var user = getFromStorage('loggedInUser', null);
if (!user || user.role !== 'admin') {
  window.location.href = 'login.html';
}

function logout() {
  localStorage.removeItem('loggedInUser');
  localStorage.removeItem('authToken');
  window.location.href = 'index.html';
}

function showSection(sectionId, event) {
  document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');

  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  if (event && event.currentTarget) event.currentTarget.classList.add('active');
  
  var sidebar = document.querySelector('.sidebar');
  if (window.innerWidth <= 768 && sidebar) sidebar.classList.remove('open');
}

async function loadStats() {
  renderSkeletons('recentActivity', 'list', 3);
  
  try {
    const stats = await api.getAdminStats();

    animateCounter('totalUsers', stats.totalUsers, 1000);
    animateCounter('totalDoctors', stats.doctorsCount, 1000);
    animateCounter('totalPatients', stats.patientsCount, 1000);
    animateCounter('totalAppointments', stats.totalAppointments, 1000);

    renderChart(stats.appointmentsData);

    const activityContainer = document.getElementById('recentActivity');
    activityContainer.innerHTML = '';
    
    if (stats.recentActivity.length === 0) {
      activityContainer.innerHTML = '<div class="empty-state"><i class="fas fa-history"></i><h3>No recent activity</h3></div>';
      return;
    }
    
    stats.recentActivity.forEach(apt => {
      let div = document.createElement('div');
      div.className = 'list-item';
      let d = new Date(apt.createdAt).toLocaleString();
      div.innerHTML = `
        <div class="list-item-header">
          <div class="list-item-title">New Appointment Booked</div>
          <div class="list-item-subtitle">${d}</div>
        </div>
        <div class="list-item-body">
          ${escapeHTML(apt.patientName)} booked Dr. ${escapeHTML(apt.doctorName)}
        </div>
      `;
      activityContainer.appendChild(div);
    });
  } catch (err) {
    showToast('Failed to load dashboard stats', 'error');
  }
}

async function loadUsers(searchQuery) {
  renderSkeletons('userList', 'table', 4);
  
  try {
    let users = await api.getUsers();
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      users = users.filter(u => u.username.toLowerCase().includes(q) || u.role.toLowerCase().includes(q));
    }

    const tbody = document.getElementById('userList');
    tbody.innerHTML = '';

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No users found.</td></tr>';
      return;
    }

    users.forEach(u => {
      let tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHTML(u.username)}</td>
        <td><span class="badge badge-info">${escapeHTML(u.role)}</span></td>
        <td>${escapeHTML(u.email || 'N/A')}</td>
        <td><span class="badge badge-confirmed">Active</span></td>
        <td>
          ${u.role !== 'admin' ? `<button onclick="deleteUser('${escapeHTML(u.id)}')" class="btn btn-sm btn-danger-outline"><i class="fas fa-trash"></i></button>` : ''}
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast('Failed to load users', 'error');
  }
}

async function addNewUser() {
  const username = prompt('Enter username for new user:');
  if (!username) return;
  const role = prompt('Enter role (patient, doctor, admin):', 'patient');
  if (!['patient', 'doctor', 'admin'].includes(role)) {
    showToast('Invalid role.', 'error');
    return;
  }
  const password = prompt('Enter password:');
  if (!password || password.length < 8) {
    showToast('Password must be at least 8 characters.', 'error');
    return;
  }
  
  try {
    const hashed = await hashPassword(password);
    const newUser = {
      id: Date.now().toString(),
      username: username,
      passwordHash: hashed,
      role: role,
      email: username + '@example.com'
    };
    
    if (role === 'doctor') {
      const spec = prompt('Enter specialization for doctor:');
      newUser.specialization = spec || 'General';
    }
    
    await api.register(newUser);
    showToast('User created successfully.', 'success');
    loadUsers();
    loadStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function deleteUser(userId) {
  showConfirm('Delete User', 'Are you sure you want to delete this user? This action cannot be undone.', 'danger', async function() {
    try {
      // Since it's a mock API, we directly interact with localStorage for this unexposed delete function
      let users = getFromStorage('users');
      users = users.filter(u => u.id !== userId);
      setToStorage('users', users);
      showToast('User deleted.', 'success');
      loadUsers();
      loadStats();
    } catch(err) {
      showToast('Error deleting user', 'error');
    }
  });
}

function loadDepartments() {
  const depts = getFromStorage('departments', []);
  const tbody = document.getElementById('departmentList');
  tbody.innerHTML = '';
  
  if (depts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No departments found.</td></tr>';
    return;
  }
  
  depts.forEach(d => {
    let tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHTML(d.name)}</td>
      <td>${escapeHTML(d.head)}</td>
      <td>${escapeHTML(d.doctorsCount)}</td>
      <td>
        <button onclick="deleteDepartment('${escapeHTML(d.id)}')" class="btn btn-sm btn-danger-outline"><i class="fas fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function addNewDepartment() {
  const name = prompt('Enter department name:');
  if (!name) return;
  const head = prompt('Enter head doctor name:');
  
  const depts = getFromStorage('departments', []);
  depts.push({
    id: Date.now().toString(),
    name: name,
    head: head || 'TBD',
    doctorsCount: Math.floor(Math.random() * 10) + 1
  });
  
  setToStorage('departments', depts);
  showToast('Department added.', 'success');
  loadDepartments();
}

function deleteDepartment(id) {
  showConfirm('Delete Department', 'Are you sure?', 'danger', function() {
    let depts = getFromStorage('departments', []);
    depts = depts.filter(d => d.id !== id);
    setToStorage('departments', depts);
    showToast('Department deleted.', 'success');
    loadDepartments();
  });
}

async function loadAllAppointments(searchQuery, statusFilter) {
  renderSkeletons('appointmentList', 'table', 4);
  
  try {
    let appointments = await api.getAppointments();

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      appointments = appointments.filter(a => 
        a.patientName.toLowerCase().includes(q) || a.doctorName.toLowerCase().includes(q)
      );
    }
    
    if (statusFilter && statusFilter !== 'all') {
      appointments = appointments.filter(a => a.status === statusFilter);
    }
    
    appointments.sort((a, b) => new Date(b.date) - new Date(a.date));

    const tbody = document.getElementById('appointmentList');
    tbody.innerHTML = '';

    if (appointments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No appointments found.</td></tr>';
      return;
    }

    appointments.forEach(apt => {
      let badgeClass = apt.status === 'confirmed' ? 'badge-confirmed' : (apt.status === 'cancelled' ? 'badge-cancelled' : 'badge-pending');
      
      let tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHTML(new Date(apt.date).toLocaleDateString())}</td>
        <td>${escapeHTML(apt.time)}</td>
        <td>${escapeHTML(apt.patientName)}</td>
        <td>Dr. ${escapeHTML(apt.doctorName)}</td>
        <td><span class="badge ${badgeClass}">${escapeHTML(apt.status)}</span></td>
        <td>
          ${apt.status !== 'cancelled' ? `<button onclick="adminCancelAppointment('${escapeHTML(apt.id)}')" class="btn btn-sm btn-danger-outline">Cancel</button>` : ''}
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast('Failed to load appointments', 'error');
  }
}

function adminCancelAppointment(id) {
  showConfirm('Cancel Appointment', 'Cancel this appointment on behalf of the user?', 'warning', async function() {
    try {
      await api.updateAppointmentStatus(id, 'cancelled');
      showToast('Appointment cancelled.', 'success');
      loadAllAppointments(
        document.getElementById('appointmentSearch').value,
        document.getElementById('appointmentFilter').value
      );
    } catch (err) {
      showToast('Failed to cancel appointment', 'error');
    }
  });
}

function loadSettings() {
  const settings = getFromStorage('systemSettings', {
    hospitalName: 'MediBook General Hospital',
    contactEmail: 'contact@medibook.com',
    contactPhone: '+1 234 567 8900',
    address: '123 Health Ave, Medical District'
  });
  
  document.getElementById('hospitalName').value = settings.hospitalName;
  document.getElementById('contactEmail').value = settings.contactEmail;
  document.getElementById('contactPhone').value = settings.contactPhone;
  document.getElementById('address').value = settings.address;
}

function saveSettings(e) {
  e.preventDefault();
  const btn = this.querySelector('button[type="submit"]');
  setBtnLoading(btn, true);
  
  setTimeout(() => {
    const settings = {
      hospitalName: document.getElementById('hospitalName').value,
      contactEmail: document.getElementById('contactEmail').value,
      contactPhone: document.getElementById('contactPhone').value,
      address: document.getElementById('address').value
    };
    setToStorage('systemSettings', settings);
    showToast('Settings saved successfully.', 'success');
    setBtnLoading(btn, false);
  }, 500); // Small manual delay for UX
}

// ─── Data Visualization (Chart.js) ────────────────────────────────────────────
let appointmentsChartInstance = null;

function renderChart(appointments) {
  const ctx = document.getElementById('appointmentsChart');
  if (!ctx) return;
  
  const pending = appointments.filter(a => a.status === 'pending').length;
  const confirmed = appointments.filter(a => a.status === 'confirmed').length;
  const cancelled = appointments.filter(a => a.status === 'cancelled').length;

  if (appointmentsChartInstance) {
    appointmentsChartInstance.destroy();
  }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  appointmentsChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Pending', 'Confirmed', 'Cancelled'],
      datasets: [{
        data: [pending, confirmed, cancelled],
        backgroundColor: [
          '#f59e0b', // warning
          '#10b981', // success
          '#ef4444'  // danger
        ],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: textColor, font: { family: 'Inter' } }
        }
      }
    }
  });
}

// ─── Export to CSV ────────────────────────────────────────────────────────────
async function exportAppointmentsCSV() {
  try {
    const appointments = await api.getAppointments();
    if (appointments.length === 0) {
      showToast('No data to export', 'warning');
      return;
    }
    
    // Headers
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Date,Time,Patient Name,Doctor Name,Specialization,Status\n";
    
    // Rows
    appointments.forEach(apt => {
      // Escape fields that might have commas
      let row = [
        apt.id,
        apt.date,
        apt.time,
        `"${apt.patientName}"`,
        `"Dr. ${apt.doctorName}"`,
        `"${apt.specialization}"`,
        apt.status
      ].join(",");
      csvContent += row + "\n";
    });
    
    // Trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "medibook_appointments.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export successful', 'success');
  } catch (err) {
    showToast('Export failed', 'error');
  }
}

function setupEventListeners() {
  let userSearchTimeout;
  document.getElementById('userSearch').addEventListener('input', function(e) {
    clearTimeout(userSearchTimeout);
    userSearchTimeout = setTimeout(() => loadUsers(e.target.value), 300);
  });
  
  const aptSearch = document.getElementById('appointmentSearch');
  const aptFilter = document.getElementById('appointmentFilter');
  let aptSearchTimeout;
  
  aptSearch.addEventListener('input', function() {
    clearTimeout(aptSearchTimeout);
    aptSearchTimeout = setTimeout(() => loadAllAppointments(aptSearch.value, aptFilter.value), 300);
  });
  aptFilter.addEventListener('change', function() {
    loadAllAppointments(aptSearch.value, aptFilter.value);
  });
  
  document.getElementById('settingsForm').addEventListener('submit', saveSettings);
}

document.addEventListener('DOMContentLoaded', () => {
  initDashboard(user);
  loadStats();
  loadUsers();
  loadDepartments();
  loadAllAppointments();
  loadSettings();
  setupEventListeners();
});