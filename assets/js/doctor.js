/**
 * doctor.js — Doctor dashboard logic.
 * Requires utils.js and api.js
 */

var user = getFromStorage('loggedInUser', null);
if (!user || user.role !== 'doctor') {
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

async function loadAppointments() {
  renderSkeletons('todaySchedule', 'list', 2);
  renderSkeletons('upcomingSchedule', 'list', 2);

  try {
    const appointments = await api.getAppointments();
    const today = new Date().toISOString().split('T')[0];
    
    const myAppointments = appointments.filter(apt => apt.doctorId === user.id && apt.status !== 'cancelled');
    const todayAppts = myAppointments.filter(apt => apt.date === today);
    const upcomingAppts = myAppointments.filter(apt => apt.date > today);
    const pendingAppts = myAppointments.filter(apt => apt.status === 'pending');
    
    const patientIds = new Set(myAppointments.map(a => a.patientId));

    animateCounter('todayAppointments', todayAppts.length, 1000);
    animateCounter('pendingAppointments', pendingAppts.length, 1000);
    animateCounter('totalPatients', patientIds.size, 1000);

    displayAppointments('todaySchedule', todayAppts);
    displayAppointments('upcomingSchedule', upcomingAppts);
  } catch(err) {
    showToast('Failed to load schedule', 'error');
  }
}

function displayAppointments(containerId, appointments) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  if (appointments.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-check"></i><h3>No appointments</h3><p>Your schedule is clear.</p></div>';
    return;
  }

  appointments.sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));

  appointments.forEach(apt => {
    let statusBadge = apt.status === 'pending' ? '<span class="badge badge-pending">Pending</span>' : '<span class="badge badge-confirmed">Confirmed</span>';
    let actions = apt.status === 'pending' ? 
      `<button onclick="updateAppointmentStatus('${escapeHTML(apt.id)}', 'confirmed')" class="btn btn-sm btn-primary">Approve</button>
       <button onclick="updateAppointmentStatus('${escapeHTML(apt.id)}', 'cancelled')" class="btn btn-sm btn-danger-outline">Decline</button>` : '';

    let div = document.createElement('div');
    div.className = 'list-item';
    div.innerHTML = `
      <div class="list-item-header">
        <div>
          <div class="list-item-title">${escapeHTML(apt.patientName)}</div>
          <div class="list-item-subtitle">${escapeHTML(new Date(apt.date).toLocaleDateString())} at ${escapeHTML(apt.time)}</div>
        </div>
        ${statusBadge}
      </div>
      <div class="list-item-body">
        <strong>Notes:</strong> ${escapeHTML(apt.notes || 'None')}
      </div>
      <div class="list-item-actions">${actions}</div>
    `;
    container.appendChild(div);
  });
}

function updateAppointmentStatus(id, status) {
  if (status === 'cancelled') {
    showConfirm('Decline Appointment', 'Are you sure you want to decline this appointment?', 'danger', () => setStatus(id, status));
  } else {
    setStatus(id, status);
  }
}

async function setStatus(id, status) {
  try {
    await api.updateAppointmentStatus(id, status);
    showToast('Appointment ' + status + ' successfully.', 'success');
    loadAppointments();
  } catch(err) {
    showToast('Failed to update status', 'error');
  }
}

async function loadPatients(searchQuery) {
  renderSkeletons('patientList', 'list', 3);
  
  try {
    let patients = await api.getPatientsByDoctor(user.id);
    if (searchQuery) {
      patients = patients.filter(p => p.username.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    const container = document.getElementById('patientList');
    container.innerHTML = '';
    
    const patientSelect = document.getElementById('patientSelect');
    if (!searchQuery) patientSelect.innerHTML = '<option value="">Select Patient</option>';

    if (patients.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-users-slash"></i><h3>No patients found</h3></div>';
      return;
    }
    
    const medicalRecords = await api.getMedicalRecords();

    patients.forEach(patient => {
      if (!searchQuery) {
        let opt = document.createElement('option');
        opt.value = patient.id;
        opt.textContent = escapeHTML(patient.username);
        patientSelect.appendChild(opt);
      }
      
      const pRecords = medicalRecords[patient.id] || [];
      const lastVisitDate = pRecords.length > 0 ? new Date(pRecords[pRecords.length - 1].date).toLocaleDateString() : 'No visits';

      let div = document.createElement('div');
      div.className = 'list-item';
      div.innerHTML = `
        <div class="list-item-header"><div class="list-item-title">${escapeHTML(patient.username)}</div></div>
        <div class="list-item-body">
          <strong>Last Visit:</strong> ${escapeHTML(lastVisitDate)}<br>
          <strong>Records:</strong> ${pRecords.length} entries
        </div>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    showToast('Failed to load patients', 'error');
  }
}

async function issuePrescription(e) {
  e.preventDefault();
  const btn = this.querySelector('button[type="submit"]');
  setBtnLoading(btn, true);
  
  try {
    const patientId = document.getElementById('patientSelect').value;
    if (!patientId) throw new Error('Select a patient');

    await api.addMedicalRecord(patientId, {
      id: Date.now().toString(),
      doctorId: user.id,
      doctorName: user.username,
      date: new Date().toISOString(),
      diagnosis: 'Prescription Issued',
      prescription: {
        medication: document.getElementById('medication').value,
        dosage: document.getElementById('dosage').value,
        duration: document.getElementById('duration').value,
        instructions: document.getElementById('instructions').value
      }
    });
    
    showToast('Prescription issued successfully.', 'success');
    e.target.reset();
    loadRecentPrescriptions();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    setBtnLoading(btn, false);
  }
}

async function loadRecentPrescriptions() {
  renderSkeletons('recentPrescriptions', 'list', 2);
  try {
    const medicalRecords = await api.getMedicalRecords();
    const users = await api.getUsers();
    
    let allPrescriptions = [];
    Object.keys(medicalRecords).forEach(pId => {
      const patient = users.find(u => u.id === pId);
      const pName = patient ? patient.username : 'Unknown Patient';
      medicalRecords[pId].forEach(rec => {
        if (rec.doctorId === user.id && rec.prescription) {
          allPrescriptions.push({ patientName: pName, record: rec });
        }
      });
    });
    
    allPrescriptions.sort((a, b) => new Date(b.record.date) - new Date(a.record.date));
    
    const container = document.getElementById('recentPrescriptions');
    container.innerHTML = '';
    
    if (allPrescriptions.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-prescription-bottle"></i><h3>No prescriptions</h3></div>';
      return;
    }
    
    allPrescriptions.slice(0, 5).forEach(item => {
      let div = document.createElement('div');
      div.className = 'list-item';
      let pt = escapeHTML(item.patientName);
      let med = escapeHTML(item.record.prescription.medication);
      let dos = escapeHTML(item.record.prescription.dosage);
      let dur = escapeHTML(item.record.prescription.duration);
      let inst = escapeHTML(item.record.prescription.instructions);
      
      div.innerHTML = `
        <div class="list-item-header">
          <div>
            <div class="list-item-title">${pt}</div>
            <div class="list-item-subtitle">${med} - ${dos}</div>
          </div>
        </div>
        <div class="list-item-body">
          <strong>Duration:</strong> ${dur}<br>
          <strong>Instructions:</strong> ${inst}
        </div>
        <div class="list-item-actions">
          <button onclick="printPrescription('${pt}','${med}','${dos}','${dur}','${inst}')" class="btn btn-sm btn-secondary"><i class="fas fa-print"></i> Print</button>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    showToast('Failed to load prescriptions', 'error');
  }
}

function printPrescription(pt, med, dos, dur, inst) {
  const printArea = document.createElement('div');
  printArea.className = 'print-area';
  printArea.style.padding = '2rem';
  printArea.style.background = 'white';
  printArea.style.color = 'black';
  printArea.style.fontFamily = 'serif';
  printArea.style.lineHeight = '1.8';
  
  const d = new Date().toLocaleDateString();
  
  printArea.innerHTML = `
    <div style="text-align:center; border-bottom:2px solid black; padding-bottom:1rem; margin-bottom:2rem;">
      <h1 style="margin:0;">MediBook Hospital</h1>
      <h3 style="margin:0;">Dr. ${escapeHTML(user.username)}</h3>
    </div>
    <div style="margin-bottom:2rem;">
      <strong>Date:</strong> ${d}<br>
      <strong>Patient Name:</strong> ${pt}
    </div>
    <div style="margin-bottom:2rem;">
      <h2 style="border-bottom:1px solid #ccc;">Prescription (Rx)</h2>
      <p><strong>Medication:</strong> ${med}</p>
      <p><strong>Dosage:</strong> ${dos}</p>
      <p><strong>Duration:</strong> ${dur}</p>
      <p><strong>Instructions:</strong> ${inst}</p>
    </div>
    <div style="margin-top:4rem; text-align:right;">
      __________________________<br>Doctor's Signature
    </div>
  `;
    
  document.body.appendChild(printArea);
  window.print();
  document.body.removeChild(printArea);
}

async function loadProfile() {
  try {
    document.getElementById('fullName').value = user.username || '';
    document.getElementById('email').value    = user.email || '';
    document.getElementById('specialization').value = user.specialization || '';
    
    const p = await api.getProfile(user.id, 'doctor');
    document.getElementById('phone').value = p.phone || '';
    document.getElementById('qualifications').value = p.qualifications || '';
  } catch(err) {
    showToast('Failed to load profile', 'error');
  }
}

async function updateProfile(e) {
  e.preventDefault();
  const btn = this.querySelector('button[type="submit"]');
  setBtnLoading(btn, true);
  try {
    await api.updateProfile(user.id, 'doctor', {
      phone: document.getElementById('phone').value,
      qualifications: document.getElementById('qualifications').value
    });
    showToast('Profile updated successfully.', 'success');
  } catch(err) {
    showToast('Failed to update profile', 'error');
  } finally {
    setBtnLoading(btn, false);
  }
}

function setupEventListeners() {
  let searchTimeout;
  document.getElementById('patientSearch').addEventListener('input', function(e) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => loadPatients(e.target.value), 300);
  });
  
  document.getElementById('prescriptionForm').addEventListener('submit', issuePrescription);
  document.getElementById('profileForm').addEventListener('submit', updateProfile);
}

document.addEventListener('DOMContentLoaded', () => {
  initDashboard(user);
  loadAppointments();
  loadPatients();
  loadRecentPrescriptions();
  loadProfile();
  setupEventListeners();
});