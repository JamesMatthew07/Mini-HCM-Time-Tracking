# Mini HCM Time Tracking System

A lightweight Human Capital Management (HCM) Time-In/Time-Out system built with free tools: Firebase (Auth + Firestore), React.js, and Node.js/Express. The system records employee punches, computes worked hours, overtime (OT), night differential (ND), lateness, undertime, and maintains aggregated daily summaries.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🌟 Features

### User Features
- **Authentication**: Secure email/password authentication via Firebase
- **Time Tracking**: Easy punch in/out with real-time elapsed time display
- **Recent Activity**: View last 5 punch records with detailed metrics breakdown
- **Daily Summary**: See total hours worked for the current day
- **Automatic Calculations**: Real-time computation of:
  - Regular hours (up to scheduled shift)
  - Overtime (OT) - hours beyond shift
  - Night Differential (ND) - work between 22:00-06:00
  - Late arrivals (minutes after shift start)
  - Undertime (minutes before shift end)

### Admin Features
- **Punch Management**: View, edit, and delete employee punch records
- **Daily Reports**: Complete breakdown of all employees' daily metrics
- **Weekly Reports**: Aggregated weekly summaries for all employees
- **Employee Filtering**: Search and filter by employee name or date
- **Tab Navigation**: Easy switching between punches, daily, and weekly reports

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Node.js + Express
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Date/Time**: Moment.js with timezone support

## 📋 Prerequisites

- Node.js (v20.19+ or v22.12+)
- npm or yarn
- Firebase account (free tier)

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd "Mini HCM Time Tracking/timetracking"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Firebase Configuration

#### Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** (Email/Password provider)
4. Enable **Firestore Database**

#### Configure Firebase
Create a `src/firebase.js` file with your Firebase config:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### 4. Backend Configuration

Create a `backend/.env` file:
```env
PORT=5000
```

Create a `.env` file in the root (optional):
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
# ... other Firebase config
```

## 🎮 Usage

### Development Mode

**Start both frontend and backend servers:**
```bash
npm start
```

This will start:
- Backend API: `http://localhost:5000`
- Frontend: `http://localhost:5173` (or next available port)

**Or run servers separately:**
```bash
# Terminal 1 - Backend
npm run backend

# Terminal 2 - Frontend
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
timetracking/
├── backend/
│   ├── server.js              # Express server
│   ├── timeCalculator.js      # Time calculation logic
│   └── .env.example           # Backend environment template
├── src/
│   ├── components/
│   │   ├── admin/             # Admin dashboard components
│   │   │   ├── AdminDashboard.refactored.tsx
│   │   │   ├── PunchTable.tsx
│   │   │   ├── DailyReportTable.tsx
│   │   │   ├── WeeklyReportTable.tsx
│   │   │   ├── EditPunchModal.tsx
│   │   │   ├── SearchFilterBar.tsx
│   │   │   └── TabNavigation.tsx
│   │   ├── AuthForm.refactored.tsx
│   │   └── timeTracker.tsx
│   ├── hooks/
│   │   ├── useAdminDashboard.ts
│   │   └── useAuthForm.ts
│   ├── services/
│   │   ├── firebase.service.ts
│   │   └── api.service.ts
│   ├── utils/
│   │   ├── date.utils.ts
│   │   ├── validation.utils.ts
│   │   └── status.utils.ts
│   ├── types/
│   │   └── index.ts
│   ├── config/
│   │   └── constants.ts
│   ├── firebase.js
│   ├── App.tsx
│   └── main.tsx
└── package.json
```

## 🗄️ Firestore Database Structure

### Collections

#### `users`
```javascript
{
  userId: string,
  name: string,
  email: string,
  role: 'user' | 'admin' | 'employee',
  position: string,
  timezone: string,
  schedule: {
    start: "09:00",
    end: "18:00",
    timezone: "Asia/Manila"
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `attendance`
```javascript
{
  id: string,
  userId: string,
  userEmail: string,
  userName: string,
  punchIn: timestamp,
  punchOut: timestamp,
  date: "YYYY-MM-DD",
  duration: number,
  type: 'punch_in' | 'punch_out' | 'completed',
  metrics: {
    totalWorkedHours: string,
    regularHours: string,
    overtimeHours: string,
    nightDiffHours: string,
    lateMinutes: number,
    undertimeMinutes: number
  }
}
```

#### `dailySummary`
```javascript
{
  userId: string,
  date: "YYYY-MM-DD",
  totalWorkedHours: string,
  regularHours: string,
  overtimeHours: string,
  nightDiffHours: string,
  totalLateMinutes: number,
  totalUndertimeMinutes: number,
  createdAt: timestamp,
  lastUpdated: timestamp
}
```

## 🔐 User Roles

- **Employee/User**: Can punch in/out and view their own activity
- **Admin**: Can view all punches, daily/weekly reports, and edit/delete records

## 📊 Time Calculation Logic

The system calculates time metrics based on the user's schedule:

- **Regular Hours**: Time worked within the scheduled shift (e.g., 09:00-18:00)
- **Overtime**: Hours worked beyond the scheduled shift end time
- **Night Differential**: Hours worked between 22:00 and 06:00
- **Late**: Minutes arrived after scheduled shift start
- **Undertime**: Minutes left before scheduled shift end

### Example
```
Schedule: 09:00 - 18:00 (9 hours)
Punch In: 09:15 AM
Punch Out: 19:30 PM

Results:
- Regular Hours: 8.75h (09:15-18:00)
- Overtime: 1.5h (18:00-19:30)
- Night Differential: 0h (no work between 22:00-06:00)
- Late: 15 minutes (arrived at 09:15 instead of 09:00)
- Undertime: 0 minutes (worked past shift end)
```

## 🎨 UI Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Live elapsed time counter during active sessions
- **Color-coded Metrics**: Visual indicators for different time types
- **Sorting**: Latest punches appear first
- **Loading States**: Smooth loading indicators
- **Error Handling**: User-friendly error messages

## 🔧 API Endpoints

### `POST /api/calculate-time`
Calculate time metrics for a single punch record.

**Request:**
```json
{
  "punchIn": "2025-10-01T09:15:00Z",
  "punchOut": "2025-10-01T19:30:00Z",
  "schedule": {
    "start": "09:00",
    "end": "18:00",
    "timezone": "Asia/Manila"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalWorkedHours": "10.25",
    "regularHours": "8.75",
    "overtimeHours": "1.50",
    "nightDiffHours": "0.00",
    "lateMinutes": 15,
    "undertimeMinutes": 0
  }
}
```

### `GET /api/health`
Health check endpoint.

## 🐛 Troubleshooting

### Backend Connection Error
If you see `ERR_CONNECTION_REFUSED`:
```bash
# Make sure backend server is running
npm run backend
# Or use npm start to run both servers
```

### Firebase Authentication Error
1. Verify Firebase config in `src/firebase.js`
2. Enable Email/Password authentication in Firebase Console
3. Check Firebase project settings

### Date Issues
- Ensure timezone is set correctly in user schedule
- Check that `getTodayISO()` is being used for date formatting
- Verify Firestore date fields match YYYY-MM-DD format

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start both frontend and backend servers |
| `npm run dev` | Start frontend development server only |
| `npm run backend` | Start backend server only |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## 🚢 Deployment

### Frontend (Firebase Hosting)
```bash
npm run build
firebase deploy --only hosting
```

### Backend Options
1. **Vercel/Render/Railway**: Deploy Express app (free tiers available)
2. **Firebase Cloud Functions**: Convert to serverless functions (recommended)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

James Matthew Llanos

## 🙏 Acknowledgments

- Firebase for authentication and database
- React.js community
- Tailwind CSS
- Lucide React for icons
- Moment.js for timezone support

## 📞 Support

For issues, questions, or contributions, please open an issue in the repository.

---

**Built with ❤️ using free and open-source tools**
