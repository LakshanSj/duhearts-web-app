# 💕 DuoHearts

A real-time multiplayer game platform built for couples to play games, chat, and share memories together.

## Overview

DuoHearts is a modern web application that enables couples to connect and enjoy interactive gaming experiences. Players can pair up, challenge each other in classic games, engage in real-time chat, and build a shared gallery of photos and moments.

## 🎮 Features

### Games
- **Tic-Tac-Toe** - Classic strategy game
- **Rock-Paper-Scissors** - Quick head-to-head battles
- **SOS** - Word-building game
- **Number Guessing** - Prediction challenges

### Social Features
- **Real-Time Chat** - Global chat and in-game messaging
- **Partner Pairing** - Connect with your special someone
- **Shared Gallery** - Upload and view memories together
- **User Profiles** - Customizable display with photos

### Experience
- **Glass Morphism UI** - Modern, elegant design with glassmorphic effects
- **Dark/Light Themes** - Toggle between themes for comfortable viewing
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Real-Time Sync** - Instant updates across all players

## 🚀 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite |
| **Routing** | React Router v7 |
| **Backend** | Firebase (Auth, Firestore, Storage) |
| **Image Hosting** | Cloudinary |
| **UI Components** | Lucide React Icons |
| **Styling** | CSS3 with Glass Morphism |
| **Linting** | ESLint |

## 📋 Project Structure

```
src/
├── components/          # Reusable React components
│   ├── Gallery.jsx     # Photo gallery component
│   └── GlobalChat.jsx  # Chat interface
├── views/              # Page components
│   ├── Home.jsx        # Main hub with games & chat
│   ├── Game.jsx        # Active game board
│   ├── Room.jsx        # Game room interface
│   ├── Login.jsx       # Authentication
│   ├── Pairing.jsx     # Partner connection
│   └── Settings.jsx    # User preferences
├── services/           # API & logic layer
│   ├── userService.js  # User profile management
│   ├── roomService.js  # Game session management
│   └── cloudinary.js   # Image upload handling
├── hooks/              # Custom React hooks
│   └── useTheme.js     # Theme management
├── assets/             # Game images & media
├── firebase.js         # Firebase configuration
├── App.jsx             # Main app component
└── index.css           # Global styles
```

## 🛠️ Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn
- Firebase account
- Cloudinary account (for image uploads)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd duohearts
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Create a `.env` file in the root directory
   - Add your Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   The app will open at `http://localhost:5173`

## 📦 Available Scripts

```bash
# Start development server with HMR
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run ESLint checks
npm run lint
```

## 🎯 How It Works

### User Flow
1. **Sign In** - Authenticate using Firebase Auth
2. **Set Up Profile** - Add display name and profile photo
3. **Find Partner** - Search and pair with your partner
4. **Play & Connect** - Create game rooms and enjoy games together
5. **Share Moments** - Upload photos to your shared gallery

### Real-Time Architecture
- Firestore listeners sync game state changes instantly
- Messages appear in real-time for all participants
- Game updates broadcast to both players automatically
- Gallery images load dynamically from Cloudinary

## 🎨 Design System

The UI uses a modern glass morphism design:
- `--bg-primary` - Main background
- `--bg-secondary` - Secondary surfaces
- `--glass-bg` - Translucent glass effect
- `--glass-border` - Glass container borders
- `--text-main` - Primary text
- `--text-muted` - Secondary text
- Theme toggle available in Settings

## 🔒 Security

- Firebase Authentication for secure login
- Firestore security rules restrict access to authorized users
- Image uploads validated and stored securely via Cloudinary
- Real-time data synced through Firebase's auth-gated listeners

## 🐛 Troubleshooting

**Firebase connection issues?**
- Verify your Firebase credentials in `firebase.js`
- Check that Firestore is initialized in your Firebase project
- Ensure security rules allow read/write access

**Images not uploading?**
- Confirm Cloudinary credentials in environment variables
- Check browser console for upload errors
- Verify Cloudinary account has sufficient quota

**Game state not syncing?**
- Check browser network tab for real-time listener errors
- Verify Firestore database has game data
- Clear browser cache and reload

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## 🤝 Contributing

Contributions are welcome! Please ensure:
- All ESLint checks pass: `npm run lint`
- Code follows existing style conventions
- Components are properly documented

## 📄 License

This project is private and proprietary.

## 💬 Support

For issues, questions, or feature requests, please contact the development team.

---

**Built with ❤️ by the DuoHearts Team**
