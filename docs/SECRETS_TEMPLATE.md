# GitHub Secrets Configuration Template

Copy this template and fill in your actual values, then add them to GitHub repository secrets.

## Quick Setup Checklist

- [ ] Go to your GitHub repository
- [ ] Navigate to: **Settings** → **Secrets and variables** → **Actions**
- [ ] Click **"New repository secret"** for each secret below
- [ ] Copy the name exactly as shown (case-sensitive)
- [ ] Paste your value
- [ ] Click **"Add secret"**

## Required Secrets

### 1. NG_APP_SUPABASE_URL
```
Name: NG_APP_SUPABASE_URL
Value: https://YOUR_PROJECT_REF.supabase.co
```
**Where to find:**
- Supabase Dashboard → Your Project → Project Settings → API → Project URL

---

### 2. NG_APP_SUPABASE_ANON_KEY
```
Name: NG_APP_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Where to find:**
- Supabase Dashboard → Your Project → Project Settings → API → Project API keys → `anon` `public`
- This is a long JWT token starting with `eyJ...`

---

### 3. SUPABASE_PROJECT_REF
```
Name: SUPABASE_PROJECT_REF
Value: abcdefghijklmnop
```
**Where to find:**
- Supabase Dashboard → Your Project → Project Settings → General → Reference ID
- This is the part before `.supabase.co` in your project URL
- Example: If URL is `https://abc123xyz.supabase.co`, the ref is `abc123xyz`

---

### 4. SUPABASE_ACCESS_TOKEN
```
Name: SUPABASE_ACCESS_TOKEN
Value: sbp_...
```
**Where to find:**
- Go to: https://supabase.com/dashboard/account/tokens
- Click **"Generate new token"**
- Give it a name (e.g., "GitHub Actions")
- Copy the token immediately (you won't see it again!)
- Token starts with `sbp_`

---

## Verification

After adding all secrets, verify they're set correctly:

1. Go to: **Settings** → **Secrets and variables** → **Actions**
2. You should see 4 repository secrets:
   - ✅ `NG_APP_SUPABASE_URL`
   - ✅ `NG_APP_SUPABASE_ANON_KEY`
   - ✅ `SUPABASE_PROJECT_REF`
   - ✅ `SUPABASE_ACCESS_TOKEN`

3. Push a commit to trigger the workflow:
   ```bash
   git add .
   git commit -m "test: verify CI/CD pipeline"
   git push origin dev
   ```

4. Check workflow status:
   - Go to: **Actions** tab in your repository
   - You should see the "CI/CD Pipeline" workflow running
   - Unit tests should pass
   - Deployment only runs on `main` branch

## Security Notes

⚠️ **IMPORTANT:**
- Never commit these values to your repository
- Keep your `.env` file in `.gitignore`
- Rotate tokens periodically (every 90 days recommended)
- Use different projects for dev/staging/production
- The `SUPABASE_ACCESS_TOKEN` has admin access - keep it secure!

## Troubleshooting

### "Secret not found" error
- Check that secret names match exactly (case-sensitive)
- Verify you added them to the correct repository
- Secrets are not visible after creation (this is normal)

### Workflow not triggering
- Check that `.github/workflows/ci.yml` exists
- Verify workflow is enabled in Actions tab
- Check branch names match (`main` or `dev`)

### Deployment fails with "unauthorized"
- Verify `SUPABASE_ACCESS_TOKEN` is valid
- Check token hasn't expired
- Ensure token has necessary permissions

---

For more details, see `.github/SETUP.md`
