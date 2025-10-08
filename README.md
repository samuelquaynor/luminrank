# LuminRank

**Illuminate the Competition**

A modern, full-stack sports league management platform built with Angular and Supabase. Create leagues, track matches, manage standings, and compete with friends across multiple games.

## ✨ Features

### Phase 1: Core League Management ✅ COMPLETE
- 🏆 **Create & Manage Leagues** - Custom leagues for any game type
- 👥 **Member Management** - Invite via code or shareable link
- ⚙️ **Flexible Settings** - Customize scoring systems and rules
- 🔐 **Secure Access** - Row Level Security with proper permissions
- 📊 **Real-time Updates** - Instant sync across all members
- 🎨 **Modern UI** - Dark theme with beautiful, responsive design

### Coming Soon
- 📅 Phase 2: Match Management
- 📈 Phase 3: Standings & Statistics
- 🏅 Phase 4: Achievements & Rewards

## 🚀 Tech Stack

- **Frontend:** Angular 20 (Standalone Components, Zoneless, SSR)
- **State Management:** NgRx (Actions, Reducers, Effects, Selectors)
- **Backend:** Supabase (PostgreSQL, Auth, RLS, Real-time)
- **Testing:** Jasmine, Karma, Cypress, pgTAP
- **CI/CD:** GitHub Actions
- **Styling:** Custom CSS with modern design system

## 📁 Project Structure

```
src/app/
├── core/
│   ├── guards/           # Route protection (AuthGuard)
│   ├── models/           # TypeScript interfaces
│   ├── providers/        # DI providers (Supabase)
│   └── services/         # Core services (Storage)
├── features/
│   ├── auth/            # Authentication feature
│   │   ├── components/  # Login, Register
│   │   └── store/       # Auth NgRx store
│   └── leagues/         # League management feature
│       ├── components/  # League UI components
│       ├── models/      # League interfaces
│       ├── services/    # League, Member, Settings services
│       └── store/       # League NgRx store
├── pages/               # Page components
│   ├── auth/           # Auth page
│   ├── home/           # Home page
│   ├── leagues/        # League pages
│   └── profile-setup/  # Profile setup
└── shared/
    └── components/      # Reusable components (Header, LeagueCard)

supabase/
├── migrations/          # Database migrations
├── tests/              # pgTAP database tests
└── config.toml         # Supabase configuration

cypress/
├── e2e/                # E2E test suites
└── support/            # Custom commands

docs/                   # 📚 All documentation
```

## 🏁 Getting Started

### Prerequisites

- Node.js (v22 or higher)
- npm
- Docker (for local Supabase)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd luminrank
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Start Supabase (local development)**
   ```bash
   npx supabase start
   ```

5. **Start the development server**
   ```bash
   npm start
   ```

The application will be available at `http://localhost:4200`

## 🧪 Testing

### Quick Test Commands
```bash
# Unit tests (mocked, fast)
npm test -- --watch=false --exclude="**/*.integration.spec.ts"

# Integration tests (requires Supabase)
npm test -- --watch=false --include="**/*.integration.spec.ts"

# Database tests
npx supabase test db

# E2E tests
npx cypress run
```

### Test Coverage
- **Database Tests:** 16/16 ✅ (100%)
- **Unit Tests:** 94/94 ✅ (100%)
- **Integration Tests:** 14/14 ✅ (100%)
- **E2E Tests:** 22/22 ✅ (100%)

**Total: 146/146 tests passing (100%)** 🎉

## 📚 Documentation

All project documentation is in the [`docs/`](docs/) directory:

- **[Documentation Index](docs/README.md)** - Start here!
- **[Backend Logic Plan](docs/BACKEND_LOGIC_PLAN.md)** - Architecture overview
- **[Implementation Phases](docs/IMPLEMENTATION_PHASES.md)** - Development roadmap
- **[Phase 1 Complete](docs/PHASE1_COMPLETE.md)** - What's been built
- **[GitHub Actions Setup](docs/SETUP.md)** - CI/CD configuration
- **[Secrets Template](docs/SECRETS_TEMPLATE.md)** - Quick secrets reference

## 🚀 Deployment

### CI/CD Pipeline
- **Unit tests** run on every push/PR
- **Migrations** auto-deploy to production on `main` push
- See [docs/SETUP.md](docs/SETUP.md) for configuration

### Manual Deployment
```bash
# Link to your Supabase project
npx supabase link --project-ref <your-project-ref>

# Deploy migrations
npx supabase db push

# Build and deploy frontend (configure for your hosting)
npm run build
```

## 🎮 How It Works

### For League Creators
1. **Sign up** and complete your profile
2. **Create a league** with custom settings
3. **Share the invite link** with friends
4. **Manage settings** and members
5. **Track competition** (coming in Phase 2)

### For League Members
1. **Click an invite link** or enter invite code
2. **Auto-join** the league instantly
3. **View standings** and match history
4. **Compete** with other members

## 🏗️ Architecture Highlights

### Backend (Supabase)
- **PostgreSQL** with Row Level Security
- **Auto-generated** invite codes via triggers
- **Helper functions** to avoid RLS recursion
- **Comprehensive indexes** for performance

### Frontend (Angular)
- **Standalone components** for better tree-shaking
- **Zoneless change detection** for performance
- **Server-Side Rendering** for SEO
- **NgRx** for predictable state management

### Security
- Row Level Security on all tables
- Auth guards on protected routes
- Proper permission checks (creator/admin/member)
- Secure token storage and management

## 🎯 Current Status

**Phase 1: COMPLETE ✅**
- All core league features implemented
- 146/146 tests passing (100%) 🎉
- Production-ready with CI/CD
- Join-by-link feature bonus!

**Next: Phase 2 - Match Management**

## 📖 Learn More

Visit the [`docs/`](docs/) directory for comprehensive documentation:
- Architecture and design decisions
- Implementation phases and roadmap
- CI/CD setup instructions
- Testing strategies

## 🤝 Contributing

1. Read [`docs/IMPLEMENTATION_PHASES.md`](docs/IMPLEMENTATION_PHASES.md) to understand the roadmap
2. Create a feature branch from `dev`
3. Write tests for new functionality
4. Ensure all tests pass locally
5. Submit a PR to `dev` for review

## 📄 License

MIT License - See LICENSE file for details

---

**Built with ❤️ using Angular and Supabase**