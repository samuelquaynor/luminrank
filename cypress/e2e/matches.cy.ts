/**
 * E2E tests for Match Recording & Leaderboard (Phase 2)
 */
describe('Matches', () => {
  let testUser: { email: string; password: string; name: string };

  beforeEach(() => {
    cy.createAndLoginTestUser().then((credentials) => {
      testUser = credentials;
    });
  });

  describe('Match Recording', () => {
    it('should record a match and display real data in matches tab and leaderboard', () => {
      // Create a league
      cy.visit('/');
      cy.createLeague('Match Data Test League', 'Chess');

      // Navigate to settings to get invite code
      cy.get('[data-testid="settings-tab-button"]').click();
      cy.wait(1000);
      
      cy.get('[data-testid="league-invite-code"]').invoke('text').then((inviteCode) => {
        const code = inviteCode.trim();
        
        // Logout and create second user
        cy.logout();
        
        const timestamp = Date.now();
        const opponentEmail = `matchopp${timestamp}@example.com`;
        cy.registerUser(opponentEmail, 'TestPassword123!', 'Match Opponent');
        
        // Wait for home page
        cy.get('[data-testid="welcome-message"]', { timeout: 10000 }).should('be.visible');
        cy.wait(3000);
        
        // Join the league via invite link (auto-joins)
        cy.visit(`/leagues/join/${code}`);
        cy.wait(2000);
        
        // Should auto-join and redirect to league detail
        cy.url({ timeout: 15000 }).should('match', /\/leagues\/[a-f0-9-]+$/);
        cy.get('[data-testid="league-detail-name"]').should('contain', 'Match Data Test League');
        
        // Capture league ID
        cy.url().then((url) => {
          const urlMatches = url.match(/\/leagues\/([a-f0-9-]+)/);
          const leagueId = urlMatches![1];
          
          // Record a match as the opponent (currently logged in)
          cy.get('[data-testid="record-match-button"]').click();
          cy.url().should('include', '/record-match');
          cy.wait(2000);
          
          // Fill in match details with real data
          cy.get('[data-testid="player1-select"]').select(1); // Match Opponent (current user)
          cy.get('[data-testid="player1-score-input"]').clear().type('15', { force: true });
          cy.get('[data-testid="player1-result-select"]').select('win');
          
          cy.get('[data-testid="player2-select"]').select(2); // Main user
          cy.get('[data-testid="player2-score-input"]').clear().type('8', { force: true });
          cy.get('[data-testid="player2-result-select"]').select('loss');
          
          cy.get('[data-testid="submit-record-match-button"]').click();
          cy.url({ timeout: 15000 }).should('match', /\/leagues\/[a-f0-9-]+$/);
          cy.wait(3000); // Wait for data to load
          
          // ✅ VERIFY LEADERBOARD DISPLAYS REAL DATA (not empty state)
          cy.get('[data-testid="leaderboard-tab-button"]').should('have.class', 'text-white');
          
          // Check that leaderboard displays player names
          cy.get('[data-testid^="leaderboard-row-"]', { timeout: 10000 }).should('have.length.at.least', 2);
          cy.contains('Match Opponent').should('be.visible');
          cy.contains(testUser.name).should('be.visible');
          
          // Verify actual stats are shown (not just empty state)
          cy.get('[data-testid="leaderboard-row-1"]').should('be.visible');
          // Check for actual numbers in the leaderboard (matches, wins, points)
          cy.get('[data-testid="leaderboard-row-1"]').invoke('text').should('match', /[1-9]/); // Should contain at least one non-zero number
          
          // ✅ VERIFY MATCHES TAB DISPLAYS REAL DATA
          cy.get('[data-testid="matches-tab-button"]').click();
          cy.wait(2000);
          
          // Verify match card displays with real player names and scores
          cy.get('[data-testid^="match-card-"]', { timeout: 10000 }).should('have.length', 1);
          cy.contains('Match Opponent').should('be.visible');
          cy.contains(testUser.name).should('be.visible');
          cy.contains('15').should('be.visible'); // Winner score
          cy.contains('8').should('be.visible'); // Loser score
          cy.contains('WIN').should('be.visible'); // Result badge
        });
      });
    });

    it('should show validation errors for invalid match data', () => {
      // Create a league
      cy.visit('/');
      cy.createLeague('Validation Test League', 'Pool');

      // Navigate to record match
      cy.get('[data-testid="record-match-button"]').click();
      cy.url().should('include', '/record-match');

      cy.wait(2000);

      // Try to submit without filling the form
      cy.get('[data-testid="submit-record-match-button"]').should('be.disabled');
    });
  });

  describe('Leaderboard', () => {
    it('should display empty leaderboard for new league', () => {
      // Create a league
      cy.visit('/');
      cy.createLeague('Empty Leaderboard League', 'Chess');

      // Should be on league detail page with leaderboard tab active
      cy.get('[data-testid="leaderboard-tab-button"]').should('have.class', 'text-white');
      
      // Should show empty state
      cy.contains('No Matches Yet').should('be.visible');
      cy.contains('Record your first match to see the leaderboard!').should('be.visible');
    });

    it('should navigate between tabs', () => {
      // Create a league
      cy.visit('/');
      cy.createLeague('Tab Navigation League', 'Pool');

      // Verify leaderboard tab is active by default
      cy.get('[data-testid="leaderboard-tab-button"]').should('have.class', 'text-white');
      cy.contains('No Matches Yet').should('be.visible');

      // Click matches tab
      cy.get('[data-testid="matches-tab-button"]').click();
      cy.contains('Match History').should('be.visible');
      cy.contains('No Matches Yet').should('be.visible');

      // Click members tab
      cy.get('[data-testid="members-tab-button"]').click();
      cy.contains('League Members').should('be.visible');

      // Click settings tab
      cy.get('[data-testid="settings-tab-button"]').click();
      cy.contains('League Settings').should('be.visible');

      // Go back to leaderboard
      cy.get('[data-testid="leaderboard-tab-button"]').click();
      cy.contains('Leaderboard').should('be.visible');
    });

    it('should show record match button on leaderboard tab', () => {
      // Create a league
      cy.visit('/');
      cy.createLeague('Record Button League', 'Chess');

      // Verify record match button exists on leaderboard tab
      cy.get('[data-testid="leaderboard-tab-button"]').should('have.class', 'text-white');
      cy.get('[data-testid="record-match-button"]').should('be.visible');
      cy.get('[data-testid="record-match-button"]').should('contain', 'Record Match');
    });
  });

  describe('Match History', () => {
    it('should display empty state for matches tab', () => {
      // Create a league
      cy.visit('/');
      cy.createLeague('Empty Matches League', 'GamePigeon');

      // Navigate to matches tab
      cy.get('[data-testid="matches-tab-button"]').click();
      
      // Should show empty state
      cy.contains('Match History').should('be.visible');
      cy.contains('No Matches Yet').should('be.visible');
      cy.contains('Be the first to record a match!').should('be.visible');
    });

    it('should show record match button on matches tab', () => {
      // Create a league
      cy.visit('/');
      cy.createLeague('Matches Tab League', 'Pool');

      // Navigate to matches tab
      cy.get('[data-testid="matches-tab-button"]').click();

      // Verify record match button exists
      cy.get('[data-testid="record-match-button-matches"]').should('be.visible');
      cy.get('[data-testid="record-match-button-matches"]').should('contain', 'Record Match');
    });
  });

  describe('Integration', () => {
    it('should navigate to record match from leaderboard tab', () => {
      // Create a league
      cy.visit('/');
      cy.createLeague('Navigation Test League', 'Chess');

      // Click record match button from leaderboard
      cy.get('[data-testid="record-match-button"]').click();
      cy.url().should('include', '/record-match');
      cy.get('h1').should('contain', 'Record Match');
    });

    it('should navigate to record match from matches tab', () => {
      // Create a league
      cy.visit('/');
      cy.createLeague('Matches Navigation League', 'Pool');

      // Navigate to matches tab
      cy.get('[data-testid="matches-tab-button"]').click();

      // Click record match button
      cy.get('[data-testid="record-match-button-matches"]').click();
      cy.url().should('include', '/record-match');
      cy.get('h1').should('contain', 'Record Match');
    });

    it('should navigate back from record match page', () => {
      // Create a league
      cy.visit('/');
      cy.createLeague('Back Navigation League', 'GamePigeon');
      
      const leagueUrl = cy.url();

      // Go to record match
      cy.get('[data-testid="record-match-button"]').click();
      cy.url().should('include', '/record-match');

      // Click back button
      cy.get('[data-testid="back-to-league-button"]').click();
      
      // Should be back on league detail page
      cy.url().should('match', /\/leagues\/[a-f0-9-]+$/);
      cy.get('[data-testid="league-detail-name"]').should('contain', 'Back Navigation League');
    });
  });
});

