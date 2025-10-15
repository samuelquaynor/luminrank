/**
 * E2E Tests for Phase 4: Match Disputes
 *
 * Tests the complete dispute workflow:
 * - Creating disputes
 * - Viewing disputed matches
 * - Resolving disputes
 */

describe('Match Disputes', () => {
  let testUser: { email: string; password: string; name: string };

  beforeEach(() => {
    cy.createAndLoginTestUser().then((credentials) => {
      testUser = credentials;
    });
  });

  it('should create a dispute for a match', () => {
    // TODO: Debug why dispute button doesn't appear in Cypress tests
    // The button shows correctly in manual testing but not in automated tests
    // This might be a timing issue or change detection issue in the test environment
    // Create league
    cy.visit('/');
    cy.createLeague('Dispute Test League', 'Chess');

    // Get invite code
    cy.get('[data-testid="settings-tab-button"]').click();
    cy.wait(1000);

    cy.get('[data-testid="league-invite-code"]')
      .invoke('text')
      .then((inviteCode) => {
        const code = inviteCode.trim();

        // Logout and create opponent
        cy.logout();

        const timestamp = Date.now();
        const opponentEmail = `dispute-opp-${timestamp}@example.com`;
        cy.registerUser(opponentEmail, 'TestPassword123!', 'Dispute Opponent');

        // Wait for home page
        cy.get('[data-testid="welcome-message"]', { timeout: 10000 }).should('be.visible');
        cy.wait(3000);

        // Join league
        cy.visit(`/leagues/join/${code}`);
        cy.wait(2000);

        // Should auto-join and redirect
        cy.url({ timeout: 15000 }).should('match', /\/leagues\/[a-f0-9-]+$/);

        // Capture league ID
        cy.url().then((url) => {
          const urlMatches = url.match(/\/leagues\/([a-f0-9-]+)/);
          const leagueId = urlMatches![1];

          // Wait for page to fully load
          cy.wait(3000);

          // Ensure league detail is loaded
          cy.get('[data-testid="league-detail-name"]', { timeout: 10000 }).should('be.visible');

          // Record match as opponent (on leaderboard tab by default)
          cy.get('[data-testid="record-match-button"]', { timeout: 15000 })
            .should('be.visible')
            .click();
          cy.wait(2000);

          // Fill match details
          cy.get('[data-testid="player1-select"]').select(1); // Opponent
          cy.wait(500);
          cy.get('[data-testid="player1-score-input"]').clear().type('10', { force: true });
          cy.get('[data-testid="player1-result-select"]').select('win');
          cy.wait(500);

          cy.get('[data-testid="player2-select"]').select(2); // Test user
          cy.wait(500);
          cy.get('[data-testid="player2-score-input"]').clear().type('5', { force: true });
          cy.get('[data-testid="player2-result-select"]').select('loss');
          cy.wait(500);

          cy.get('[data-testid="submit-record-match-button"]').should('not.be.disabled').click();
          cy.wait(5000);

          // Navigate to matches tab
          cy.visit(`/leagues/${leagueId}`);
          cy.wait(3000);
          cy.get('[data-testid="matches-tab-button"]').click();
          cy.wait(2000);

          // Verify match is displayed
          cy.get('[data-testid^="match-card-"]', { timeout: 10000 }).should('have.length', 1);
          cy.wait(1000);

          // Click dispute button (wait longer for it to appear)
          cy.get('[data-testid="dispute-match-button"]', { timeout: 15000 })
            .should('be.visible')
            .click();
          cy.wait(500);

          // Fill dispute form
          cy.get('[data-testid="dispute-reason-input"]').should('be.visible');
          cy.get('[data-testid="dispute-reason-input"]').type(
            'The score was recorded incorrectly. I actually scored 8 points, not 10.'
          );

          // Update proposed scores (break up the chain to avoid re-render issues)
          cy.get('[data-testid="proposed-score-0"]').click();
          cy.wait(200);
          cy.get('[data-testid="proposed-score-0"]').type('{selectall}8');
          cy.wait(200);

          cy.get('[data-testid="proposed-score-1"]').click();
          cy.wait(200);
          cy.get('[data-testid="proposed-score-1"]').type('{selectall}10');
          cy.wait(200);

          // Submit dispute
          cy.get('[data-testid="submit-dispute-button"]').should('not.be.disabled').click();

          // Wait for dispute to be created and matches to reload
          cy.wait(3000);

          // Verify dispute dialog closed (dispute was submitted successfully)
          cy.get('[data-testid="dispute-reason-input"]').should('not.exist');

          // Verify disputed match is still visible with the badge
          cy.get('[data-testid^="match-card-"]', { timeout: 10000 }).should('have.length', 1);
          cy.get('[data-testid="disputed-badge"]', { timeout: 10000 }).should('be.visible');
          cy.get('[data-testid="disputed-badge"]').should('contain', 'DISPUTED');

          // Verify dispute button is now hidden (match is already disputed)
          cy.get('[data-testid="dispute-match-button"]').should('not.exist');
        });
      });
  });

  it('should allow recording multiple matches between same players', () => {
    // Create league
    cy.visit('/');
    cy.createLeague('Multiple Matches Test', 'Chess');

    // Get invite code
    cy.get('[data-testid="settings-tab-button"]').click();
    cy.wait(1000);

    cy.get('[data-testid="league-invite-code"]')
      .invoke('text')
      .then((inviteCode) => {
        const code = inviteCode.trim();

        // Logout and create opponent
        cy.logout();

        const timestamp = Date.now();
        const opponentEmail = `multi-match-${timestamp}@example.com`;
        cy.registerUser(opponentEmail, 'TestPassword123!', 'Match Opponent');

        // Wait for home page
        cy.get('[data-testid="welcome-message"]', { timeout: 10000 }).should('be.visible');
        cy.wait(3000);

        // Join league
        cy.visit(`/leagues/join/${code}`);
        cy.wait(2000);

        // Should auto-join and redirect
        cy.url({ timeout: 15000 }).should('match', /\/leagues\/[a-f0-9-]+$/);

        // Capture league ID
        cy.url().then((url) => {
          const urlMatches = url.match(/\/leagues\/([a-f0-9-]+)/);
          const leagueId = urlMatches![1];

          // Record first match as opponent
          cy.wait(2000);
          cy.get('[data-testid="record-match-button"]', { timeout: 15000 })
            .should('be.visible')
            .click();
          cy.wait(2000);

          cy.get('[data-testid="player1-select"]').select(1); // Opponent
          cy.wait(500);
          cy.get('[data-testid="player1-score-input"]').clear().type('10', { force: true });
          cy.get('[data-testid="player1-result-select"]').select('win');
          cy.wait(500);

          cy.get('[data-testid="player2-select"]').select(2); // Test user
          cy.wait(500);
          cy.get('[data-testid="player2-score-input"]').clear().type('5', { force: true });
          cy.get('[data-testid="player2-result-select"]').select('loss');
          cy.wait(500);

          cy.get('[data-testid="submit-record-match-button"]').should('not.be.disabled').click();
          cy.wait(5000);

          // Navigate back to league and verify first match
          cy.visit(`/leagues/${leagueId}`);
          cy.wait(2000);
          cy.get('[data-testid="matches-tab-button"]').click();
          cy.wait(1000);

          cy.get('[data-testid^="match-card-"]', { timeout: 10000 }).should('have.length', 1);
          cy.contains('10').should('be.visible');

          // Record SECOND match with same participants (different scores)
          cy.get('[data-testid="record-match-button-matches"]').click();
          cy.wait(2000);

          cy.get('[data-testid="player1-select"]').select(2); // Test user this time
          cy.wait(500);
          cy.get('[data-testid="player1-score-input"]').clear().type('15', { force: true });
          cy.get('[data-testid="player1-result-select"]').select('loss');
          cy.wait(500);

          cy.get('[data-testid="player2-select"]').select(1); // Opponent wins
          cy.wait(500);
          cy.get('[data-testid="player2-score-input"]').clear().type('20', { force: true });
          cy.get('[data-testid="player2-result-select"]').select('win');
          cy.wait(500);

          cy.get('[data-testid="submit-record-match-button"]').should('not.be.disabled').click();
          cy.wait(5000);

          // Verify both matches are displayed
          cy.visit(`/leagues/${leagueId}`);
          cy.wait(2000);
          cy.get('[data-testid="matches-tab-button"]').click();
          cy.wait(1000);

          cy.get('[data-testid^="match-card-"]', { timeout: 10000 }).should('have.length', 2);

          // Verify both matches show correct scores
          cy.contains('10').should('be.visible'); // First match
          cy.contains('20').should('be.visible'); // Second match
          cy.contains('15').should('be.visible'); // Second match

          // Record THIRD match
          cy.get('[data-testid="record-match-button-matches"]').click();
          cy.wait(2000);

          cy.get('[data-testid="player1-select"]').select(1); // Opponent
          cy.wait(500);
          cy.get('[data-testid="player1-score-input"]').clear().type('12', { force: true });
          cy.get('[data-testid="player1-result-select"]').select('win');
          cy.wait(500);

          cy.get('[data-testid="player2-select"]').select(2); // Test user
          cy.wait(500);
          cy.get('[data-testid="player2-score-input"]').clear().type('9', { force: true });
          cy.get('[data-testid="player2-result-select"]').select('loss');
          cy.wait(500);

          cy.get('[data-testid="submit-record-match-button"]').should('not.be.disabled').click();
          cy.wait(5000);

          // Verify all three matches are displayed
          cy.visit(`/leagues/${leagueId}`);
          cy.wait(2000);
          cy.get('[data-testid="matches-tab-button"]').click();
          cy.wait(1000);

          cy.get('[data-testid^="match-card-"]', { timeout: 10000 }).should('have.length', 3);

          // Verify all scores are visible
          cy.contains('10').should('be.visible'); // Match 1
          cy.contains('20').should('be.visible'); // Match 2
          cy.contains('12').should('be.visible'); // Match 3
          cy.contains('9').should('be.visible'); // Match 3
        });
      });
  });
});
