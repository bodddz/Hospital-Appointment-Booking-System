# MediBook Pro: Healthcare Scheduling Platform 🏥✨

![MediBook Banner](assets/img/doctor.png) <!-- Note: Optional banner image -->

**MediBook Pro** is a modern, enterprise-grade Hospital Appointment Booking System. Designed as a "Premium SaaS" product, it demonstrates advanced frontend architecture, mock asynchronous data flows, and stunning UX design.

## 🚀 Features

### For Patients
- **Smart Scheduling:** Book appointments asynchronously without worrying about double-booking conflicts.
- **Medical History:** View your entire history and digital prescriptions from your doctors.
- **Real-Time Notifications:** Get instantly alerted via the In-App Notification Bell when a doctor confirms your appointment.

### For Doctors
- **Schedule Management:** A streamlined dashboard to view today's itinerary and upcoming patients.
- **Prescription Issuing:** Write digital prescriptions and print them directly from the browser.
- **One-Click Approvals:** Easily confirm or decline pending appointments.

### For Administrators
- **Live Analytics (Chart.js):** Monitor hospital efficiency with a beautiful, interactive Doughnut chart of appointment statuses.
- **CSV Data Export:** Download raw appointment records directly to a `.csv` file for external reporting.
- **Staff Management:** Add, remove, and manage doctors, patients, and hospital departments.

## 🧠 Architecture & Tech Stack
This project runs entirely in the browser using Vanilla JavaScript, HTML5, and CSS3, requiring no backend server to test!

- **The "Mock API" (`api.js`)**: A custom-built asynchronous layer that perfectly simulates a real REST API. It uses `Promises` and `setTimeout` to mimic network latency.
- **Mock JWT Authentication:** Simulates real-world JSON Web Token (JWT) security. The "server" generates base64-encoded tokens that authorize session states.
- **SaaS UI/UX:** Built from scratch without Tailwind or Bootstrap. Features a custom design system with Glassmorphism, Mesh Gradients, Floating Sidebars, and advanced micro-animations.

## 🛠️ How to Run Locally

Because this is a frontend-only application with a mock API, running it is incredibly simple:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/Hospital-Appointment-Booking-System.git
   ```
2. **Open `index.html`:**
   Simply double-click `index.html` to open it in your browser, OR use an extension like VS Code Live Server.
3. **Log in:**
   - You can register a new account, or use the default Admin account:
   - **Username:** `admin1`
   - **Password:** `admin123`

## 📁 Repository Structure

```text
/
├── assets/
│   ├── css/       # Premium SaaS Design System
│   ├── js/        # Mock API, Auth, and Dashboard logic
│   └── img/       # Assets and icons
├── docs/          # Traceability matrices and testing docs
├── index.html     # Landing Page
├── login.html     # Auth Pages
├── register.html
├── patient.html   # Dashboards
├── doctor.html
├── admin.html
└── README.md
```

## 📄 License
This project is open-source and available under the MIT License.
