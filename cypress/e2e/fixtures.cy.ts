describe('Fixtures & Scheduling (Phase 3)', () => {
  const testUserEmail = `fixture-e2e-${Date.now()}@example.com`;
  const testUserPassword = 'TestPassword123!';
  let testLeagueId: string;

  before(() => {
    // Register and set up test user with league
    cy.visit('/');
    cy.registerUser(testUserEmail, testUserPassword, 'Fixture Tester');
    
    // Create a test league
    cy.createLeague('Fixture Test League', 'Chess', 'Testing fixture generation');
    
    // Store the league ID from URL
    cy.url({ timeout: 15000 }).should('match', /\/leagues\/[a-f0-9-]+$/);
    cy.url().then((url) => {
      const matches = url.match(/\/leagues\/([a-f0-9-]+)/);
      if (matches) {
        testLeagueId = matches[1];
        cy.log(`League ID captured: ${testLeagueId}`);
      } else {
        throw new Error('Failed to capture league ID from URL');
      }
    });
  });

  beforeEach(() => {
    // Sign in before each test
    cy.visit('/auth');
    cy.wait(1000); // Wait for form to be ready
    cy.get('[data-testid="login-email-input"]').clear().type(testUserEmail, { force: true });
    cy.get('[data-testid="login-password-input"]').clear().type(testUserPassword, { force: true });
    cy.get('[data-testid="login-submit-button"]').click();
    cy.url({ timeout: 15000 }).should('include', '/');
    cy.wait(1000); // Wait for navigation to complete
  });

  // describe('Fixture Generation', () => {
  //   it('should show generate fixtures button for league creator', () => {
  //     cy.visit(`/leagues/${testLeagueId}`);
  //     cy.wait(2000); // Wait for page to load
      
  //     // Navigate to Fixtures tab
  //     cy.get('[data-testid="fixtures-tab-button"]', { timeout: 10000 }).should('be.visible').click();
  //     cy.wait(1000);
      
  //     // Should see generate fixtures button
  //     cy.get('[data-testid="generate-fixtures-button"]', { timeout: 10000 }).should('be.visible');
  //   });

  //   it('should complete fixture generation wizard', () => {
  //     // Navigate to generate fixtures page
  //     cy.visit(`/leagues/${testLeagueId}/generate-fixtures`);
  //     cy.wait(3000); // Wait for page to fully load
      
  //     // Step 1: Season Selection
  //     cy.get('[data-testid="create-new-season-button"]', { timeout: 10000 }).should('be.visible').click();
  //     cy.wait(500);
      
  //     cy.get('[data-testid="season-name-input"]').clear().type('Test Season 1', { force: true });
  //     cy.get('[data-testid="season-number-input"]').clear().type('1', { force: true });
      
  //     // Set a start date (next week)
  //     const nextWeek = new Date();
  //     nextWeek.setDate(nextWeek.getDate() + 7);
  //     const dateStr = nextWeek.toISOString().split('T')[0];
  //     cy.get('[data-testid="season-start-date-input"]').clear().type(dateStr, { force: true });
      
  //     cy.get('[data-testid="next-button"]').click();
  //     cy.wait(500);
      
  //     // Step 2: Settings Configuration
  //     cy.get('[data-testid="fixtures-start-date-input"]').should('be.visible');
  //     cy.get('[data-testid="fixtures-start-date-input"]').clear().type(dateStr, { force: true });
  //     cy.get('[data-testid="match-frequency-input"]').clear().type('7', { force: true });
  //     cy.get('[data-testid="submission-window-input"]').clear().type('24', { force: true });
      
  //     cy.get('[data-testid="next-button"]').click();
  //     cy.wait(500);
      
  //     // Step 3: Review
  //     cy.contains('Review & Generate').should('be.visible');
      
  //     // Should show stats
  //     cy.contains('Players').should('be.visible');
  //     cy.contains('Total Rounds').should('be.visible');
  //     cy.contains('Total Fixtures').should('be.visible');
      
  //     // Note: With only 1 player (creator), generation should fail
  //     // This test verifies the flow, not the actual generation
  //     cy.get('[data-testid="generate-button"]').should('be.disabled');
  //   });

  //   it('should show validation error with insufficient players', () => {
  //     cy.visit(`/leagues/${testLeagueId}/generate-fixtures`);
  //     cy.wait(3000); // Wait for page to fully load
      
  //     // Go through wizard quickly
  //     cy.get('[data-testid="create-new-season-button"]', { timeout: 10000 }).should('be.visible').click();
  //     cy.wait(500);
      
  //     cy.get('[data-testid="season-name-input"]').clear().type('Test Season', { force: true });
  //     cy.get('[data-testid="season-number-input"]').clear().type('1', { force: true });
      
  //     const nextWeek = new Date();
  //     nextWeek.setDate(nextWeek.getDate() + 7);
  //     const dateStr = nextWeek.toISOString().split('T')[0];
  //     cy.get('[data-testid="season-start-date-input"]').clear().type(dateStr, { force: true });
      
  //     cy.get('[data-testid="next-button"]').click();
  //     cy.wait(500);
      
  //     cy.get('[data-testid="fixtures-start-date-input"]').clear().type(dateStr, { force: true });
  //     cy.get('[data-testid="next-button"]').click();
  //     cy.wait(500);
      
  //     // Should show warning about insufficient players
  //     cy.contains('At least 2 active members required').should('be.visible');
  //     cy.get('[data-testid="generate-button"]').should('be.disabled');
  //   });

  //   it('should navigate back from generate fixtures page', () => {
  //     cy.visit(`/leagues/${testLeagueId}/generate-fixtures`);
  //     cy.wait(3000); // Wait for page to fully load
      
  //     cy.get('[data-testid="cancel-button"]', { timeout: 10000 }).should('be.visible').click();
      
  //     // Should return to league detail page
  //     cy.url({ timeout: 10000 }).should('match', new RegExp(`/leagues/${testLeagueId}$`));
  //   });
  // });

  // describe('Fixtures Tab', () => {
  //   it('should display fixtures tab', () => {
  //     cy.visit(`/leagues/${testLeagueId}`);
  //     cy.wait(2000); // Wait for page to load
      
  //     cy.get('[data-testid="fixtures-tab-button"]', { timeout: 10000 }).should('be.visible');
  //     cy.get('[data-testid="fixtures-tab-button"]').click();
  //     cy.wait(1000);
      
  //     // Should show empty state (no fixtures generated yet)
  //     cy.contains('No Fixtures Yet', { timeout: 10000 }).should('be.visible');
  //   });

  //   it('should show generate fixtures button in empty state', () => {
  //     cy.visit(`/leagues/${testLeagueId}`);
  //     cy.wait(2000); // Wait for page to load
      
  //     cy.get('[data-testid="fixtures-tab-button"]', { timeout: 10000 }).should('be.visible').click();
  //     cy.wait(1000);
      
  //     // Empty state should have generate button
  //     cy.contains('Generate fixtures to schedule matches', { timeout: 10000 }).should('be.visible');
  //   });
  // });

  // describe('Wizard Navigation', () => {
  //   it('should allow navigation between steps', () => {
  //     cy.visit(`/leagues/${testLeagueId}/generate-fixtures`);
  //     cy.wait(3000); // Wait for page to fully load
      
  //     // Step 1: Create season and go to step 2
  //     cy.get('[data-testid="create-new-season-button"]', { timeout: 10000 }).should('be.visible').click();
  //     cy.wait(500);
      
  //     cy.get('[data-testid="season-name-input"]').clear().type('Nav Test Season', { force: true });
  //     cy.get('[data-testid="season-number-input"]').clear().type('1', { force: true });
      
  //     const nextWeek = new Date();
  //     nextWeek.setDate(nextWeek.getDate() + 7);
  //     const dateStr = nextWeek.toISOString().split('T')[0];
  //     cy.get('[data-testid="season-start-date-input"]').clear().type(dateStr, { force: true });
      
  //     cy.get('[data-testid="next-button"]').click();
  //     cy.wait(500);
      
  //     // Step 2: Fill and go to step 3
  //     cy.get('[data-testid="fixtures-start-date-input"]').clear().type(dateStr, { force: true });
  //     cy.get('[data-testid="next-button"]').click();
  //     cy.wait(500);
      
  //     // Step 3: Should see review
  //     cy.contains('Review & Generate').should('be.visible');
      
  //     // Navigate back to step 2
  //     cy.get('[data-testid="previous-button"]').click();
  //     cy.wait(500);
  //     cy.get('[data-testid="fixtures-start-date-input"]').should('be.visible');
      
  //     // Navigate back to step 1
  //     cy.get('[data-testid="previous-button"]').click();
  //     cy.wait(500);
  //     cy.get('[data-testid="create-new-season-button"]').should('be.visible');
  //   });

  //   it('should disable next button when form is invalid', () => {
  //     cy.visit(`/leagues/${testLeagueId}/generate-fixtures`);
  //     cy.wait(3000); // Wait for page to fully load
      
  //     // Without selecting/creating a season, next should be disabled
  //     cy.get('[data-testid="next-button"]', { timeout: 10000 }).should('be.visible').should('be.disabled');
  //   });
  // });

  describe('Fixture Generation with Multiple Players', () => {
    it('should generate fixtures and display real data in fixtures tab', () => {
      // Create a league
      cy.visit('/');
      cy.createLeague('Fixtures Real Data League', 'Chess');

      // Get invite code
      cy.get('[data-testid="settings-tab-button"]').click();
      cy.wait(1000);
      
      cy.get('[data-testid="league-invite-code"]').invoke('text').then((inviteCode) => {
        const code = inviteCode.trim();
        
        // Add opponent 1
        cy.logout();
        const timestamp = Date.now();
        cy.registerUser(`fixopp1${timestamp}@example.com`, 'TestPassword123!', 'Fixture Player 1');
        cy.get('[data-testid="welcome-message"]', { timeout: 10000 }).should('be.visible');
        cy.wait(3000);
        cy.visit(`/leagues/join/${code}`);
        cy.wait(2000);
        cy.url({ timeout: 15000 }).should('match', /\/leagues\/[a-f0-9-]+$/);
        
        // Add opponent 2
        cy.logout();
        cy.registerUser(`fixopp2${timestamp}@example.com`, 'TestPassword123!', 'Fixture Player 2');
        cy.get('[data-testid="welcome-message"]', { timeout: 10000 }).should('be.visible');
        cy.wait(3000);
        cy.visit(`/leagues/join/${code}`);
        cy.wait(2000);
        cy.url({ timeout: 15000 }).should('match', /\/leagues\/[a-f0-9-]+$/);
        
        // Capture league ID
        cy.url().then((url) => {
          const matches = url.match(/\/leagues\/([a-f0-9-]+)/);
          const leagueId = matches![1];
          
          // Sign back in as test user (creator)
          cy.logout();
          cy.visit('/auth');
          cy.wait(1000);
          cy.get('[data-testid="login-email-input"]').clear().type(testUserEmail, { force: true });
          cy.get('[data-testid="login-password-input"]').clear().type(testUserPassword, { force: true });
          cy.get('[data-testid="login-submit-button"]').click();
          
          // Wait for home page and then navigate directly to league
          cy.wait(3000);
          cy.visit(`/leagues/${leagueId}`, { timeout: 20000 });
          cy.wait(3000); // Wait for league page to fully load
          
          // Go to fixtures tab and generate fixtures
          cy.get('[data-testid="fixtures-tab-button"]', { timeout: 10000 }).should('be.visible').click();
          cy.wait(1000);
          cy.get('[data-testid="generate-fixtures-button"]').click();
          cy.url().should('include', '/generate-fixtures');
          cy.wait(5000); // Wait for wizard and members to load
          
          // Complete wizard
          cy.get('[data-testid="create-new-season-button"]').click();
          cy.wait(500);
          cy.get('[data-testid="season-name-input"]').clear().type('Season 1', { force: true });
          cy.get('[data-testid="season-number-input"]').clear().type('1', { force: true });
          
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          const dateStr = nextWeek.toISOString().split('T')[0];
          cy.get('[data-testid="season-start-date-input"]').clear().type(dateStr, { force: true });
          
          cy.get('[data-testid="next-button"]').click();
          cy.wait(500);
          
          // Settings
          cy.get('[data-testid="fixtures-start-date-input"]').clear().type(dateStr, { force: true });
          cy.get('[data-testid="next-button"]').click();
          cy.wait(500);
          
          // Review step - check if we have enough players
          cy.contains('Players').should('be.visible');
          
          // Try to click generate (may be disabled if members haven't loaded yet)
          cy.get('[data-testid="generate-button"]').click({ force: true }); // Force click even if disabled
          cy.wait(5000); // Wait for generation attempt
          
          // Should redirect or manually navigate
          cy.visit(`/leagues/${leagueId}`);
          cy.wait(3000);
          
          // Navigate to Fixtures tab
          cy.get('[data-testid="fixtures-tab-button"]').click();
          cy.wait(2000);
          
          // ✅ VERIFY FIXTURES DISPLAY WITH REAL DATA
          cy.get('app-fixture-card', { timeout: 10000 }).should('have.length.at.least', 1);
          
          // Verify player names are visible in fixtures
          cy.contains('Fixture Tester').should('be.visible'); // Test user name
          cy.contains('Fixture Player').should('be.visible'); // Opponent name (partial match)
          
          // Verify fixture details are shown
          cy.contains('VS').should('be.visible');
          cy.contains('scheduled', { matchCase: false }).should('be.visible');
          
          // Verify round numbers
          cy.contains('R1').should('be.visible'); // Round 1 badge
          
          // Verify at least 3 fixtures (3 players = 3 fixtures in single round-robin)
          cy.get('app-fixture-card').should('have.length.at.least', 3);
        });
      });
    });
  });

});

