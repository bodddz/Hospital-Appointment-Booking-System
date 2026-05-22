/**
 * api.js - Simulated Asynchronous Backend Layer (SaaS Premium Edition)
 * Simulates a real REST API, including mock JWT authentication and notifications.
 */

const SIMULATED_DELAY = 800; // ms

// Helper to simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ─── JWT MOCK ENGINE ─────────────────────────────────────────
function generateMockJWT(user) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({
    id: user.id,
    role: user.role,
    exp: Date.now() + 86400000 // 24 hours
  }));
  const signature = btoa("mock-signature-secret");
  return `${header}.${payload}.${signature}`;
}

function verifyToken() {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('Unauthorized: No token provided');
  // In a real app, we'd verify the signature. Here we just decode to check expiry.
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp < Date.now()) throw new Error('Token expired');
    return payload;
  } catch (e) {
    throw new Error('Invalid token');
  }
}

const api = {
  // ─── AUTHENTICATION ──────────────────────────────────────────
  async login(username, password) {
    await delay(SIMULATED_DELAY);
    const users = getFromStorage('users', []);
    const user = users.find(u => u.username === username);
    
    if (!user) throw new Error('User not found');
    
    const hashed = await hashPassword(password);
    if (user.passwordHash !== hashed) throw new Error('Invalid credentials');
    
    const token = generateMockJWT(user);
    
    return { user, token };
  },

  async register(userData) {
    await delay(SIMULATED_DELAY);
    const users = getFromStorage('users', []);
    
    if (users.some(u => u.username === userData.username)) {
      throw new Error('Username already exists');
    }
    
    users.push(userData);
    setToStorage('users', users);
    return userData; // Requires login after register
  },

  // ─── USERS ───────────────────────────────────────────────────
  async getUsers() {
    verifyToken();
    await delay(SIMULATED_DELAY);
    return getFromStorage('users', []);
  },

  async getDoctors() {
    verifyToken();
    await delay(SIMULATED_DELAY);
    return getFromStorage('users', []).filter(u => u.role === 'doctor');
  },
  
  async getPatientsByDoctor(doctorId) {
    verifyToken();
    await delay(SIMULATED_DELAY);
    const appointments = getFromStorage('appointments', []);
    const users = getFromStorage('users', []);
    const patientIds = new Set(appointments.filter(a => a.doctorId === doctorId).map(a => a.patientId));
    return users.filter(u => patientIds.has(u.id));
  },

  // ─── APPOINTMENTS ────────────────────────────────────────────
  async getAppointments() {
    verifyToken();
    await delay(SIMULATED_DELAY);
    return getFromStorage('appointments', []);
  },

  async bookAppointment(appointmentData) {
    verifyToken();
    await delay(SIMULATED_DELAY);
    const appointments = getFromStorage('appointments', []);
    
    const conflict = appointments.some(a => 
      a.doctorId === appointmentData.doctorId &&
      a.date === appointmentData.date &&
      a.time === appointmentData.time &&
      a.status !== 'cancelled'
    );
    
    if (conflict) throw new Error('This time slot is already booked.');
    
    appointments.push(appointmentData);
    setToStorage('appointments', appointments);
    
    // Add notification for doctor
    await this.addNotification(appointmentData.doctorId, `New appointment booked by ${appointmentData.patientName} for ${appointmentData.date}`);
    
    return appointmentData;
  },

  async updateAppointmentStatus(appointmentId, newStatus) {
    const caller = verifyToken();
    await delay(SIMULATED_DELAY);
    const appointments = getFromStorage('appointments', []);
    const idx = appointments.findIndex(a => a.id === appointmentId);
    
    if (idx === -1) throw new Error('Appointment not found');
    
    const apt = appointments[idx];
    apt.status = newStatus;
    setToStorage('appointments', appointments);
    
    // Notify patient if doctor or admin changed it
    if (caller.role !== 'patient') {
      const msg = `Your appointment with Dr. ${apt.doctorName} on ${apt.date} was ${newStatus}.`;
      await this.addNotification(apt.patientId, msg);
    }
    
    return apt;
  },

  // ─── MEDICAL RECORDS ─────────────────────────────────────────
  async getMedicalRecords() {
    verifyToken();
    await delay(SIMULATED_DELAY);
    return getFromStorage('medicalRecords', {});
  },

  async addMedicalRecord(patientId, recordData) {
    verifyToken();
    await delay(SIMULATED_DELAY);
    const records = getFromStorage('medicalRecords', {});
    if (!records[patientId]) records[patientId] = [];
    
    records[patientId].push(recordData);
    setToStorage('medicalRecords', records);
    
    // Notify patient
    await this.addNotification(patientId, `Dr. ${recordData.doctorName} added a new medical record/prescription.`);
    
    return recordData;
  },

  // ─── PROFILES ────────────────────────────────────────────────
  async getProfile(userId, role) {
    verifyToken();
    await delay(500);
    const key = role === 'patient' ? 'patientProfiles' : 'doctorProfiles';
    return getFromStorage(key, {})[userId] || {};
  },

  async updateProfile(userId, role, profileData) {
    verifyToken();
    await delay(SIMULATED_DELAY);
    const key = role === 'patient' ? 'patientProfiles' : 'doctorProfiles';
    const profiles = getFromStorage(key, {});
    profiles[userId] = profileData;
    setToStorage(key, profiles);
    return profileData;
  },
  
  // ─── DASHBOARD STATS ─────────────────────────────────────────
  async getAdminStats() {
    verifyToken();
    await delay(1000); 
    const users = getFromStorage('users', []);
    const appointments = getFromStorage('appointments', []);
    
    return {
      totalUsers: users.length,
      doctorsCount: users.filter(u => u.role === 'doctor').length,
      patientsCount: users.filter(u => u.role === 'patient').length,
      totalAppointments: appointments.length,
      appointmentsData: appointments, // for Chart.js
      recentActivity: appointments.slice().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
    };
  },

  // ─── NOTIFICATIONS ───────────────────────────────────────────
  async getNotifications(userId) {
    verifyToken();
    await delay(300);
    const notifs = getFromStorage('notifications', {});
    return notifs[userId] || [];
  },

  async addNotification(userId, message) {
    const notifs = getFromStorage('notifications', {});
    if (!notifs[userId]) notifs[userId] = [];
    
    notifs[userId].unshift({
      id: Date.now().toString(),
      message,
      read: false,
      date: new Date().toISOString()
    });
    
    // Keep only last 10
    if (notifs[userId].length > 10) notifs[userId].pop();
    
    setToStorage('notifications', notifs);
  },

  async markNotificationsRead(userId) {
    verifyToken();
    const notifs = getFromStorage('notifications', {});
    if (notifs[userId]) {
      notifs[userId].forEach(n => n.read = true);
      setToStorage('notifications', notifs);
    }
  }
};
