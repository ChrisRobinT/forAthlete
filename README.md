# For4thlete

> Cross-platform mobile training app for runners and badminton players with AI-powered personalized training plans

[![React Native](https://img.shields.io/badge/React%20Native-0.72-blue)](https://reactnative.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Status](https://img.shields.io/badge/Status-In%20Development-yellow)](https://github.com/ChrisRobinT/forAthlete)

> ⚠️ **Note:** This project is currently in active development. Core features are functional, but the UI and some features are still being refined.

## 📱 Overview

Mobile training application designed for runners and badminton players, featuring AI-generated personalized training plans and adaptive workout adjustments based on daily recovery metrics. Used by 10+ athletes for training plan management.

## ✨ Features

- 🤖 **AI-Powered Training Plans** - Personalized, sport-specific plans generated using OpenAI GPT-4o
- 📊 **Recovery Tracking** - Monitor HRV, sleep quality, soreness, and energy levels
- 🎯 **Adaptive Workouts** - Training intensity automatically adjusts based on daily readiness
- 🏃 **Sport-Specific** - Tailored training for both running and badminton
- 📱 **Cross-Platform** - Single codebase for iOS and Android
- ⚡ **Real-Time Sync** - Workout data synchronized across devices

## 🛠️ Tech Stack

### Frontend
- **Framework:** React Native with TypeScript
- **State Management:** React Hooks (useState, useEffect, useContext)
- **Navigation:** React Navigation
- **UI Components:** Custom components with React Native styling

### Backend
- **Framework:** FastAPI (Python)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** JWT tokens with Supabase Auth
- **API Design:** RESTful endpoints with automatic documentation

### AI Integration
- **Model:** OpenAI GPT-4o & GPT-4o-mini
- **Use Case:** Training plan generation with custom prompt engineering
- **Input:** User goals, fitness level, sport type, available equipment
- **Output:** Structured weekly training plans with progressive overload

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- React Native CLI
- Python 3.10+
- iOS Simulator (Mac) or Android Studio
- Supabase account (for database)
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/ChrisRobinT/forAthlete.git
cd forAthlete

# Install mobile dependencies
npm install

# Install iOS dependencies (Mac only)
cd ios && pod install && cd ..

# Set up environment variables
cp .env.example .env
# Add your Supabase and OpenAI API keys to .env

# Backend setup
cd backend
pip install -r requirements.txt
```

### Running the App

```bash
# Start the backend server
cd backend
uvicorn main:app --reload

# In a new terminal, start React Native
# For iOS
npm run ios

# For Android
npm run android

# Or use Expo (if configured)
npx expo start
```

## 🎯 Key Features in Detail

### AI Training Plan Generation
- Analyzes user's current fitness level, goals, and schedule
- Generates sport-specific workouts (running intervals, badminton drills)
- Adapts to available equipment and training location
- Provides progressive overload for continuous improvement

### Recovery-Based Adaptation
- Daily check-ins for HRV, sleep quality, soreness, energy
- Algorithm calculates readiness score (0-100)
- Automatically adjusts workout intensity:
  - High readiness (80+): Full intensity training
  - Medium readiness (50-79): Moderate intensity
  - Low readiness (<50): Recovery/light session

### Sport-Specific Training
**Running:**
- Interval training, tempo runs, long runs
- Pace recommendations based on current fitness
-VO2 max estimation and tracking

**Badminton:**
- Court movement drills, smash practice, endurance
- Technical skill progressions
- Match simulation workouts

## 🏗️ Architecture

```
for4thlete/
├── mobile/                 # React Native app
│   ├── src/
│   │   ├── screens/       # App screens
│   │   ├── components/    # Reusable components
│   │   ├── navigation/    # Navigation setup
│   │   ├── api/          # API integration
│   │   └── utils/        # Helper functions
│   └── package.json
├── backend/               # FastAPI server
│   ├── main.py           # Entry point
│   ├── routers/          # API routes
│   ├── models/           # Database models
│   ├── services/         # Business logic
│   └── requirements.txt
└── README.md
```

## 🔄 API Endpoints

```
POST   /auth/register          # User registration
POST   /auth/login             # User login
GET    /workouts               # Get user's workouts
POST   /workouts/generate      # Generate AI training plan
POST   /workouts/complete      # Mark workout as complete
GET    /recovery               # Get recovery metrics
POST   /recovery               # Submit daily recovery data
PATCH  /workouts/{id}/adjust   # Adjust workout intensity
```

## 🧪 Testing

```bash
# Run mobile tests
npm test

# Run backend tests
cd backend
pytest
```

## 🎨 Design Philosophy

- **Mobile-First:** Optimized for on-the-go training management
- **Minimal UI:** Clean interface focused on essential information
- **Smart Defaults:** Sensible pre-fills to reduce user input
- **Adaptive:** Respects user's body signals, prevents overtraining

## 💡 Inspiration

Built by a competitive badminton player who struggled with:
- Generic training apps focused only on running
- Manual training plan creation (2+ hours per week)
- Lack of recovery-based workout adjustments
- Limited sport-specific guidance for racket sports

For4thlete solves these problems by combining AI-powered personalization with recovery science.

## 🚧 Current Status & Roadmap

**✅ Core Features Implemented:**
- AI training plan generation with OpenAI GPT-4o
- Recovery metrics tracking (HRV, sleep, soreness, energy)
- Adaptive workout algorithm
- Basic workout logging and history
- User authentication with Supabase

**🔄 In Active Development:**
- UI/UX refinements and polishing
- Enhanced workout visualization
- Improved onboarding flow
- Additional recovery insights

**📋 Planned Features:**
- Social features (share workouts with coach/team)
- Apple Health / Google Fit integration
- Advanced analytics dashboard
- Video exercise demonstrations
- Nutrition tracking
- Multi-sport support (tennis, squash)

## 👤 Author

**Chris-Robin Talts**
- Competitive badminton player (national level, Estonia & Netherlands)
- Computing Science student at Radboud University
- [GitHub](https://github.com/ChrisRobinT) | [LinkedIn](https://linkedin.com/in/chrisrobintalts)

## 📄 License

MIT License - Built as a personal project (2024)

## 🙏 Acknowledgments

- OpenAI for GPT-4o API
- Supabase for backend infrastructure
- React Native community for excellent tooling
- Fellow athletes who provided feedback and testing

---

⭐ If you find this project useful for your training, please give it a star!

## 📧 Contact

Have questions or want to contribute? Reach out at chrisrobin.talts@gmail.com
