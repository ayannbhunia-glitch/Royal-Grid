# 🚀 Supabase Setup Guide - Royal Grid Domination

This guide will walk you through setting up Supabase for Phase 1 (Multiplayer Foundation).

## 📋 Prerequisites

- ✅ Supabase project created
- ✅ Supabase credentials available
- ✅ `@supabase/supabase-js` installed

## 🔧 Step 1: Create Environment Variables

Create a `.env.local` file in the project root:

```bash
VITE_SUPABASE_URL=https://gelujyxnmoaxbjcphqzx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlbHVqeXhubW9heGJqY3BocXp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3ODA5ODgsImV4cCI6MjA3NzM1Njk4OH0.zERtANNKlQOKUkvE8FAg7K52DkgQKFgfF3dSF0jdUbo
```

**Note:** `.env.local` is gitignored. The example file `.env.example` is provided for reference.

## 🗄️ Step 2: Run Database Migration

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/gelujyxnmoaxbjcphqzx
   - Navigate to **SQL Editor** (left sidebar)

2. **Copy Migration SQL**
   - Open `supabase/migrations/001_initial_schema.sql`
   - Copy the entire contents

3. **Execute Migration**
   - Paste into SQL Editor
   - Click **Run** (or press Ctrl+Enter)
   - Wait for "Success" message

4. **Verify Tables Created**
   - Go to **Table Editor** (left sidebar)
   - You should see 3 new tables:
     - ✅ `profiles` - User profiles and stats
     - ✅ `games` - Game sessions and state
     - ✅ `moves` - Move history (optional)

## 🔐 Step 3: Enable Google Authentication

1. **Navigate to Authentication Settings**
   - Dashboard → **Authentication** → **Providers**

2. **Enable Google Provider**
   - Find "Google" in the list
   - Toggle **Enable Sign in with Google**

3. **Configure OAuth Credentials**
   
   **Option A: Use Supabase's OAuth (Quick Start)**
   - No additional setup needed
   - Supabase provides default OAuth credentials for development
   
   **Option B: Use Your Own Google OAuth (Production)**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project (or select existing)
   - Enable **Google+ API**
   - Create **OAuth 2.0 Client ID** credentials
   - Add authorized redirect URIs:
     ```
     https://gelujyxnmoaxbjcphqzx.supabase.co/auth/v1/callback
     http://localhost:5173/
     ```
   - Copy **Client ID** and **Client Secret** to Supabase

4. **Configure Redirect URLs**
   - Dashboard → **Authentication** → **URL Configuration**
   - Add your site URL:
     ```
     http://localhost:5173
     ```
   - Add redirect URLs (for production later):
     ```
     https://your-domain.com
     ```

5. **Save Changes**

## 🧪 Step 4: Test the Setup

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Open Browser**
   - Navigate to `http://localhost:5173`
   - You should see the **Login Screen**

3. **Test Google Sign-In**
   - Click "Sign in with Google"
   - Complete Google OAuth flow
   - You should be redirected back to the app
   - Check browser console for any errors

4. **Verify Profile Created**
   - Go to Supabase Dashboard → **Table Editor** → `profiles`
   - You should see your profile row created automatically

## ✅ Verification Checklist

- [ ] `.env.local` file created with correct credentials
- [ ] Database migration executed successfully
- [ ] All 3 tables visible in Table Editor
- [ ] Google Auth provider enabled
- [ ] OAuth redirect URLs configured
- [ ] App shows login screen
- [ ] Google sign-in works
- [ ] Profile auto-created in database

## 🐛 Troubleshooting

### Issue: "Missing Supabase environment variables"
**Solution:** Ensure `.env.local` exists and contains both variables. Restart dev server.

### Issue: "Could not find the table 'public.profiles'"
**Solution:** Run the migration SQL in Supabase SQL Editor.

### Issue: Google sign-in redirects but doesn't authenticate
**Solution:** 
- Check redirect URLs in Supabase Auth settings
- Ensure `http://localhost:5173` is in the allowed list
- Clear browser cookies and try again

### Issue: "Invalid redirect URL"
**Solution:** Add your current URL to Site URL in Auth settings.

### Issue: Profile not created after sign-in
**Solution:** 
- Check if the `on_auth_user_created` trigger exists
- Manually verify in SQL Editor:
  ```sql
  SELECT * FROM auth.users;
  SELECT * FROM public.profiles;
  ```

## 📊 Database Schema Overview

### `profiles` Table
- Extends `auth.users` with game-specific data
- Stores: display name, avatar, stats (wins/losses/elo)
- Auto-created via trigger on user signup

### `games` Table
- Stores game sessions
- Fields: status, players (JSONB), state (JSONB), timestamps
- Each game has a unique `share_code` for invites

### `moves` Table
- Optional detailed move history
- Used for replay/analytics
- Links to game and player

## 🔒 Row Level Security (RLS)

All tables have RLS enabled:
- **profiles**: Public read, users can update their own
- **games**: Authenticated users can read, players can update their games
- **moves**: Players can read/write moves for their games

## 🎯 Next Steps (Phase 1 Continued)

Once setup is complete, we'll implement:
1. ✅ Authentication (DONE)
2. ⏳ Real-time game sessions (create/join)
3. ⏳ Move submission API
4. ⏳ Client-side state sync

## 📚 Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime](https://supabase.com/docs/guides/realtime)

---

**Need Help?** Check the Supabase Dashboard logs or browser console for detailed error messages.
