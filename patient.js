function logout() {
  localStorage.removeItem("loggedInUser");
  window.location.href = "index.html";
}

const user = JSON.parse(localStorage.getItem("loggedInUser"));
if (!user || user.role !== "patient") {
  window.location.href = "login.html";
}

// --- Specialization and Doctor Dropdown Logic ---
function populateSpecializationSelect() {
  const users = JSON.parse(localStorage.getItem('users')) || [];
  const doctors = users.filter(u => u.role === 'doctor');
  const specializationSet = new Set(doctors.map(doc => doc.specialization).filter(Boolean));
  const specializationSelect = document.getElementById('specializationSelect');
  specializationSelect.innerHTML = '<option value="">Select Specialization</option>';
  specializationSet.forEach(spec => {
    const option = document.createElement('option');
    option.value = spec;
    option.textContent = spec;
    specializationSelect.appendChild(option);
  });
}

function populateDoctorSelect() {
  const users = JSON.parse(localStorage.getItem('users')) || [];
  const doctors = users.filter(u => u.role === 'doctor');
  const specialization = document.getElementById('specializationSelect').value;
  const doctorSelect = document.getElementById('doctorSelect');
  doctorSelect.innerHTML = '<option value="">Select Doctor</option>';
  doctors.filter(doc => doc.specialization === specialization).forEach(doc => {
    const option = document.createElement('option');
    option.value = doc.id;
    option.textContent = `Dr. ${doc.username}`;
    doctorSelect.appendChild(option);
  });
}

document.addEventListener('DOMContentLoaded', function () {
  populateSpecializationSelect();
  document.getElementById('specializationSelect').addEventListener('change', populateDoctorSelect);
  initializeAppointments();
  loadProfile();
  loadMedicalRecords();
  setupEventListeners();
  updateNotificationCount();
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

// Appointments Management
function initializeAppointments() {
  populateDateSelect();
  populateTimeSelect();
  loadAppointments();
}

function populateDateSelect() {
  const dateSelect = document.getElementById('appointmentDate');
  const today = new Date();

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const option = document.createElement('option');
    option.value = date.toISOString().split('T')[0];
    option.textContent = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    dateSelect.appendChild(option);
  }
}

function populateTimeSelect() {
  const timeSelect = document.getElementById('appointmentTime');
  const times = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
  ];

  times.forEach(time => {
    const option = document.createElement('option');
    option.value = time;
    option.textContent = time;
    timeSelect.appendChild(option);
  });
}

function loadAppointments() {
  const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
  const userAppointments = appointments.filter(apt => apt.patientId === user.id);
  const today = new Date();

  const upcoming = userAppointments.filter(apt => new Date(apt.date) >= today);
  const past = userAppointments.filter(apt => new Date(apt.date) < today);

  displayAppointments('upcomingAppointments', upcoming);
  displayAppointments('pastAppointments', past);
}

function displayAppointments(containerId, appointments) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  if (appointments.length === 0) {
    container.innerHTML = '<li class="appointment-item">No appointments found</li>';
    return;
  }

  appointments.forEach(apt => {
    const li = document.createElement('li');
    li.className = 'appointment-item';
    li.innerHTML = `
      <strong>Date:</strong> ${new Date(apt.date).toLocaleDateString()}<br>
      <strong>Time:</strong> ${apt.time}<br>
      <strong>Doctor:</strong> Dr. ${apt.doctorName}<br>
      <strong>Specialization:</strong> ${apt.specialization}<br>
      <strong>Status:</strong> ${apt.status}
    `;
    container.appendChild(li);
  });
}

// Profile Management
function loadProfile() {
  const profile = JSON.parse(localStorage.getItem('patientProfiles'))?.[user.id] || {};
  document.getElementById('fullName').value = profile.fullName || '';
  document.getElementById('email').value = profile.email || '';
  document.getElementById('phone').value = profile.phone || '';
  document.getElementById('dob').value = profile.dob || '';
  document.getElementById('address').value = profile.address || '';
}

// Medical Records
function loadMedicalRecords() {
  const records = JSON.parse(localStorage.getItem('medicalRecords')) || {};
  const userRecords = records[user.id] || [];

  const historyContainer = document.getElementById('medicalHistory');
  const prescriptionsContainer = document.getElementById('prescriptions');

  if (userRecords.length === 0) {
    historyContainer.innerHTML = '<p>No medical history available</p>';
    prescriptionsContainer.innerHTML = '<p>No prescriptions available</p>';
    return;
  }

  // Display medical history
  const historyHTML = userRecords.map(record => `
    <div class="record-item">
      <h3>${new Date(record.date).toLocaleDateString()}</h3>
      <p><strong>Diagnosis:</strong> ${record.diagnosis}</p>
      <p><strong>Notes:</strong> ${record.notes}</p>
    </div>
  `).join('');

  // Display prescriptions
  const prescriptionsHTML = userRecords
    .filter(record => record.prescription)
    .map(record => `
      <div class="prescription-item">
        <h3>${new Date(record.date).toLocaleDateString()}</h3>
        <p><strong>Medication:</strong> ${record.prescription.medication}</p>
        <p><strong>Dosage:</strong> ${record.prescription.dosage}</p>
        <p><strong>Duration:</strong> ${record.prescription.duration}</p>
      </div>
    `).join('');

  historyContainer.innerHTML = historyHTML;
  prescriptionsContainer.innerHTML = prescriptionsHTML;
}

// Event Listeners
function setupEventListeners() {
  // Appointment form submission
  document.getElementById('appointmentForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const specialization = document.getElementById('specializationSelect').value;
    const doctorId = document.getElementById('doctorSelect').value;
    const date = document.getElementById('appointmentDate').value;
    const time = document.getElementById('appointmentTime').value;
    const notes = document.getElementById('appointmentNotes').value;

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const doctor = users.find(u => u.id === doctorId);
    if (!doctor) {
      alert('Please select a doctor.');
      return;
    }

    // Create appointment
    const appointment = {
      id: Date.now().toString(),
      patientId: user.id,
      patientName: user.username,
      doctorId: doctor.id,
      doctorName: doctor.username,
      specialization: doctor.specialization,
      date: date,
      time: time,
      notes: notes,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
    appointments.push(appointment);
    localStorage.setItem('appointments', JSON.stringify(appointments));

    alert('Appointment booked successfully!');
    loadAppointments();
    this.reset();
    populateDoctorSelect(); // Reset doctor dropdown
  });

  // Profile form submission
  document.getElementById('profileForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const profile = {
      fullName: document.getElementById('fullName').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      dob: document.getElementById('dob').value,
      address: document.getElementById('address').value
    };

    const profiles = JSON.parse(localStorage.getItem('patientProfiles')) || {};
    profiles[user.id] = profile;
    localStorage.setItem('patientProfiles', JSON.stringify(profiles));

    alert('Profile updated successfully!');
  });
}

// Notifications
function updateNotificationCount() {
  const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
  const userAppointments = appointments.filter(apt =>
    apt.patientId === user.id &&
    apt.status === 'pending' &&
    new Date(apt.date) >= new Date()
  );

  const count = userAppointments.length;
  document.getElementById('notificationCount').textContent = count;
  document.getElementById('notificationCount').style.display = count > 0 ? 'inline' : 'none';
}