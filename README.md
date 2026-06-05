# 🔐 VAULT - Secure Personal Data Dashboard

A modern, secure web application to manage personal, financial, card, and media records with end-to-end encryption and cloud backup.

## ✨ Features

- **🔒 Secure Authentication** - Google login via Firebase Auth
- **📊 Multi-Category Records** - Personal, Financial, Cards, Media, and more
- **☁️ Cloud Storage** - MongoDB Atlas for secure data persistence
- **🔐 User-Isolated Data** - Each user sees only their own encrypted records
- **⚡ Real-time Sync** - Instant updates across devices
- **🎨 Modern UI** - Responsive design with Tailwind CSS & animations
- **📱 Mobile Friendly** - Works seamlessly on desktop and mobile
- **🚀 Serverless Backend** - Express API on Vercel serverless functions

## 🛠️ Tech Stack

**Frontend:**
- React 19 with TypeScript
- Vite for fast bundling
- Tailwind CSS for styling
- Motion for animations
- Lucide React for icons

**Backend:**
- Express.js
- MongoDB with Mongoose
- Firebase Authentication
- Vercel Serverless Functions

**Infrastructure:**
- Firebase (Auth & Firestore config)
- MongoDB Atlas
- Vercel (Frontend & Backend hosting)
- GitHub (Version control)

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn
- Git

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/deeptimaan-k/VAULT.git
cd VAULT
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env.local
```

Update `.env.local` with:
```
MONGODB_URI=your_mongodb_connection_string
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. **Start the development server:**
```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

## 📦 Build & Deploy

### Local Build
```bash
npm run build
npm start
```

### Vercel Deployment
The app is automatically deployed on every push to the `main` branch.

**Live Application:**
- 🌐 Production: https://hii-sooty.vercel.app
- 📋 Deployment URL: https://hii-as8852l08-deeptimaank.vercel.app

## 🔐 Security Features

- **Firebase JWT Authentication** - Secure token-based auth
- **User Data Isolation** - MongoDB queries filtered by `userId`
- **HTTPS Only** - All data encrypted in transit
- **Server-side Validation** - Token verification on every API call
- **Environment Variables** - Sensitive data never committed

## 📝 Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm start         # Start production server
npm run preview   # Preview production build locally
npm run lint      # TypeScript type checking
npm run clean     # Remove build artifacts
```

## 📂 Project Structure

```
VAULT/
├── src/
│   ├── components/          # React components
│   ├── services/           # API services (dataService.ts)
│   ├── lib/                # Firebase setup
│   ├── App.tsx             # Main app component
│   └── index.css           # Global styles
├── api/
│   └── index.ts            # Express backend (Vercel functions)
├── firebase-applet-config.json  # Firebase configuration
├── vercel.json             # Vercel deployment config
├── package.json            # Dependencies
└── tsconfig.json           # TypeScript config
```

## 🔧 Configuration

### Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Google Authentication
4. Add authorized domains:
   - `localhost:5173` (development)
   - `hii-sooty.vercel.app` (production)
   - Your custom domain

### MongoDB Setup
1. Create cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create database user
3. Get connection string
4. Update `.env.local` with `MONGODB_URI`

## 🚢 API Endpoints

All endpoints require Firebase JWT token in `Authorization: Bearer <token>` header.

- `GET /api/mongodb/records` - Fetch all user records
- `POST /api/mongodb/records` - Create new record
- `PUT /api/mongodb/records/:id` - Update record
- `DELETE /api/mongodb/records/:id` - Delete record

## 🐛 Troubleshooting

### Login fails with "Popups disabled"
- Enable popups in browser settings
- Add domain to Firebase authorized domains
- Try opening in a new incognito tab

### Data not showing
- Ensure MongoDB connection string is correct
- Check Firebase authentication status
- Verify user is logged in

### Build errors
```bash
npm run clean
npm install
npm run build
```

## 📄 License

MIT License - Feel free to use this project for personal or commercial use.

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

## 📞 Support

For issues or questions, please open an [GitHub Issue](https://github.com/deeptimaan-k/VAULT/issues).

---

**Made with ❤️ by Radiant**
