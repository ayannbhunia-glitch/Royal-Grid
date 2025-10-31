# ⚡ Quick Start - Get Multiplayer Running

## 🎯 Goal
Get authentication working and see the login screen in 5 minutes.

## 📝 Steps

### 1. Create Environment File (30 seconds)

Copy `.env.example` to `.env.local`:

```bash
# PowerShell
Copy-Item .env.example .env.local

# Or manually create .env.local with:
VITE_SUPABASE_URL=https://gelujyxnmoaxbjcphqzx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlbHVqeXhubW9heGJqY3BocXp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3ODA5ODgsImV4cCI6MjA3NzM1Njk4OH0.zERtANNKlQOKUkvE8FAg7K52DkgQKFgfF3dSF0jdUbo
```

### 2. Run Database Migration (2 minutes)

1. Open: https://supabase.com/dashboard/project/gelujyxnmoaxbjcphqzx/editor
2. Click **SQL Editor** in left sidebar
3. Click **New Query**
4. Copy entire contents of `supabase/migrations/001_initial_schema.sql`
5. Paste and click **Run** (or Ctrl+Enter)
6. Wait for "Success. No rows returned"

### 3. Enable Google Auth (1 minute)

1. Go to: https://supabase.com/dashboard/project/gelujyxnmoaxbjcphqzx/auth/providers
2. Find **Google** in the list
3. Toggle it **ON** (use Supabase's default OAuth for now)
4. Scroll down and click **Save**

### 4. Configure Redirect URLs (1 minute)

1. Go to: https://supabase.com/dashboard/project/gelujyxnmoaxbjcphqzx/auth/url-configuration
2. Set **Site URL** to: `http://localhost:5173`
3. Add to **Redirect URLs**: `http://localhost:5173/**`
4. Click **Save**

### 5. Start Dev Server (30 seconds)

```bash
npm run dev
```

### 6. Test! (30 seconds)

1. Open browser: http://localhost:5173
2. You should see a beautiful login screen
3. Click "Sign in with Google"
4. Complete OAuth flow
5. You should be redirected back and see the game!

## ✅ Success Checklist

- [ ] `.env.local` file exists
- [ ] SQL migration ran successfully (check Table Editor for `profiles`, `games`, `moves` tables)
- [ ] Google auth is enabled
- [ ] Redirect URLs configured
- [ ] Dev server running
- [ ] Login screen appears
- [ ] Google sign-in works
- [ ] After login, you see the game board

## 🐛 Common Issues

**"Missing Supabase environment variables"**
→ Create `.env.local` file and restart dev server

**Login button does nothing**
→ Check browser console for errors. Likely redirect URL issue.

**"Could not find table 'public.profiles'"**
→ Run the SQL migration in Supabase Dashboard

**TypeScript errors about `database.types`**
→ Restart TypeScript server (VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server")

## 🎉 What You've Achieved

- ✅ Supabase backend connected
- ✅ Database schema created
- ✅ Google authentication working
- ✅ User profiles auto-created
- ✅ App gated to authenticated users only

## 🚀 Next Steps

Once login is working, we'll implement:
1. Game creation (create a new multiplayer session)
2. Game joining (join via share link)
3. Real-time sync (see other players' moves live)
4. Lobby system (dashboard to manage games)

See `IMPLEMENTATION_PLAN.md` for the full roadmap.

---

**Need detailed instructions?** See `SUPABASE_SETUP.md`
