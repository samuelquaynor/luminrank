# GitHub Actions Setup

This document describes how to set up the CI/CD pipeline for LuminRank.

## Required GitHub Secrets

To enable the CI/CD workflow, you need to configure the following secrets in your GitHub repository:

### Navigate to: Repository Settings → Secrets and variables → Actions → New repository secret

### Required Secrets:

1. **`NG_APP_SUPABASE_URL`**
   - Your Supabase project URL
   - Format: `https://your-project-ref.supabase.co`
   - Find it in: Supabase Dashboard → Project Settings → API

2. **`NG_APP_SUPABASE_ANON_KEY`**
   - Your Supabase anonymous/public key
   - Find it in: Supabase Dashboard → Project Settings → API → Project API keys → `anon` `public`

3. **`SUPABASE_PROJECT_REF`**
   - Your Supabase project reference ID
   - Format: `abcdefghijklmnop` (the part before `.supabase.co` in your URL)
   - Find it in: Supabase Dashboard → Project Settings → General → Reference ID

4. **`SUPABASE_ACCESS_TOKEN`**
   - Personal access token for Supabase CLI
   - Generate it at: https://supabase.com/dashboard/account/tokens
   - Click "Generate new token" and copy the token
   - **Important:** Save this token securely, you won't be able to see it again

## Workflow Overview

The CI/CD pipeline consists of 2 jobs:

### 1. Unit Tests
- Runs mocked unit tests (no database required)
- Fast feedback on code changes
- Runs on every push and PR
- Uses secrets for Supabase configuration

### 2. Deploy Supabase (Production Only)
- Only runs on `main` branch pushes
- Requires unit tests to pass first
- Deploys migrations to production Supabase project
- Verifies deployment success

## Local Development

### Running Tests Locally

```bash
# Unit tests (mocked, no database) - same as CI
npm test -- --watch=false --exclude="**/*.integration.spec.ts"

# Integration tests (requires Supabase running) - not in CI
npx supabase start
npm test -- --watch=false --include="**/*.integration.spec.ts"

# Database tests (requires Supabase running) - not in CI
npx supabase start
npx supabase test db

# E2E tests (requires app and Supabase running) - not in CI
npx supabase start
npm start  # In another terminal
npx cypress run
```

### Managing Migrations

```bash
# Create a new migration
npx supabase migration new <migration_name>

# Apply migrations locally
npx supabase db reset

# Deploy to production (after tests pass)
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

## Workflow Behavior

### On Push/PR to `dev` or `main`:
- ✅ Runs unit tests
- ⏭️ Skips database and integration tests (run locally)
- ⏭️ Skips deployment (only on `main` push)

### On Push to `main`:
- ✅ Runs unit tests
- ✅ Deploys migrations to production (if tests pass)

## Troubleshooting

### "localStorage is not defined" errors in logs
These are SSR-related warnings and don't affect functionality. The StorageService handles SSR correctly by checking for browser environment.

### Unit tests failing in CI
- Verify secrets are set correctly in GitHub repository settings
- Check that environment variables match the secret names (`NG_APP_SUPABASE_URL`, `NG_APP_SUPABASE_ANON_KEY`)
- Review test output in GitHub Actions logs

### Deployment fails
- Verify all secrets are set correctly in GitHub
- Ensure `SUPABASE_ACCESS_TOKEN` has correct permissions
- Check that migrations are compatible with production database
- Review Supabase logs in the dashboard
- Test migrations locally first: `npx supabase db push --dry-run`

## Branch Strategy

- **`main`**: Production branch - triggers deployment
- **`dev`**: Development branch - runs tests only
- **Feature branches**: Create PRs to `dev` for review

## Security Notes

- Never commit `.env` files or secrets
- Rotate access tokens periodically
- Use different Supabase projects for dev/staging/prod
- Review migration changes carefully before merging to `main`
