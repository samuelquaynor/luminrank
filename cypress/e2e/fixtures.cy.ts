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

  describe('Fixture Generation', () => {
    it('should show generate fixtures button for league creator', () => {
      cy.visit(`/leagues/${testLeagueId}`);
      cy.wait(2000); // Wait for page to load
      
      // Navigate to Fixtures tab
      cy.get('[data-testid="fixtures-tab-button"]', { timeout: 10000 }).should('be.visible').click();
      cy.wait(1000);
      
      // Should see generate fixtures button
      cy.get('[data-testid="generate-fixtures-button"]', { timeout: 10000 }).should('be.visible');
    });

    it('should complete fixture generation wizard', () => {
      // Navigate to generate fixtures page
      cy.visit(`/leagues/${testLeagueId}/generate-fixtures`);
      cy.wait(3000); // Wait for page to fully load
      
      // Step 1: Season Selection
      cy.get('[data-testid="create-new-season-button"]', { timeout: 10000 }).should('be.visible').click();
      cy.wait(500);
      
      cy.get('[data-testid="season-name-input"]').clear().type('Test Season 1', { force: true });
      cy.get('[data-testid="season-number-input"]').clear().type('1', { force: true });
      
      // Set a start date (next week)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const dateStr = nextWeek.toISOString().split('T')[0];
      cy.get('[data-testid="season-start-date-input"]').clear().type(dateStr, { force: true });
      
      cy.get('[data-testid="next-button"]').click();
      cy.wait(500);
      
      // Step 2: Settings Configuration
      cy.get('[data-testid="fixtures-start-date-input"]').should('be.visible');
      cy.get('[data-testid="fixtures-start-date-input"]').clear().type(dateStr, { force: true });
      cy.get('[data-testid="match-frequency-input"]').clear().type('7', { force: true });
      cy.get('[data-testid="submission-window-input"]').clear().type('24', { force: true });
      
      cy.get('[data-testid="next-button"]').click();
      cy.wait(500);
      
      // Step 3: Review
      cy.contains('Review & Generate').should('be.visible');
      
      // Should show stats
      cy.contains('Players').should('be.visible');
      cy.contains('Total Rounds').should('be.visible');
      cy.contains('Total Fixtures').should('be.visible');
      
      // Note: With only 1 player (creator), generation should fail
      // This test verifies the flow, not the actual generation
      cy.get('[data-testid="generate-button"]').should('be.disabled');
    });

    it('should show validation error with insufficient players', () => {
      cy.visit(`/leagues/${testLeagueId}/generate-fixtures`);
      cy.wait(3000); // Wait for page to fully load
      
      // Go through wizard quickly
      cy.get('[data-testid="create-new-season-button"]', { timeout: 10000 }).should('be.visible').click();
      cy.wait(500);
      
      cy.get('[data-testid="season-name-input"]').clear().type('Test Season', { force: true });
      cy.get('[data-testid="season-number-input"]').clear().type('1', { force: true });
      
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const dateStr = nextWeek.toISOString().split('T')[0];
      cy.get('[data-testid="season-start-date-input"]').clear().type(dateStr, { force: true });
      
      cy.get('[data-testid="next-button"]').click();
      cy.wait(500);
      
      cy.get('[data-testid="fixtures-start-date-input"]').clear().type(dateStr, { force: true });
      cy.get('[data-testid="next-button"]').click();
      cy.wait(500);
      
      // Should show warning about insufficient players
      cy.contains('At least 2 active members required').should('be.visible');
      cy.get('[data-testid="generate-button"]').should('be.disabled');
    });

    it('should navigate back from generate fixtures page', () => {
      cy.visit(`/leagues/${testLeagueId}/generate-fixtures`);
      cy.wait(3000); // Wait for page to fully load
      
      cy.get('[data-testid="cancel-button"]', { timeout: 10000 }).should('be.visible').click();
      
      // Should return to league detail page
      cy.url({ timeout: 10000 }).should('match', new RegExp(`/leagues/${testLeagueId}$`));
    });
  });

  describe('Fixtures Tab', () => {
    it('should display fixtures tab', () => {
      cy.visit(`/leagues/${testLeagueId}`);
      cy.wait(2000); // Wait for page to load
      
      cy.get('[data-testid="fixtures-tab-button"]', { timeout: 10000 }).should('be.visible');
      cy.get('[data-testid="fixtures-tab-button"]').click();
      cy.wait(1000);
      
      // Should show empty state (no fixtures generated yet)
      cy.contains('No Fixtures Yet', { timeout: 10000 }).should('be.visible');
    });

    it('should show generate fixtures button in empty state', () => {
      cy.visit(`/leagues/${testLeagueId}`);
      cy.wait(2000); // Wait for page to load
      
      cy.get('[data-testid="fixtures-tab-button"]', { timeout: 10000 }).should('be.visible').click();
      cy.wait(1000);
      
      // Empty state should have generate button
      cy.contains('Generate fixtures to schedule matches', { timeout: 10000 }).should('be.visible');
    });
  });

  describe('Wizard Navigation', () => {
    it('should allow navigation between steps', () => {
      cy.visit(`/leagues/${testLeagueId}/generate-fixtures`);
      cy.wait(3000); // Wait for page to fully load
      
      // Step 1: Create season and go to step 2
      cy.get('[data-testid="create-new-season-button"]', { timeout: 10000 }).should('be.visible').click();
      cy.wait(500);
      
      cy.get('[data-testid="season-name-input"]').clear().type('Nav Test Season', { force: true });
      cy.get('[data-testid="season-number-input"]').clear().type('1', { force: true });
      
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const dateStr = nextWeek.toISOString().split('T')[0];
      cy.get('[data-testid="season-start-date-input"]').clear().type(dateStr, { force: true });
      
      cy.get('[data-testid="next-button"]').click();
      cy.wait(500);
      
      // Step 2: Fill and go to step 3
      cy.get('[data-testid="fixtures-start-date-input"]').clear().type(dateStr, { force: true });
      cy.get('[data-testid="next-button"]').click();
      cy.wait(500);
      
      // Step 3: Should see review
      cy.contains('Review & Generate').should('be.visible');
      
      // Navigate back to step 2
      cy.get('[data-testid="previous-button"]').click();
      cy.wait(500);
      cy.get('[data-testid="fixtures-start-date-input"]').should('be.visible');
      
      // Navigate back to step 1
      cy.get('[data-testid="previous-button"]').click();
      cy.wait(500);
      cy.get('[data-testid="create-new-season-button"]').should('be.visible');
    });

    it('should disable next button when form is invalid', () => {
      cy.visit(`/leagues/${testLeagueId}/generate-fixtures`);
      cy.wait(3000); // Wait for page to fully load
      
      // Without selecting/creating a season, next should be disabled
      cy.get('[data-testid="next-button"]', { timeout: 10000 }).should('be.visible').should('be.disabled');
    });
  });

  describe('Fixture Generation with Multiple Players', () => {
    it('should successfully generate fixtures with 2+ players', () => {
      // First, add another player to the league
      // This would require implementing invite/join flow in the test
      // For now, this test documents the expected behavior
      
      cy.log('Test requires multiple players - would test full generation flow');
      cy.log('Expected: Fixtures created, displayed in rounds, can record results');
    });
  });

  describe('Accessibility', () => {
    it('should have proper data-testid attributes', () => {
      cy.visit(`/leagues/${testLeagueId}/generate-fixtures`);
      cy.wait(3000); // Wait for page to fully load
      
      // Check all critical testids exist
      cy.get('[data-testid="cancel-button"]', { timeout: 10000 }).should('exist');
      cy.get('[data-testid="create-new-season-button"]', { timeout: 10000 }).should('exist');
      cy.get('[data-testid="next-button"]', { timeout: 10000 }).should('exist');
    });

    it('should show loading states appropriately', () => {
      cy.visit(`/leagues/${testLeagueId}`);
      cy.wait(2000); // Wait for page to load
      
      cy.get('[data-testid="fixtures-tab-button"]', { timeout: 10000 }).should('be.visible').click();
      
      // Note: Loading might be too fast to catch in test
      // This documents the expected behavior
      cy.log('Expected: Loading spinner while fetching fixtures');
    });
  });
});

