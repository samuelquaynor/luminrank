# LuminRank Implementation Phases

## Overview

Each phase delivers a complete end-to-end feature with database, backend services, store, UI, and tests. Every phase is a fully functional increment that users can interact with.

---

## Phase 1: Core League Management (Complete E2E)

**Goal**: Users can create leagues, invite members, and manage basic settings through a complete UI

### Backend
**Database:**
- ✅ `leagues` table
- ✅ `league_settings` table
- ✅ `league_members` table
- ✅ `league_invites` table
- ✅ Auto-generate invite codes trigger
- ✅ RLS policies

**Services:**
- ✅ LeagueService (CRUD, join, leave)
- ✅ MemberService (view, add, remove members)
- ✅ LeagueSettingsService (view, update settings)

**Store:**
- ✅ Actions, reducer, effects, selectors

**Tests:**
- ✅ 38 unit tests (services + store)

### Frontend (To Do)
**Pages:**
- `leagues/leagues-list.component` - Dashboard showing user's leagues
  - Grid of league cards
  - "Create League" and "Join League" buttons
  - Empty state for no leagues
- `leagues/create-league.component` - League creation form
  - Name, description, game type inputs
  - Privacy toggle
  - Basic settings (scoring system, points)
  - Submit button
- `leagues/join-league.component` - Join via code
  - Input for invite code
  - Preview league details
  - Confirm join button
- `leagues/league-detail.component` - Single league view
  - League header with name, game type, invite code
  - Members list with roles
  - Settings panel (editable by creator/admin)
  - Leave league button

**Shared Components:**
- `league-card.component` - League preview card
  - League name, game type
  - Member count
  - Creator name
  - Click to view details

**Routing:**
```typescript
{
  path: 'leagues',
  canActivate: [AuthGuard],
  children: [
    { path: '', component: LeaguesListComponent },
    { path: 'create', component: CreateLeagueComponent },
    { path: 'join', component: JoinLeagueComponent },
    { path: ':id', component: LeagueDetailComponent }
  ]
}
```

**E2E Tests (Cypress):**
1. Create league flow
2. Join league via code
3. View league details and members

### Deliverable
✅ Complete league management system - users can create, join, and manage leagues with full UI

---

## Phase 2: Match Recording & Leaderboard (Complete E2E)

**Goal**: Users can record ad-hoc matches and see live leaderboards

### Backend
**Database:**
- `matches` table (simplified: no legs, no fixtures, no disputes)
- `match_participants` table
- `calculate_league_standings()` function

**Services:**
- `match.service.ts` - Record ad-hoc matches
- `leaderboard.service.ts` - Calculate standings

**Store:**
- Match actions, reducer, effects, selectors
- Leaderboard actions, reducer, effects, selectors

**Tests:**
- Unit tests for match recording
- Unit tests for standings calculation

### Frontend
**Pages:**
- `matches/record-match.component` - Match recording form
  - Select opponent from league members
  - Enter scores for each player
  - Match date picker
  - Submit button
- Update `league-detail.component` - Add tabs
  - Tab 1: Leaderboard
  - Tab 2: Matches
  - Tab 3: Members
  - "Record Match" button

**Shared Components:**
- `leaderboard.component` - Rankings display
  - Table: rank, player, played, won, lost, points
  - Highlight current user
  - Trophy icons for top 3
- `match-card.component` - Match result display
  - Participants and scores
  - Date/time
  - Result indicator (win/loss)

**E2E Tests (Cypress):**
1. Record match flow
2. View leaderboard updates
3. View match history

### Deliverable
✅ Functional league with match tracking and live leaderboard

**MVP Milestone**: Phase 1 + Phase 2 = Minimum Viable Product
- Users can create leagues, invite friends, record matches, and see standings
- Complete UI for all features
- This is enough to launch and gather user feedback

---

## Phase 3: Fixtures & Scheduling (Complete E2E)

**Goal**: Automated fixture generation with submission windows and calendar view

### Backend
**Database:**
- `fixtures` table
- `seasons` table
- Update `matches` table (add `fixture_id`, `season_id`)
- `calculate_submission_deadline()` function
- `check_submission_window()` function
- Submission window validation triggers

**Services:**
- `fixture.service.ts` - Round-robin generation
- `season.service.ts` - Season management
- Update `match.service.ts` - Link to fixtures

**Store:**
- Fixture actions, reducer, effects, selectors
- Season actions, reducer, effects, selectors

**Tests:**
- Unit tests for round-robin algorithm
- Unit tests for submission window validation

### Frontend
**Pages:**
- `seasons/season-management.component` - Season admin
  - List of seasons (past, current, upcoming)
  - Create new season button
  - Start/end season actions
- `fixtures/fixtures-list.component` - Fixture schedule
  - Calendar view toggle
  - List view with round grouping
  - Filter by status (upcoming, completed, overdue)
  - "Record Result" button per fixture
- `fixtures/generate-fixtures.component` - Fixture wizard
  - Select season
  - Round-robin settings
  - Start date and frequency
  - Preview and confirm
- Update `league-detail.component` - Add Fixtures tab

**Shared Components:**
- `fixture-card.component` - Single fixture display
  - Participants (home vs away)
  - Scheduled date and deadline
  - Status badge
  - "Record Result" button
- `fixtures-calendar.component` - Calendar view
  - Month/week view
  - Color-coded by status
- `season-selector.component` - Season dropdown
  - Switch between seasons
  - "All time" option

**E2E Tests (Cypress):**
1. Generate fixtures flow
2. Record result within window
3. Fixture becomes overdue

### Deliverable
✅ Structured leagues with automated scheduling and calendar interface

---

## Phase 4: Match Confirmation & Disputes (Complete E2E)

**Goal**: Add verification layer with peer resolution UI

### Backend
**Database:**
- `match_disputes` table
- Update `matches` table (add dispute fields)
- Dispute resolution functions

**Services:**
- `dispute.service.ts` - Create and resolve disputes
- Update `match.service.ts` - Confirmation flow

**Store:**
- Dispute actions, reducer, effects, selectors

**Tests:**
- Unit tests for dispute workflows

### Frontend
**Pages:**
- `disputes/disputes-list.component` - Pending disputes
  - List of disputed matches
  - Action buttons
- `matches/match-detail.component` - Single match view
  - Match details
  - Dispute button
  - Dispute resolution UI

**Shared Components:**
- `dispute-dialog.component` - Dispute form
  - Reason textarea
  - Proposed score corrections
  - Submit button
- `resolve-dispute-dialog.component` - Resolution UI
  - View dispute reason
  - Accept/reject/modify buttons
  - New score inputs
- Update `match-card.component` - Add dispute badge

**E2E Tests (Cypress):**
1. Dispute match flow
2. Resolve dispute (accept)
3. Resolve dispute (modify)

### Deliverable
✅ Trust & verify system with complete dispute resolution UI

---

## Phase 5: Forfeits & Auto-Management (Complete E2E)

**Goal**: Automated enforcement with admin dashboard

### Backend
**Database:**
- Add forfeit fields to fixtures/matches
- `apply_forfeit_penalty()` function
- Scheduled job for auto-forfeits

**Services:**
- `forfeit.service.ts` - Manual and auto-forfeit
- Scheduled job service

**Store:**
- Forfeit actions, reducer, effects

**Tests:**
- Unit tests for forfeit logic

### Frontend
**Pages:**
- `admin/league-admin.component` - Admin dashboard
  - Overdue fixtures list
  - Forfeit management
  - Player activity monitoring
- Update `league-detail.component` - Add Admin tab (creator only)

**Shared Components:**
- `forfeit-dialog.component` - Manual forfeit form
  - Confirmation dialog
  - Reason input
- `overdue-fixtures-list.component` - Overdue fixtures
  - List with auto-forfeit status
  - Manual intervention options
- Update `fixture-card.component` - Add forfeit button

**E2E Tests (Cypress):**
1. Manual forfeit flow
2. Auto-forfeit simulation
3. Player leaving league

### Deliverable
✅ Self-managing leagues with automated enforcement and admin tools

---

## Phase 6: Match Legs (Best-of-X) (Complete E2E)

**Goal**: Support multi-game matches with progress tracking

### Backend
**Database:**
- `match_legs` table
- `match_leg_participants` table
- Update `matches` and `match_participants` tables
- `calculate_match_winner_from_legs()` function
- `on_leg_completed` trigger

**Services:**
- `match-legs.service.ts` - Leg recording and winner calculation
- Update `match.service.ts` - Create with legs

**Store:**
- Match legs actions, reducer, effects, selectors

**Tests:**
- Unit tests for leg winner calculation
- Test best-of-3, best-of-5 scenarios

### Frontend
**Pages:**
- `matches/record-leg.component` - Record individual leg
  - Leg number indicator
  - Score inputs
  - Current match score display
  - Submit button
- Update `match-detail.component` - Show leg breakdown
  - List of completed legs
  - Current match score
  - Next leg button

**Shared Components:**
- `match-progress.component` - Match score tracker
  - Visual progress (e.g., "Player A: 2 - Player B: 1")
  - Leg-by-leg results
  - Win indicator
- Update `league-detail.component` - Add legs toggle in settings

**E2E Tests (Cypress):**
1. Record multi-leg match
2. Early termination (2-0 in best of 3)
3. Full match (2-1 in best of 3)

### Deliverable
✅ Support for best-of-X matches with complete UI

**Note**: This phase is optional for initial launch

---

## Phase 7: Real-time Updates (Complete E2E)

**Goal**: Live updates and notifications

### Backend
**Services:**
- Real-time subscription service
- Notification service
- Statistics service (form, streaks, head-to-head)

**Store:**
- Real-time effects for auto-updates

**Tests:**
- Integration tests for real-time updates

### Frontend
**Components:**
- Update `leaderboard.component` - Add real-time indicator
  - "Live" badge
  - Smooth animations for rank changes
- `notifications-panel.component` - Notification center
  - Match recorded notifications
  - Dispute notifications
  - Fixture reminders
- Update `league-detail.component` - Add Statistics tab
  - Form (last 5 matches)
  - Win streaks
  - Head-to-head records

**Features:**
- Live leaderboard updates
- Push notifications for matches
- Season archives
- Advanced statistics

**E2E Tests (Cypress):**
1. Real-time leaderboard update
2. Notification delivery
3. View historical seasons

### Deliverable
✅ Live, interactive platform with notifications

---

## Phase 8: Polish & Production Ready

**Goal**: Final polish and production deployment

### Frontend Polish
- Loading states and skeletons
- Error handling and user feedback
- Animations and transitions
- Mobile responsiveness refinement
- Dark theme consistency
- Accessibility (a11y) improvements

### Performance
- Lazy loading optimization
- Image optimization
- Bundle size reduction
- Query optimization

### Testing
- Visual regression testing
- Cross-browser testing
- Mobile device testing
- Load testing

### Documentation
- User guide
- API documentation
- Deployment guide

### Deliverable
✅ Production-ready application

---

## Phase Dependencies

```
Phase 1: Core League Management (E2E)
    ↓
Phase 2: Match Recording & Leaderboard (E2E)
    ↓ (MVP complete - can launch here)
Phase 3: Fixtures & Scheduling (E2E)
    ↓
Phase 4: Disputes (E2E) ←→ Phase 5: Forfeits (E2E) (can be parallel)
    ↓
Phase 6: Match Legs (E2E) (optional)
    ↓
Phase 7: Real-time (E2E)
    ↓
Phase 8: Polish & Production
```

## Current Status

### Phase 1: Core League Management
**Backend**: ✅ Complete (94 tests passing)
**Frontend**: ⏳ To Do
**Status**: 50% Complete

---

## What to Build Next

**Option A: Complete Phase 1 (Recommended)**
- Build UI for league management
- Users can interact with leagues
- Complete the first full feature

**Option B: Move to Phase 2 Backend**
- Build match recording backend
- Come back to UI later
- Faster backend progress

**Recommendation**: Complete Phase 1 UI first so you have a fully working feature to test and iterate on.

---

## Success Criteria Per Phase

### Phase 1 (Complete E2E)
- [x] User can create a league (backend)
- [x] User can join via invite code (backend)
- [x] User can view league members (backend)
- [ ] User can create league through UI
- [ ] User can see their leagues in a dashboard
- [ ] User can share invite code from UI
- [ ] Another user can join through UI
- [ ] User can view and edit settings through UI

### Phase 2 (Complete E2E)
- [ ] User can record match (backend + UI)
- [ ] Leaderboard updates automatically (backend + UI)
- [ ] User can view match history (UI)
- [ ] Leaderboard displays correctly (UI)

### Phase 3 (Complete E2E)
- [ ] User can create season (backend + UI)
- [ ] System generates fixtures (backend + UI)
- [ ] User can view fixture calendar (UI)
- [ ] User can record fixture results (backend + UI)
- [ ] Overdue fixtures marked (backend + UI)

### Phase 4 (Complete E2E)
- [ ] User can dispute match (backend + UI)
- [ ] Dispute workflow works (backend + UI)
- [ ] Disputed matches handled correctly (backend + UI)

### Phase 5 (Complete E2E)
- [ ] Auto-forfeit works (backend + UI)
- [ ] Manual forfeit works (backend + UI)
- [ ] Admin dashboard functional (UI)

### Phase 6 (Complete E2E)
- [ ] Multi-leg matches work (backend + UI)
- [ ] Match progress displayed (UI)
- [ ] Winner calculated automatically (backend)

### Phase 7 (Complete E2E)
- [ ] Real-time updates work (backend + UI)
- [ ] Notifications delivered (backend + UI)
- [ ] Advanced stats displayed (UI)

### Phase 8 (Polish)
- [ ] All features polished
- [ ] Production deployed
- [ ] Documentation complete

---

## Minimal Viable Product (MVP)

**Phase 1 + Phase 2 (Both Complete E2E) = MVP**

Features:
- ✅ Create and join leagues (with UI)
- ✅ Invite members (with UI)
- ✅ Record matches (with UI)
- ✅ View leaderboard (with UI)
- ✅ View match history (with UI)

This is a complete, usable product ready for early users!

---

## Phase 1 Detailed Implementation Plan

### Frontend Components to Build

#### 1. Leagues List Page
**File**: `src/app/pages/leagues/leagues-list.component.ts`

**Features:**
- Display grid of league cards
- "Create League" button (routes to /leagues/create)
- "Join League" button (routes to /leagues/join)
- Empty state with call-to-action
- Loading state while fetching

**Store Integration:**
- Dispatch `loadMyLeagues` on init
- Subscribe to `selectAllLeagues`
- Subscribe to `selectLeagueLoading`

#### 2. Create League Page
**File**: `src/app/pages/leagues/create-league.component.ts`

**Features:**
- Reactive form with validation
  - Name (required, min 3 chars)
  - Description (optional)
  - Game type (required, dropdown)
  - Privacy toggle
- Settings section (expandable)
  - Scoring system (radio buttons)
  - Points per win/draw/loss
  - Allow draws toggle
- Submit button
- Cancel button
- Success: redirect to league detail, show invite code

**Store Integration:**
- Dispatch `createLeague` on submit
- Subscribe to `selectLeagueLoading`
- Subscribe to `selectLeagueError`
- Navigate on `createLeagueSuccess`

#### 3. Join League Page
**File**: `src/app/pages/leagues/join-league.component.ts`

**Features:**
- Input for invite code (format: LMNR-XXXXXX)
- "Join" button
- Loading state
- Error handling (invalid code)
- Success: redirect to league detail

**Store Integration:**
- Dispatch `joinLeague` on submit
- Subscribe to `selectLeagueLoading`
- Subscribe to `selectLeagueError`
- Navigate on `joinLeagueSuccess`

#### 4. League Detail Page
**File**: `src/app/pages/leagues/league-detail.component.ts`

**Features:**
- League header
  - Name, description, game type
  - Invite code (with copy button)
  - Member count
  - Leave button
- Members tab (default)
  - List of members with roles
  - Role badges (creator, admin, member)
  - Remove button (admin only)
- Settings tab (creator/admin only)
  - Editable settings form
  - Save button

**Store Integration:**
- Dispatch `loadLeague` on init
- Dispatch `loadLeagueMembers` on init
- Subscribe to `selectSelectedLeague`
- Subscribe to `selectLeagueMembers`

#### 5. League Card Component
**File**: `src/app/shared/components/league-card/league-card.component.ts`

**Features:**
- League name and game type
- Member count
- Creator name
- Click to navigate to detail
- Hover effects

**Styling:**
- Match existing dark theme
- Card design consistent with auth pages
- Mobile-first responsive

### Styling Guidelines
- Use existing dark theme (#000000 background, #FFFFFF text)
- Consistent button styles from auth pages
- Mobile-first responsive design
- Smooth transitions and hover effects
- Loading skeletons for better UX

### E2E Tests (Cypress)

**File**: `cypress/e2e/leagues.cy.ts` (max 3 tests)

1. **Create league flow**
   - Navigate to create page
   - Fill form
   - Submit
   - Verify redirect and invite code shown

2. **Join league via code**
   - Create league (setup)
   - Copy invite code
   - New user joins via code
   - Verify member list updated

3. **View and edit league**
   - Navigate to league detail
   - View members
   - Edit settings (creator only)
   - Verify changes saved

---

## Implementation Order for Phase 1 Frontend

1. Create league card component (reusable)
2. Create leagues list page (simple, uses card)
3. Create join league page (simple form)
4. Create create league page (complex form)
5. Create league detail page (most complex, multiple tabs)
6. Add routing
7. Update home page (wire "Create League" button)
8. Write Cypress E2E tests
9. Manual testing and polish

---

## Estimated Effort Per Phase

**Phase 1**: Backend (✅ Done) + Frontend (~3-4 days)
**Phase 2**: Backend (~2 days) + Frontend (~2-3 days)
**Phase 3**: Backend (~4-5 days, complex algorithm) + Frontend (~3-4 days)
**Phase 4**: Backend (~2 days) + Frontend (~2 days)
**Phase 5**: Backend (~3 days) + Frontend (~2 days)
**Phase 6**: Backend (~2 days) + Frontend (~2 days) - Optional
**Phase 7**: Backend (~2 days) + Frontend (~2 days)
**Phase 8**: Polish (~3-5 days)

**Total MVP (Phase 1 + 2)**: ~7-9 days
**Full Platform (All phases)**: ~25-30 days