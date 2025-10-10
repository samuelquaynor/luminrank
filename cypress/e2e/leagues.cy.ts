describe('Leagues', () => {
  let testUser: { email: string; password: string; name: string };

  beforeEach(() => {
    // Create and login a test user
    cy.createAndLoginTestUser().then((credentials) => {
      testUser = credentials;
    });
  });

  it('should create a league successfully', () => {
    // Use the helper command
    cy.createLeague('Test League', 'GamePigeon');
    
    // Verify league details are displayed
    cy.get('[data-testid="league-detail-name"]', { timeout: 15000 }).should('contain', 'Test League');
    cy.contains('GamePigeon');
    cy.get('[data-testid="league-invite-code"]').should('contain', 'LMNR-');
  });

  it('should join a league via invite code', () => {
    // Create a league using the helper
    cy.visit('/');
    cy.createLeague('Joinable League', 'Chess');
    
    // Get the invite code
    cy.wait(1000);
    cy.get('[data-testid="league-invite-code"]').invoke('text').then((inviteCode) => {
      const code = inviteCode.trim();
      
      // Logout
      cy.logout();
      
      // Create and login as a different user
      const timestamp = Date.now();
      cy.registerUser(
        `seconduser${timestamp}@example.com`,
        'TestPassword123!',
        'Second User'
      );
      
      // Wait for home page to load and auth to be fully set
      cy.get('[data-testid="welcome-message"]', { timeout: 10000 }).should('be.visible');
      cy.wait(3000); // Wait for auth state to fully propagate through the app
      
      // Navigate to join league page directly (auth guard should now handle this properly)
      cy.visit('/leagues/join');
      
      // Verify we're on the join page
      cy.url({ timeout: 10000 }).should('include', '/leagues/join');
      cy.contains('h1', 'Join a League', { timeout: 10000 }).should('be.visible');
      
      // Wait for form to be ready
      cy.wait(1000);
      
      // Enter invite code and join
      cy.get('[data-testid="invite-code-input"]', { timeout: 10000 }).should('be.visible').should('not.be.disabled').type(code);
      cy.get('[data-testid="submit-join-league-button"]').click();
      
      // Should redirect to league detail
      cy.url().should('match', /\/leagues\/[a-f0-9-]+$/);
      cy.get('[data-testid="league-detail-name"]').should('contain', 'Joinable League');
      
      // Verify we're in the members list  
      cy.get('[data-testid="members-tab-button"]').click();
      cy.wait(2000); // Wait for members to load
      
      // Should see both members (creator and second user)
      cy.get('.member-item', { timeout: 10000 }).should('have.length', 2);
      cy.contains('.member-name', 'Second User').should('be.visible');
    });
  });

  it('should join a league via invite link', () => {
    // Create a league using the helper
    cy.visit('/');
    cy.createLeague('Link Join League', 'Chess');
    
    cy.wait(1000);
    cy.get('[data-testid="league-invite-code"]').invoke('text').then((inviteCode) => {
      const code = inviteCode.trim();
      
      // Logout and create second user
      cy.logout();
      
      const timestamp = Date.now();
      cy.registerUser(
        `linkjoinuser${timestamp}@example.com`,
        'TestPassword123!',
        'Link Join User'
      );
      
      // Wait for home page
      cy.get('[data-testid="welcome-message"]', { timeout: 10000 }).should('be.visible');
      cy.wait(3000);
      
      // Visit the invite link directly
      cy.visit(`/leagues/join/${code}`);
      cy.wait(2000);
      
      // Should auto-join and redirect to league detail
      cy.url({ timeout: 15000 }).should('match', /\/leagues\/[a-f0-9-]+$/);
      cy.get('[data-testid="league-detail-name"]').should('contain', 'Link Join League');
      
      // Verify we're in the members list
      cy.get('[data-testid="members-tab-button"]').click();
      cy.wait(2000);
      cy.get('.member-item', { timeout: 10000 }).should('have.length', 2);
      cy.contains('.member-name', 'Link Join User').should('be.visible');
    });
  });

  it('should view league details and members', () => {
    // Create a league using the helper
    cy.visit('/');
    cy.createLeague('Detail Test League', 'Pool');
    
    // Should be on league detail page
    cy.url().should('match', /\/leagues\/[a-f0-9-]+$/);
    
    // Verify header information
    cy.get('[data-testid="league-detail-name"]').should('contain', 'Detail Test League');
    cy.contains('Pool');
    cy.contains('1 member'); // Creator is automatically added
    
    // Check Leaderboard tab (default tab in Phase 2)
    cy.get('[data-testid="leaderboard-tab-button"]').should('have.class', 'text-white');
    cy.contains('No Matches Yet').should('be.visible');
    
    // Navigate to Members tab
    cy.get('[data-testid="members-tab-button"]').click();
    cy.wait(2000); // Wait for members to load
    
    // Verify members are displayed
    cy.get('.member-item', { timeout: 15000 }).should('have.length.at.least', 1);
    cy.get('.member-name').first().should('be.visible');
    cy.get('[data-testid="member-role-badge"]').first().should('contain', 'creator');
    
    // Check Settings tab
    cy.get('[data-testid="settings-tab-button"]').click();
    cy.get('[data-testid="scoring-system-select"]').should('have.value', 'points');
    cy.get('[data-testid="points-per-win-input"]').should('have.value', '3');
    
    // Verify invite code and link
    cy.get('[data-testid="league-invite-code"]').should('contain', 'LMNR-');
    cy.get('[data-testid="league-invite-link"]').should('contain', '/leagues/join/LMNR-');
    
    // Test copy link button - stub clipboard API to avoid focus issues
    cy.window().then((win) => {
      cy.stub(win.navigator.clipboard, 'writeText').resolves();
    });
    cy.get('[data-testid="copy-invite-link-button"]').click();
    // Verify the button exists and is clickable (clipboard stubbed)
  });

  it('should update league settings', () => {
    // Create a league using the helper
    cy.visit('/');
    cy.createLeague('Settings Update League', 'Chess');
    
    // Navigate to settings tab
    cy.url().should('match', /\/leagues\/[a-f0-9-]+$/);
    cy.get('[data-testid="settings-tab-button"]').click();
    cy.wait(1000);
    
    // Verify default settings
    cy.get('[data-testid="scoring-system-select"]').should('have.value', 'points');
    cy.get('[data-testid="points-per-win-input"]').should('have.value', '3');
    
    // Edit settings
    cy.get('[data-testid="edit-settings-button"]').click();
    cy.get('[data-testid="points-per-win-input"]').should('not.have.attr', 'readonly');
    cy.get('[data-testid="points-per-win-input"]').clear().type('5');
    
    // Save settings
    cy.get('[data-testid="save-settings-button"]').click();
    cy.wait(2000); // Wait for save to complete
    
    // Verify updated settings (should be readonly again after save)
    cy.get('[data-testid="points-per-win-input"]').should('have.value', '5');
    cy.get('[data-testid="points-per-win-input"]').should('have.attr', 'readonly');
  });

  it('should update league name and description', () => {
    // Create a league using the helper with description
    cy.visit('/');
    cy.createLeague('Original League Name', 'Pool', 'Original description');
    
    // Verify original name and description
    cy.url().should('match', /\/leagues\/[a-f0-9-]+$/);
    cy.get('[data-testid="league-detail-name"]', { timeout: 10000 }).should('contain', 'Original League Name');
    cy.contains('Original description').should('be.visible');
    
    // Wait for page to fully load, members to load, and auth state to be available
    cy.wait(3000);
    
    // Verify we can see the invite code (confirms we're the creator)
    cy.get('[data-testid="league-invite-code"]').should('be.visible');
    
    // Click edit button (only visible to creator)
    cy.get('[data-testid="edit-league-button"]', { timeout: 15000 }).should('be.visible').click();
    cy.wait(500);
    
    // Update name and description
    cy.get('[data-testid="edit-league-name-input"]').should('be.visible').clear().type('Updated League Name');
    cy.get('[data-testid="edit-league-description-input"]').clear().type('Updated description');
    
    // Save changes
    cy.get('[data-testid="save-league-button"]').click();
    cy.wait(2000); // Wait for save to complete
    
    // Verify updated name and description
    cy.get('[data-testid="league-detail-name"]').should('contain', 'Updated League Name');
    cy.contains('Updated description').should('be.visible');
  });

  it('should leave a league', () => {
    // Create a league using the helper
    cy.visit('/');
    cy.createLeague('League to Leave', 'Chess');
    cy.get('[data-testid="league-invite-code"]').invoke('text').then((inviteCode) => {
      const code = inviteCode.trim();
      
      // Logout and create second user
      cy.logout();
      
      const timestamp = Date.now();
      cy.registerUser(
        `leaveuser${timestamp}@example.com`,
        'TestPassword123!',
        'Leave Test User'
      );
      
      // Join the league
      cy.get('[data-testid="welcome-message"]', { timeout: 10000 }).should('be.visible');
      cy.wait(3000);
      cy.visit('/leagues/join');
      cy.wait(1000);
      
      cy.get('[data-testid="invite-code-input"]', { timeout: 10000 }).should('be.visible').should('not.be.disabled').type(code);
      cy.get('[data-testid="submit-join-league-button"]').click();
      
      // Should be on league detail page
      cy.url().should('match', /\/leagues\/[a-f0-9-]+$/);
      
      // Leave the league (accept the confirmation dialog)
      cy.on('window:confirm', () => true);
      cy.get('[data-testid="leave-league-button"]').click();
      cy.wait(2000); // Wait for leave action to complete
      
      // Should be redirected away from league detail
      cy.url({ timeout: 10000 }).should('not.match', /\/leagues\/[a-f0-9-]+$/);
      cy.url().should('include', '/leagues');
    });
  });

  it('should view leagues list', () => {
    // Create multiple leagues using the helper
    cy.visit('/');
    cy.createLeague('First League', 'Chess');
    
    // Go back to home and create second league
    cy.visit('/');
    cy.createLeague('Second League', 'Pool');
    
    // Navigate to leagues list
    cy.visit('/leagues');
    cy.wait(2000); // Wait for leagues to load
    
    // Verify both leagues are displayed
    cy.contains('First League').should('be.visible');
    cy.contains('Second League').should('be.visible');
    cy.contains('Chess').should('be.visible');
    cy.contains('Pool').should('be.visible');
    
    // Click on a league to view details
    cy.contains('First League').click();
    cy.url().should('match', /\/leagues\/[a-f0-9-]+$/);
    cy.get('[data-testid="league-detail-name"]').should('contain', 'First League');
  });

  it('should navigate between different leagues', () => {
    // Create two leagues using the helper
    cy.visit('/');
    cy.createLeague('Navigation League 1', 'Chess');
    const firstLeagueUrl = cy.url();
    
    // Create second league
    cy.visit('/');
    cy.createLeague('Navigation League 2', 'Pool');
    
    // Navigate back to leagues list
    cy.visit('/leagues');
    cy.wait(2000);
    
    // Click on first league
    cy.contains('Navigation League 1').click();
    cy.get('[data-testid="league-detail-name"]').should('contain', 'Navigation League 1');
    cy.contains('Chess');
    
    // Go back to list
    cy.visit('/leagues');
    cy.wait(1000);
    
    // Click on second league
    cy.contains('Navigation League 2').click();
    cy.get('[data-testid="league-detail-name"]').should('contain', 'Navigation League 2');
    cy.contains('Pool');
  });

  it('should redirect unauthenticated user to auth and back after registration', () => {
    // Create a league using the helper
    cy.visit('/');
    cy.createLeague('Redirect Test League', 'Chess');
    
    // Get the invite code
    cy.get('[data-testid="league-invite-code"]').invoke('text').then((inviteCode) => {
      const code = inviteCode.trim();
      const joinUrl = `/leagues/join/${code}`;

      // Logout
      cy.logout();
      cy.wait(2000);

      // Try to access the join league URL while logged out
      cy.visit(joinUrl);
      cy.wait(1000);

      // Should be redirected to auth page with returnUrl
      cy.url({ timeout: 10000 }).should('include', '/auth');
      cy.url().should('include', `returnUrl=${encodeURIComponent(joinUrl)}`);

      // Register a new user directly on this auth page (don't use registerUser command)
      // This preserves the returnUrl in the URL and localStorage
      cy.get('[data-testid="signup-tab"]').should('be.visible').click();
      cy.wait(500);

      const timestamp = Date.now();
      const newUserEmail = `redirecttest${timestamp}@example.com`;
      const newUserPassword = 'TestPassword123!';

      cy.get('[data-testid="register-email-input"]').type(newUserEmail);
      cy.get('[data-testid="register-password-input"]').type(newUserPassword);
      cy.get('[data-testid="register-confirm-password-input"]').type(newUserPassword);
      cy.get('[data-testid="register-submit-button"]').click();

      // Should go to profile setup
      cy.url({ timeout: 10000 }).should('include', '/profile-setup');
      
      // Complete profile setup
      cy.get('[data-testid="profile-name-input"]').type('Redirect Test User');
      cy.get('[data-testid="profile-continue-button"]').click();

      // Should be redirected back to the join league URL after profile setup
      cy.url({ timeout: 15000 }).should('match', /\/leagues\/[a-f0-9-]+$/);
      cy.get('[data-testid="league-detail-name"]', { timeout: 10000 }).should('contain', 'Redirect Test League');

      // Verify we're in the members list
      cy.get('[data-testid="members-tab-button"]').click();
      cy.wait(2000);
      cy.get('.member-item', { timeout: 10000 }).should('have.length', 2);
      cy.contains('.member-name', 'Redirect Test User').should('be.visible');
    });
  });

  it('should redirect existing user back after login', () => {
    // Create a league using the helper
    cy.visit('/');
    cy.createLeague('Login Redirect League', 'Pool');
    
    cy.get('[data-testid="league-invite-code"]').invoke('text').then((inviteCode) => {
      const code = inviteCode.trim();
      const joinUrl = `/leagues/join/${code}`;

      // Logout
      cy.logout();
      cy.wait(2000);

      // Try to access join URL while logged out
      cy.visit(joinUrl);
      cy.wait(1000);

      // Should redirect to auth with returnUrl
      cy.url({ timeout: 10000 }).should('include', '/auth');
      cy.url().should('include', `returnUrl=${encodeURIComponent(joinUrl)}`);

      // Login directly on the current auth page (don't navigate away)
      cy.get('[data-testid="signin-tab"]').should('be.visible').click();
      cy.wait(500);
      cy.get('[data-testid="login-email-input"]').clear().type(testUser.email);
      cy.get('[data-testid="login-password-input"]').clear().type(testUser.password);
      cy.get('[data-testid="login-submit-button"]').click();

      // Should redirect directly to the join league URL (user already has profile)
      cy.url({ timeout: 15000 }).should('match', /\/leagues\/[a-f0-9-]+$/);
      cy.get('[data-testid="league-detail-name"]', { timeout: 10000 }).should('contain', 'Login Redirect League');
    });
  });
});

