# ✅ Setup Checklist

Use this checklist to verify Phase 1 Part 1 is complete.

## 📋 Pre-Setup

- [x] Supabase project created
- [x] Supabase credentials available
- [x] `@supabase/supabase-js` installed
- [x] Code files created

## 🔧 Your Setup Tasks

### 1. Environment Variables
- [ ] Create `.env.local` file
- [ ] Add `VITE_SUPABASE_URL`
- [ ] Add `VITE_SUPABASE_ANON_KEY`
- [ ] Restart dev server after creating

**Command:**
```bash
Copy-Item .env.example .env.local
```

### 2. Database Migration
- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Create new query
- [ ] Copy contents of `supabase/migrations/001_initial_schema.sql`
- [ ] Paste and run
- [ ] Verify "Success" message
- [ ] Check Table Editor for 3 tables:
  - [ ] `profiles`
  - [ ] `games`
  - [ ] `moves`

**URL:** https://supabase.com/dashboard/project/gelujyxnmoaxbjcphqzx/editor

### 3. Google Authentication
- [ ] Open Supabase Dashboard → Authentication → Providers
- [ ] Find "Google" in list
- [ ] Toggle it ON
- [ ] Save changes

**URL:** https://supabase.com/dashboard/project/gelujyxnmoaxbjcphqzx/auth/providers

### 4. Redirect URLs
- [ ] Open Authentication → URL Configuration
- [ ] Set Site URL to: `http://localhost:3001`
- [ ] Add Redirect URL: `http://localhost:3001/**`
- [ ] Save changes

**URL:** https://supabase.com/dashboard/project/gelujyxnmoaxbjcphqzx/auth/url-configuration

**Note:** Port is 3001 (not 5173) based on your dev server output.

## 🧪 Testing

### 5. Dev Server
- [x] Run `npm run dev`
- [x] Server started successfully
- [x] Running on http://localhost:3001

### 6. Login Screen
- [ ] Open http://localhost:3001 in browser
- [ ] See login screen (not error page)
- [ ] "Sign in with Google" button visible
- [ ] No console errors

### 7. Authentication Flow
- [ ] Click "Sign in with Google"
- [ ] Google OAuth popup appears
- [ ] Select Google account
- [ ] Grant permissions
- [ ] Redirected back to app
- [ ] See game board (not login screen)

### 8. Database Verification
- [ ] Open Supabase Dashboard → Table Editor → `profiles`
- [ ] See your profile row
- [ ] `display_name` matches your Google name
- [ ] `avatar_url` has your Google photo

**URL:** https://supabase.com/dashboard/project/gelujyxnmoaxbjcphqzx/editor

### 9. Browser Console
- [ ] Open DevTools (F12)
- [ ] Check Console tab
- [ ] No red errors
- [ ] Supabase connection successful

## ✅ Success Criteria

All of these should be true:
- ✅ `.env.local` exists with correct values
- ✅ 3 tables exist in Supabase
- ✅ Google auth is enabled
- ✅ Redirect URLs configured
- ✅ Dev server running on port 3001
- ✅ Login screen appears
- ✅ Google sign-in works
- ✅ Profile auto-created in database
- ✅ Game board visible after login
- ✅ No console errors

## 🐛 Troubleshooting

### Issue: "Missing Supabase environment variables"
**Cause:** `.env.local` doesn't exist or has wrong format
**Fix:** 
1. Create `.env.local` from `.env.example`
2. Ensure no spaces around `=`
3. Restart dev server (`Ctrl+C` then `npm run dev`)

### Issue: "Could not find table 'public.profiles'"
**Cause:** SQL migration not run
**Fix:**
1. Go to SQL Editor
2. Run `supabase/migrations/001_initial_schema.sql`
3. Check Table Editor for tables

### Issue: Login button does nothing
**Cause:** Redirect URLs not configured
**Fix:**
1. Go to Auth → URL Configuration
2. Set Site URL to `http://localhost:3001`
3. Add Redirect URL `http://localhost:3001/**`
4. Clear browser cookies and try again

### Issue: "Invalid redirect URL" error
**Cause:** Port mismatch or URL not in allowed list
**Fix:**
1. Check which port dev server is using (console output)
2. Update redirect URLs to match exact port
3. Ensure `/**` wildcard is included

### Issue: Profile not created after sign-in
**Cause:** Trigger not created or failed
**Fix:**
1. Check SQL Editor for errors
2. Manually verify trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
3. Re-run migration if needed

### Issue: TypeScript errors about `database.types`
**Cause:** TS server needs reload
**Fix:**
1. VS Code: `Ctrl+Shift+P`
2. Type "TypeScript: Restart TS Server"
3. Press Enter

## 📊 Current Status

**Completed:**
- ✅ Supabase SDK installed
- ✅ Database schema created
- ✅ Auth context implemented
- ✅ Login screen built
- ✅ App integration complete
- ✅ Documentation written

**Your Tasks:**
- ⏳ Create `.env.local`
- ⏳ Run SQL migration
- ⏳ Enable Google auth
- ⏳ Configure redirect URLs
- ⏳ Test login flow

**Estimated Time:** 5 minutes

## 🚀 After Completion

Once all checkboxes are ticked, you're ready for **Phase 1 Part 2**:
- Real-time game sessions
- Lobby system
- Multiplayer sync

See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for next steps.

---

**Need help?** See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed instructions.
