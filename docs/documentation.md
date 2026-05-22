

## Table of Contents

1. [Introduction](#introduction)

2. [System Architecture](#system-architecture)

3. [User Roles](#user-roles)

4. [Features](#features)

5. [Technical Implementation](#technical-implementation)

6. [Data Storage](#data-storage)

7. [Security](#security)

8. [User Interface](#user-interface)

9. [Deployment](#deployment)

10. [Maintenance](#maintenance)

  
## 1. Introduction

### 1.1 Purpose

The Hospital Website is a web-based application designed to streamline the appointment booking process between patients and healthcare providers. The system facilitates efficient management of medical appointments, patient records, and hospital resources.
### 1.2 Scope

- Patient appointment booking and management

- Doctor schedule management

- Medical records management

- User authentication and authorization

- Hospital department management

- Administrative controls

  

## 2. System Architecture

### 2.1 Technology Stack

- Frontend: HTML5, CSS3, JavaScript

- Data Storage: LocalStorage

- Icons: Font Awesome

- No external libraries or frameworks used

### 2.2 System Components

1. **Authentication Module**

   - Login system

   - Registration system

   - Role-based access control

2. **Patient Module**

   - Appointment booking

   - Medical records view

   - Profile management

3. **Doctor Module**

   - Schedule management

   - Patient records access

   - Prescription management

4. **Admin Module**

   - User management

   - Department management

   - System settings

  

## 3. User Roles

### 3.1 Patient

- Register and login

- Book appointments

- View medical history

- Manage profile

- View prescriptions

### 3.2 Doctor

- Manage appointments

- Access patient records

- Issue prescriptions

- Update profile

- View schedule

### 3.3 Administrator

- Manage users

- Manage departments

- Configure system settings

- Monitor appointments

- Generate reports

## 4. Features

### 4.1 Authentication System

```javascript

// Example of authentication check

function checkAuth() {

    const user = JSON.parse(localStorage.getItem('loggedInUser')); // correct key

    if (!user) {

        window.location.href = 'login.html';

    }

    return user;

}

```

  

### 4.2 Appointment Management

- Book new appointments

- Reschedule appointments

- Cancel appointments

- View appointment history

- Receive appointment reminders

  

### 4.3 Medical Records

- View medical history

- Access prescriptions

- Track appointments

- Update personal information

  

### 4.4 Doctor Features

- Manage daily schedule

- View patient list

- Issue prescriptions

- Update availability

  

### 4.5 Admin Features

- User management

- Department management

- System configuration

- Analytics and reporting

  

## 5. Technical Implementation

### 5.1 File Structure

```

hospital-appointment-system/    ← root (all files are flat)

├── index.html                  ← Home / landing page

├── login.html                  ← Login page

├── register.html               ← Registration page

├── patient.html                ← Patient dashboard

├── doctor.html                 ← Doctor dashboard

├── admin.html                  ← Admin dashboard

├── style.css                   ← Global stylesheet

├── utils.js                    ← Shared utilities (auth, storage, toast, hash)

├── login.js                    ← Login logic

├── register.js                 ← Registration logic

├── patient.js                  ← Patient dashboard logic

├── doctor.js                   ← Doctor dashboard logic

├── admin.js                    ← Admin dashboard logic

└── doctor.png                  ← Hero image

```

### 5.2 Key Functions

#### Authentication

```javascript

function login(email, password) {

    // Validate credentials

    // Set session

    // Redirect to appropriate dashboard

}

  

function register(userData) {

    // Validate user data

    // Create user account

    // Store in localStorage

}

```

  

#### Appointment Management

```javascript

function bookAppointment(appointmentData) {

    // Validate appointment

    // Check availability

    // Create appointment

    // Update schedules

}

```

  

## 6. Data Storage

  

### 6.1 LocalStorage Structure

```javascript

{

    "users": [

        {

            "id": "unique_id",

            "role": "patient|doctor|admin",

            "name": "User Name",

            "email": "user@email.com",

            "password": "hashed_password"

        }

    ],

    "appointments": [

        {

            "id": "unique_id",

            "patientId": "patient_id",

            "doctorId": "doctor_id",

            "date": "2024-03-20",

            "time": "10:00",

            "status": "scheduled|completed|cancelled"

        }

    ],

    "departments": [

        {

            "id": "unique_id",

            "name": "Department Name",

            "description": "Department Description"

        }

    ]

}

```


## 7. User Interface

  

### 7.1 Design Principles

- Clean and modern interface

- Responsive design

- Intuitive navigation

- Consistent styling

  

### 7.2 Components

- Navigation sidebar

- Dashboard cards

- Forms

- Tables

- Modals

- Notifications

  

## 8. Deployment

  

### 8.1 Requirements

- Web server

- Modern web browser

- JavaScript enabled

- LocalStorage support

  

### 8.2 Installation

1. Clone repository

2. Configure server

3. Deploy files

4. Test functionality

  

## 9. Maintenance

  

### 9.1 Regular Tasks

- Data backup

- Performance monitoring

- Security updates

- User feedback collection

  

### 9.2 Troubleshooting

- Common issues

- Error handling

- Debug procedures

- Support contact

  

## 10. Future Enhancements

  

### 10.1 Planned Features

1. Real-time notifications

2. Video consultations

3. Payment integration

4. Mobile application

5. Advanced analytics

  

### 10.2 Technical Improvements

1. Database integration

2. API development

3. Performance optimization

4. Enhanced security measures

  

## 11. About

  

### 11.1 Created By Students of Group (L)

- Mario Maged
- Mohammed Mohammed Atito
- Ibrahim Mohammed
- Abdelrahman Mohammed Hamdy


---

*This documentation is maintained by the AASTMT Students