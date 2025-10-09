describe('Leagues', () => {
  let testUser: { email: string; password: string; name: string };

  beforeEach(() => {
    // Create and login a test user
    cy.createAndLoginTestUser().then((credentials) => {
      testUser = credentials;
    });
  });

  it('should create a league successfully', () => {
    // Navigate to create league page
    cy.get('[data-testid="create-league-button"]').click();
    cy.url({ timeout: 10000 }).should('include', '/leagues/create');

    // Verify we're on the create page
    cy.get('h1').should('contain', 'Create a League');

    // Fill in the form
    cy.get('[data-testid="league-name-input"]').should('be.visible').type('Test League');
    cy.get('[data-testid="league-description-input"]').should('be.visible').type('A test league for GamePigeon');
    cy.get('[data-testid="league-gametype-select"]').should('be.visible').select('GamePigeon');

    // Wait a moment for form to be ready
    cy.wait(500);

    // Submit the form
    cy.get('[data-testid="submit-create-league-button"]').should('not.be.disabled').click();

    // Debug: Check if we get an error message
    cy.get('.form-error', { timeout: 2000 }).should('not.exist');

    // Wait for redirect to league detail page (increased timeout)
    cy.url({ timeout: 20000 }).should('match', /\/leagues\/[a-f0-9-]+$/);
    
    // Debug: Log current URL and page content
    cy.url().then(url => cy.log('Current URL: ' + url));
    cy.get('body').then($body => cy.log('Page content: ' + $body.text().substring(0, 200)));
    
    // Wait for league data to load
    cy.get('.loading-container', { timeout: 2000 }).should('not.exist');
    
    // Verify league details are displayed
    cy.get('[data-testid="league-detail-name"]', { timeout: 15000 }).should('contain', 'Test League');
    cy.contains('GamePigeon');
    cy.get('[data-testid="league-invite-code"]').should('contain', 'LMNR-');
  });

  it('should join a league via invite code', () => {
    // Navigate to create league page from home
    cy.visit('/');
    cy.get('[data-testid="create-league-button"]').click();
    cy.url().should('include', '/leagues/create');
    cy.wait(1000); // Wait for page to fully load
    cy.get('[data-testid="league-name-input"]', { timeout: 10000 }).should('be.visible').type('Joinable League');
    cy.get('[data-testid="league-gametype-select"]').select('Chess');
    cy.get('[data-testid="submit-create-league-button"]').click();
    
    // Wait for redirect and get the invite code
    cy.url().should('match', /\/leagues\/[a-f0-9-]+$/);
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
    // Create a league and get the invite link
    cy.visit('/');
    cy.get('[data-testid="create-league-button"]').click();
    cy.wait(1000);
    cy.get('[data-testid="league-name-input"]', { timeout: 10000 }).should('be.visible').type('Link Join League');
    cy.get('[data-testid="league-gametype-select"]').select('Chess');
    cy.get('[data-testid="submit-create-league-button"]').click();
    
    cy.url().should('match', /\/leagues\/[a-f0-9-]+$/);
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
    // Navigate to home first
    cy.visit('/');
    cy.get('[data-testid="welcome-message"]').should('be.visible');
    
    // Create a league
    cy.get('[data-testid="create-league-button"]').click();
    cy.url().should('include', '/leagues/create');
    cy.get('h1', { timeout: 10000 }).should('contain', 'Create a League');
    cy.get('[data-testid="league-name-input"]').should('be.visible').type('Detail Test League');
    cy.get('[data-testid="league-gametype-select"]').select('Pool');
    cy.get('[data-testid="submit-create-league-button"]').click();
    
    // Should be on league detail page
    cy.url().should('match', /\/leagues\/[a-f0-9-]+$/);
    
    // Verify header information
    cy.get('[data-testid="league-detail-name"]').should('contain', 'Detail Test League');
    cy.contains('Pool');
    cy.contains('1 member'); // Creator is automatically added
    
    // Check Members tab (should be default - activeTab starts as 'members')
    cy.wait(3000); // Wait for members to load from the store
    
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
    // Create a league
    cy.visit('/');
    cy.get('[data-testid="create-league-button"]').click();
    cy.get('[data-testid="league-name-input"]', { timeout: 10000 }).should('be.visible').type('Settings Update League');
    cy.get('[data-testid="league-gametype-select"]').select('Chess');
    cy.get('[data-testid="submit-create-league-button"]').click();
    
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
    // Create a league
    cy.visit('/');
    cy.get('[data-testid="create-league-button"]').click();
    cy.get('[data-testid="league-name-input"]', { timeout: 10000 }).should('be.visible').type('Original League Name');
    cy.get('[data-testid="league-description-input"]').type('Original description');
    cy.get('[data-testid="league-gametype-select"]').select('Pool');
    cy.get('[data-testid="submit-create-league-button"]').click();
    
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
    // Create a league
    cy.visit('/');
    cy.get('[data-testid="create-league-button"]').click();
    cy.get('[data-testid="league-name-input"]', { timeout: 10000 }).should('be.visible').type('League to Leave');
    cy.get('[data-testid="league-gametype-select"]').select('Chess');
    cy.get('[data-testid="submit-create-league-button"]').click();
    
    cy.url().should('match', /\/leagues\/[a-f0-9-]+$/);
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
    // Create multiple leagues
    cy.visit('/');
    
    // Create first league
    cy.get('[data-testid="create-league-button"]').click();
    cy.get('[data-testid="league-name-input"]', { timeout: 10000 }).should('be.visible').type('First League');
    cy.get('[data-testid="league-gametype-select"]').select('Chess');
    cy.get('[data-testid="submit-create-league-button"]').click();
    cy.url().should('match', /\/leagues\/[a-f0-9-]+$/);
    
    // Go back to home and create second league
    cy.visit('/');
    cy.get('[data-testid="create-league-button"]').click();
    cy.get('[data-testid="league-name-input"]', { timeout: 10000 }).should('be.visible').type('Second League');
    cy.get('[data-testid="league-gametype-select"]').select('Pool');
    cy.get('[data-testid="submit-create-league-button"]').click();
    cy.url().should('match', /\/leagues\/[a-f0-9-]+$/);
    
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
    // Create two leagues
    cy.visit('/');
    
    // Create first league
    cy.get('[data-testid="create-league-button"]').click();
    cy.get('[data-testid="league-name-input"]', { timeout: 10000 }).should('be.visible').type('Navigation League 1');
    cy.get('[data-testid="league-gametype-select"]').select('Chess');
    cy.get('[data-testid="submit-create-league-button"]').click();
    cy.url().should('match', /\/leagues\/[a-f0-9-]+$/);
    const firstLeagueUrl = cy.url();
    
    // Create second league
    cy.visit('/');
    cy.get('[data-testid="create-league-button"]').click();
    cy.get('[data-testid="league-name-input"]', { timeout: 10000 }).should('be.visible').type('Navigation League 2');
    cy.get('[data-testid="league-gametype-select"]').select('Pool');
    cy.get('[data-testid="submit-create-league-button"]').click();
    cy.url().should('match', /\/leagues\/[a-f0-9-]+$/);
    
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
    // First, create a league as authenticated user to get an invite code
    cy.visit('/');
    cy.get('[data-testid="create-league-button"]').click();
    cy.wait(1000);
    cy.get('[data-testid="league-name-input"]', { timeout: 10000 }).should('be.visible').type('Redirect Test League');
    cy.get('[data-testid="league-gametype-select"]').select('Chess');
    cy.get('[data-testid="submit-create-league-button"]').click();

    cy.url().should('match', /\/leagues\/[a-f0-9-]+$/);
    
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
    // Create a league to get a join URL
    cy.visit('/');
    cy.get('[data-testid="create-league-button"]').click();
    cy.wait(1000);
    cy.get('[data-testid="league-name-input"]', { timeout: 10000 }).should('be.visible').type('Login Redirect League');
    cy.get('[data-testid="league-gametype-select"]').select('Pool');
    cy.get('[data-testid="submit-create-league-button"]').click();

    cy.url().should('match', /\/leagues\/[a-f0-9-]+$/);
    
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

