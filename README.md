<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 👑 Royal Grid Domination

A strategic multiplayer card game where you compete to dominate the grid. Place your cards wisely and outmaneuver your opponents in real-time!

## 🎮 Features

- **Multiplayer**: 2-4 players in real-time
- **Strategic Gameplay**: Capture opponent cards by placing higher values
- **Google Authentication**: Secure sign-in
- **Real-time Sync**: See moves instantly via Supabase
- **Responsive Design**: Play on desktop or mobile

## 🚀 Quick Start

**Prerequisites:** Node.js 16+

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase:**
   - Follow [QUICKSTART.md](QUICKSTART.md) for 5-minute setup
   - Or see [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed instructions

3. **Run the app:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   - Navigate to http://localhost:5173
   - Sign in with Google
   - Start playing!

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get up and running in 5 minutes
- **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** - Detailed Supabase configuration
- **[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)** - Full development roadmap

## 🏗️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth + Realtime Database)
- **Authentication**: Google OAuth via Supabase Auth

## 📦 Project Structure

```
Royal-Grid/
├── components/        # React components
├── hooks/            # Custom React hooks
├── lib/              # Core logic and services
│   ├── supabase.ts   # Supabase client
│   ├── auth-context.tsx  # Auth provider
│   └── database.types.ts # Type-safe DB schema
├── supabase/
│   └── migrations/   # Database schema
└── ai/               # Game AI logic
```

## 🎯 Current Status

**Phase 1 (Part 1): ✅ Complete**
- Authentication system
- Database schema
- Login screen

**Phase 1 (Part 2): 🚧 In Progress**
- Real-time game sessions
- Lobby system
- Move synchronization

See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for full roadmap.

## 🤝 Contributing

This is a learning project exploring real-time multiplayer game development with Supabase.

## 📄 License

MIT

---

View original AI Studio app: https://ai.studio/apps/drive/1QiVoHq9ir-k_r6D4S6LtbV86_8cEdZkP
