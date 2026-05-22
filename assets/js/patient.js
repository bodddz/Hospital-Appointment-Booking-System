/**
 * patient.js — Patient dashboard logic.
 * Requires utils.js and api.js
 */

var user = getFromStorage('loggedInUser', null);
if (!user || user.role !== 'patient') {
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
  
  if (event && event.currentTarget) {
    event.currentTarget.classList.add('active');
  }
  
  var sidebar = document.querySelector('.sidebar');
  if (window.innerWidth <= 768 && sidebar) sidebar.classList.remove('open');
}

async function populateSpecializationSelect() {
  const doctors = await api.getDoctors();
  const specializationSet = new Set(doctors.map(d => d.specialization).filter(Boolean));
  const specializationSelect = document.getElementById('specializationSelect');
  
  specializationSelect.innerHTML = '<option value="">Select Specialization</option>';
  specializationSet.forEach(spec => {
    let option = document.createElement('option');
    option.value = spec;
    option.textContent = escapeHTML(spec);
    specializationSelect.appendChild(option);
  });
}

async function populateDoctorSelect() {
  const specialization = document.getElementById('specializationSelect').value;
  const doctorSelect = document.getElementById('doctorSelect');
  doctorSelect.innerHTML = '<option value="">Loading...</option>';
  
  const doctors = await api.getDoctors();
  
  doctorSelect.innerHTML = '<option value="">Select Doctor</option>';
  doctors
    .filter(d => d.specialization === specialization)
    .forEach(doc => {
      let option = document.createElement('option');
      option.value = doc.id;
      option.textContent = 'Dr. ' + escapeHTML(doc.username);
      doctorSelect.appendChild(option);
    });
}

function populateDateInput() {
  document.getElementById('appointmentDate').min = new Date().toISOString().split('T')[0];
}

function populateTimeSelect() {
  const timeSelect = document.getElementById('appointmentTime');
  const times = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'];
  times.forEach(time => {
    let option = document.createElement('option');
    option.value = time;
    option.textContent = time;
    timeSelect.appendChild(option);
  });
}

async function loadAppointments() {
  renderSkeletons('upcomingAppointments', 'list', 2);
  renderSkeletons('pastAppointments', 'list', 2);
  
  try {
    const appointments = await api.getAppointments();
    const userAppointments = appointments.filter(apt => apt.patientId === user.id);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = userAppointments.filter(apt => new Date(apt.date) >= today);
    const past     = userAppointments.filter(apt => new Date(apt.date) < today);

    animateCounter('stat-upcoming', upcoming.length, 1000);
    animateCounter('stat-past', past.length, 1000);

    displayAppointments('upcomingAppointments', upcoming, true);
    displayAppointments('pastAppointments', past, false);
    
    // Update badge
    const pendingCount = upcoming.filter(a => a.status === 'pending').length;
    const badge = document.getElementById('notificationCount');
    if (badge) {
      badge.textContent = pendingCount;
      badge.style.display = pendingCount > 0 ? 'inline-flex' : 'none';
    }
  } catch (err) {
    showToast('Failed to load appointments', 'error');
  }
}

function displayAppointments(containerId, appointments, isUpcoming) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  if (appointments.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-calendar-times"></i><h3>No appointments found</h3><p>You have no ${isUpcoming ? 'upcoming' : 'past'} appointments.</p></div>`;
    return;
  }

  appointments.sort((a, b) => new Date(a.date) - new Date(b.date));
  if (!isUpcoming) appointments.reverse();

  appointments.forEach(apt => {
    let badgeClass = apt.status === 'confirmed' ? 'badge-confirmed' : (apt.status === 'cancelled' ? 'badge-cancelled' : 'badge-pending');
    let cancelBtn = (isUpcoming && apt.status !== 'cancelled') ? `<button onclick="cancelAppointment('${escapeHTML(apt.id)}')" class="btn btn-sm btn-danger-outline"><i class="fas fa-times"></i> Cancel</button>` : '';

    let div = document.createElement('div');
    div.className = 'list-item';
    div.innerHTML = `
      <div class="list-item-header">
        <div>
          <div class="list-item-title">Dr. ${escapeHTML(apt.doctorName)}</div>
          <div class="list-item-subtitle">${escapeHTML(apt.specialization)}</div>
        </div>
        <span class="badge ${badgeClass}">${escapeHTML(apt.status)}</span>
      </div>
      <div class="list-item-body">
        <strong>Date:</strong> ${escapeHTML(new Date(apt.date).toLocaleDateString())}<br>
        <strong>Time:</strong> ${escapeHTML(apt.time)}
      </div>
      ${cancelBtn ? `<div class="list-item-actions">${cancelBtn}</div>` : ''}
    `;
    container.appendChild(div);
  });
}

function cancelAppointment(appointmentId) {
  showConfirm('Cancel Appointment', 'Are you sure you want to cancel this appointment?', 'danger', async function() {
    try {
      await api.updateAppointmentStatus(appointmentId, 'cancelled');
      showToast('Appointment cancelled.', 'success');
      loadAppointments();
    } catch (err) {
      showToast('Error cancelling appointment.', 'error');
    }
  });
}

async function loadProfile() {
  try {
    const profile = await api.getProfile(user.id, 'patient');
    document.getElementById('fullName').value = profile.fullName || '';
    document.getElementById('email').value    = profile.email    || '';
    document.getElementById('phone').value    = profile.phone    || '';
    document.getElementById('dob').value      = profile.dob      || '';
    document.getElementById('address').value  = profile.address  || '';
  } catch (err) {
    showToast('Failed to load profile.', 'error');
  }
}

async function loadMedicalRecords() {
  renderSkeletons('medicalHistory', 'list', 2);
  renderSkeletons('prescriptions', 'list', 2);
  
  try {
    const recordsObj = await api.getMedicalRecords();
    const userRecords = recordsObj[user.id] || [];
    
    const historyContainer = document.getElementById('medicalHistory');
    const rxContainer = document.getElementById('prescriptions');

    if (userRecords.length === 0) {
      historyContainer.innerHTML = '<div class="empty-state"><i class="fas fa-file-medical-alt"></i><h3>No records found</h3></div>';
      rxContainer.innerHTML = '<div class="empty-state"><i class="fas fa-prescription-bottle-alt"></i><h3>No prescriptions found</h3></div>';
      return;
    }

    historyContainer.innerHTML = userRecords.map(record => `
      <div class="list-item">
        <div class="list-item-header"><div class="list-item-title">${escapeHTML(new Date(record.date).toLocaleDateString())}</div></div>
        <div class="list-item-body">
          <strong>Diagnosis/Notes:</strong> ${escapeHTML(record.diagnosis || record.notes || 'N/A')}
        </div>
      </div>
    `).join('');

    const withPrescriptions = userRecords.filter(r => r.prescription);
    if (withPrescriptions.length === 0) {
      rxContainer.innerHTML = '<div class="empty-state"><i class="fas fa-prescription-bottle-alt"></i><h3>No prescriptions found</h3></div>';
    } else {
      rxContainer.innerHTML = withPrescriptions.map(record => `
        <div class="list-item">
          <div class="list-item-header">
            <div class="list-item-title">${escapeHTML(record.prescription.medication)}</div>
            <div class="list-item-subtitle">${escapeHTML(new Date(record.date).toLocaleDateString())}</div>
          </div>
          <div class="list-item-body">
            <strong>Dosage:</strong> ${escapeHTML(record.prescription.dosage)}<br>
            <strong>Duration:</strong> ${escapeHTML(record.prescription.duration)}
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    showToast('Failed to load records.', 'error');
  }
}

function setupEventListeners() {
  document.getElementById('appointmentForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = this.querySelector('button[type="submit"]');
    setBtnLoading(btn, true);

    const docId = document.getElementById('doctorSelect').value;
    const date = document.getElementById('appointmentDate').value;
    const time = document.getElementById('appointmentTime').value;
    
    try {
      const doctors = await api.getDoctors();
      const doctor = doctors.find(d => d.id === docId);
      
      await api.bookAppointment({
        id: Date.now().toString(),
        patientId: user.id,
        patientName: user.username,
        doctorId: doctor.id,
        doctorName: doctor.username,
        specialization: doctor.specialization,
        date: date,
        time: time,
        notes: document.getElementById('appointmentNotes').value,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      
      showToast('Appointment booked successfully!', 'success');
      this.reset();
      loadAppointments();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBtnLoading(btn, false);
    }
  });

  document.getElementById('profileForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = this.querySelector('button[type="submit"]');
    setBtnLoading(btn, true);
    
    try {
      await api.updateProfile(user.id, 'patient', {
        fullName: document.getElementById('fullName').value,
        email:    document.getElementById('email').value,
        phone:    document.getElementById('phone').value,
        dob:      document.getElementById('dob').value,
        address:  document.getElementById('address').value
      });
      showToast('Profile updated successfully!', 'success');
    } catch(err) {
      showToast('Failed to update profile', 'error');
    } finally {
      setBtnLoading(btn, false);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initDashboard(user);
  populateDateInput();
  populateTimeSelect();
  populateSpecializationSelect();
  document.getElementById('specializationSelect').addEventListener('change', populateDoctorSelect);
  loadAppointments();
  loadProfile();
  loadMedicalRecords();
  setupEventListeners();
});