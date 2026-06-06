# CoolStay - PG & Hostel Management System

CoolStay is a full-stack, secure, mobile-friendly PG & Hostel Management System built with **React.js (Vite)**, **Tailwind CSS v4**, **Node.js**, **Express.js**, and **MongoDB**. It features role-based access control for both Management (Admin) and Residents (Tenants).

---

## ⚡ Quick Start (Running Locally)

### 1. Database Configuration
CoolStay runs on **MongoDB**. If you do not have MongoDB running locally, the fastest way to get started is by using a free MongoDB Atlas cloud cluster:
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/).
2. Click **Connect** on your cluster, select **Drivers**, and copy the connection string.
3. Replace the `MONGO_URI` connection string in [server/.env](file:///c:/Users/kusha/OneDrive/Documents/coolstay/server/.env) with your credentials:
   ```env
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/coolstay?retryWrites=true&w=majority
   ```
*(Note: Replace `<password>` with your database user password).*

### 2. Seeding Sample Data
Once the database URI is updated in `.env`, run the seeding command in the `server/` directory:
```bash
cd server
npm run seed
```
This will clear the database and populate default admin and tenant records.

### 3. Running Servers
Start the backend server (mapped to port `5000` with hot-reloading):
```bash
cd server
npm run dev
```

In a separate terminal, start the frontend Vite server (runs on port `3000`):
```bash
cd client
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Default Seed Credentials

### 1. Management (Admin Portal)
* **Email:** `admin@coolstay.com`
* **Password:** `admin123`
* **Features:** Add/edit/delete rooms, assign residents, update payment statuses, record transactions, trigger WhatsApp direct reminders, check in/out visitors, and review reports.

### 2. Resident (Tenant Portal)
* **Email:** `john@gmail.com`
* **Password:** `tenant123`
* **Features:** View roommates, check rent billing logs, pay simulated UPI invoices, raise service tickets, and pre-register visitor check-ins.

---

## 📂 Project Architecture

```
coolstay/
├── client/                      # Frontend Application (Vite + React)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx       # Top header panel (Theme, Profile)
│   │   │   ├── Layout.jsx       # Main layout wrapper
│   │   │   ├── Modal.jsx        # Reusable glassmorphic modal
│   │   │   ├── Sidebar.jsx      # Navigation sidebar (Role-adaptive)
│   │   │   └── StatCard.jsx     # Responsive dashboard KPI card
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Global auth state, theme, and toast engine
│   │   ├── pages/
│   │   │   ├── Complaints.jsx   # Raise & resolve tickets
│   │   │   ├── Dashboard.jsx    # Dual-role dashboards
│   │   │   ├── Login.jsx        # Login & password recovery panels
│   │   │   ├── Rent.jsx         # Invoices list, pay online, WhatsApp reminders
│   │   │   ├── Reports.jsx      # Analytics graphs (SVG-based)
│   │   │   ├── Rooms.jsx        # Room & bed capacity configurations
│   │   │   └── Visitors.jsx     # Pre-register guest logs & checkout
│   │   ├── App.jsx              # Secured routing paths
│   │   ├── index.css            # Tailwind CSS v4 base stylesheet
│   │   └── main.jsx             # React DOM mount point
│   ├── index.html               # Main HTML viewport & font config
│   ├── package.json             # Frontend dependencies
│   └── vite.config.js           # Vite and Tailwind v4 config + proxies
│
└── server/                      # Backend Server (Node.js + Express.js)
    ├── config/
    │   └── db.js                # Mongoose database connection
    ├── middleware/
    │   ├── auth.js              # JWT authorization & role middleware
    │   └── upload.js            # Multer dossier file upload handler
    ├── models/                  # Mongoose MongoDB schemas
    │   ├── Complaint.js         
    │   ├── Payment.js           
    │   ├── Room.js              
    │   ├── Tenant.js            
    │   ├── User.js              
    │   └── Visitor.js           
    ├── routes/                  # Express REST API endpoints
    │   ├── auth.js              
    │   ├── complaints.js        
    │   ├── dashboard.js         
    │   ├── payments.js          
    │   ├── rooms.js             
    │   ├── tenants.js           
    │   └── visitors.js          
    ├── scripts/
    │   └── seed.js              # Database seed command
    ├── services/
    │   └── whatsapp.js          # Twilio & click-to-chat WhatsApp service
    ├── uploads/                 # Static asset storage for photos & ID cards
    ├── .env                     # App configurations (ports, keys)
    ├── package.json             # Backend dependencies
    └── server.js                # Express entrypoint pipeline
```

---

## 🚀 WhatsApp Notifications Engine
A dedicated service file (`server/services/whatsapp.js`) manages reminders:
1. **Twilio API integration**: Configured through `.env` parameters:
   * `TWILIO_ACCOUNT_SID`
   * `TWILIO_AUTH_TOKEN`
   * `TWILIO_WHATSAPP_NUMBER`
2. **Direct Web Link Fallback**: If Twilio credentials are not configured, clicking the "WhatsApp" reminder button next to an unpaid invoice in the Admin Dashboard automatically copies a custom pre-formatted message (Tenant name, billing month, rent amount, due date) and opens a new browser window redirecting to **WhatsApp Web** (`https://wa.me/phone?text=...`) for instant sending.

---

## 📈 SVG Analytics Graphs
To prevent dependency failures on local builds, the **Reports** section employs custom-calculated **SVG bar charts** that scale dynamically to represent:
- Expected rent invoiced vs. actual collected collections over the last 6 months.
- Bed occupancy rates and vacancy stats.
- Active resident distributions across PG building floors.
