// Authentication check
const user = JSON.parse(localStorage.getItem("loggedInUser"));
if (!user || user.role !== "doctor") {
    window.location.href = "login.html";
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function () {
    loadSchedule();
    loadPatientList();
    loadProfile();
    updateStats();
    setupEventListeners();
    populatePatientSelect();
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

    if (sectionId === 'prescriptions') {
        populatePatientSelect();
    }
}

// Schedule Management
function loadSchedule() {
    const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
    const today = new Date().toISOString().split('T')[0];

    const todayAppointments = appointments.filter(apt =>
        apt.doctorId === user.id &&
        apt.date === today
    );

    const upcomingAppointments = appointments.filter(apt =>
        apt.doctorId === user.id &&
        apt.date > today
    );

    displayAppointments('todaySchedule', todayAppointments);
    displayAppointments('upcomingSchedule', upcomingAppointments);
}

function displayAppointments(containerId, appointments) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (appointments.length === 0) {
        container.innerHTML = '<p>No appointments found</p>';
        return;
    }

    appointments.forEach(apt => {
        const card = document.createElement('div');
        card.className = 'appointment-card';
        card.innerHTML = `
            <div class="appointment-header">
                <h3>${apt.time}</h3>
                <span class="status-badge status-${apt.status.toLowerCase()}">${apt.status}</span>
            </div>
            <div class="patient-info">
                <p><strong>Patient:</strong> ${apt.patientName}</p>
                <p><strong>Notes:</strong> ${apt.notes || 'No notes'}</p>
            </div>
            <div class="action-buttons">
                ${apt.status === 'pending' ? `
                    <button onclick="updateAppointmentStatus('${apt.id}', 'confirmed')" class="btn-primary">Confirm</button>
                    <button onclick="updateAppointmentStatus('${apt.id}', 'cancelled')" class="btn-danger">Cancel</button>
                ` : ''}
                <button onclick="viewPatientRecords('${apt.patientId}')" class="btn-secondary">View Records</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function updateAppointmentStatus(appointmentId, newStatus) {
    const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
    const appointmentIndex = appointments.findIndex(apt => apt.id === appointmentId);

    if (appointmentIndex !== -1) {
        appointments[appointmentIndex].status = newStatus;
        localStorage.setItem('appointments', JSON.stringify(appointments));
        loadSchedule();
        updateStats();
    }
}

// Patient Records
function loadPatientList() {
    const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
    const users = JSON.parse(localStorage.getItem('users')) || [];
    // Only confirmed appointments for this doctor
    const myAppointments = appointments.filter(
        apt => apt.doctorId === user.id && apt.status === 'confirmed'
    );
    // Unique patient IDs
    const patientIds = [...new Set(myAppointments.map(apt => apt.patientId))];
    // Get patient user objects
    const myPatients = users.filter(u => patientIds.includes(u.id));
    // Render patients (example)
    const patientList = document.getElementById('patientList');
    patientList.innerHTML = '';
    myPatients.forEach(patient => {
        const div = document.createElement('div');
        div.textContent = patient.username + ' (' + (patient.email || '') + ')';
        patientList.appendChild(div);
    });
}

function viewPatientRecords(patientId) {
    const records = JSON.parse(localStorage.getItem('medicalRecords')) || {};
    const patientRecords = records[patientId] || [];

    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    modal.innerHTML = `
        <div style="background: white; padding: 2rem; border-radius: 8px; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto;">
            <h2>Patient Medical Records</h2>
            ${patientRecords.length === 0 ? '<p>No medical records found</p>' :
            patientRecords.map(record => `
                    <div class="medical-record">
                        <h3>${new Date(record.date).toLocaleDateString()}</h3>
                        <p><strong>Diagnosis:</strong> ${record.diagnosis}</p>
                        <p><strong>Notes:</strong> ${record.notes}</p>
                        ${record.prescription ? `
                            <h4>Prescription</h4>
                            <p><strong>Medication:</strong> ${record.prescription.medication}</p>
                            <p><strong>Dosage:</strong> ${record.prescription.dosage}</p>
                            <p><strong>Duration:</strong> ${record.prescription.duration}</p>
                            <p><strong>Instructions:</strong> ${record.prescription.instructions}</p>
                        ` : ''}
                    </div>
                `).join('')}
            }
            <button onclick="this.parentElement.parentElement.remove()" class="btn-primary" style="margin-top: 1rem;">Close</button>
        </div>
    `;

    document.body.appendChild(modal);
}

// Prescriptions
function setupEventListeners() {
    document.getElementById('prescriptionForm').addEventListener('submit', function (e) {
        e.preventDefault();

        const prescription = {
            id: Date.now().toString(),
            patientId: document.getElementById('patientSelect').value,
            medication: document.getElementById('medication').value,
            dosage: document.getElementById('dosage').value,
            duration: document.getElementById('duration').value,
            instructions: document.getElementById('instructions').value,
            date: new Date().toISOString(),
            doctorId: user.id
        };

        const records = JSON.parse(localStorage.getItem('medicalRecords')) || {};
        if (!records[prescription.patientId]) {
            records[prescription.patientId] = [];
        }

        records[prescription.patientId].push({
            date: prescription.date,
            diagnosis: '',
            notes: '',
            prescription: {
                medication: prescription.medication,
                dosage: prescription.dosage,
                duration: prescription.duration,
                instructions: prescription.instructions
            }
        });

        localStorage.setItem('medicalRecords', JSON.stringify(records));
        alert('Prescription issued successfully!');
        this.reset();
        loadRecentPrescriptions();
    });

    document.getElementById('profileForm').addEventListener('submit', function (e) {
        e.preventDefault();

        const profile = {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            specialization: document.getElementById('specialization').value,
            qualifications: document.getElementById('qualifications').value
        };

        const profiles = JSON.parse(localStorage.getItem('doctorProfiles')) || {};
        profiles[user.id] = profile;
        localStorage.setItem('doctorProfiles', JSON.stringify(profiles));

        alert('Profile updated successfully!');
    });
}

function loadRecentPrescriptions() {
    const records = JSON.parse(localStorage.getItem('medicalRecords')) || {};
    const recentPrescriptions = [];

    Object.entries(records).forEach(([patientId, patientRecords]) => {
        patientRecords.forEach(record => {
            if (record.prescription && record.doctorId === user.id) {
                recentPrescriptions.push({
                    ...record,
                    patientId
                });
            }
        });
    });

    recentPrescriptions.sort((a, b) => new Date(b.date) - new Date(a.date));

    const container = document.getElementById('recentPrescriptions');
    container.innerHTML = '';

    if (recentPrescriptions.length === 0) {
        container.innerHTML = '<p>No recent prescriptions</p>';
        return;
    }

    recentPrescriptions.slice(0, 5).forEach(prescription => {
        const card = document.createElement('div');
        card.className = 'medical-record';
        card.innerHTML = `
            <h3>${new Date(prescription.date).toLocaleDateString()}</h3>
            <p><strong>Patient ID:</strong> ${prescription.patientId}</p>
            <p><strong>Medication:</strong> ${prescription.prescription.medication}</p>
            <p><strong>Dosage:</strong> ${prescription.prescription.dosage}</p>
            <p><strong>Duration:</strong> ${prescription.prescription.duration}</p>
        `;
        container.appendChild(card);
    });
}

// Profile Management
function loadProfile() {
    const profiles = JSON.parse(localStorage.getItem('doctorProfiles')) || {};
    const profile = profiles[user.id] || {};

    document.getElementById('fullName').value = profile.fullName || '';
    document.getElementById('email').value = profile.email || '';
    document.getElementById('phone').value = profile.phone || '';
    document.getElementById('specialization').value = profile.specialization || '';
    document.getElementById('qualifications').value = profile.qualifications || '';
}

// Statistics
function updateStats() {
    const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
    const today = new Date().toISOString().split('T')[0];

    const todayCount = appointments.filter(apt =>
        apt.doctorId === user.id &&
        apt.date === today
    ).length;

    const pendingCount = appointments.filter(apt =>
        apt.doctorId === user.id &&
        apt.status === 'pending'
    ).length;

    const uniquePatients = new Set(appointments
        .filter(apt => apt.doctorId === user.id)
        .map(apt => apt.patientId)
    ).size;

    document.getElementById('todayAppointments').textContent = todayCount;
    document.getElementById('pendingAppointments').textContent = pendingCount;
    document.getElementById('totalPatients').textContent = uniquePatients;
}

// Logout
function logout() {
    localStorage.removeItem("loggedInUser");
    window.location.href = "index.html";
}

function populatePatientSelect() {
    const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
    const users = JSON.parse(localStorage.getItem('users')) || [];
    // Only confirmed appointments for this doctor
    const myAppointments = appointments.filter(
        apt => apt.doctorId === user.id && apt.status === 'confirmed'
    );
    // Unique patient IDs
    const patientIds = [...new Set(myAppointments.map(apt => apt.patientId))];
    // Get patient user objects
    const myPatients = users.filter(u => patientIds.includes(u.id));
    // Populate the select
    const patientSelect = document.getElementById('patientSelect');
    patientSelect.innerHTML = '<option value="">Select Patient</option>';
    myPatients.forEach(patient => {
        const option = document.createElement('option');
        option.value = patient.id;
        option.textContent = patient.username + (patient.email ? ` (${patient.email})` : '');
        patientSelect.appendChild(option);
    });
} 