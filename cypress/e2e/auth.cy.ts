describe('Auth Redirects', () => {
  let testUser: { email: string; password: string; name: string };

  beforeEach(() => {
    // Create and login a test user
    cy.createAndLoginTestUser().then((credentials) => {
      testUser = credentials;
    });
  });

  it('should redirect unauthenticated user to auth and back after registration', () => {
    // Create a league using the helper
    cy.createLeague('Redirect Test League', 'Chess');

    // Get the invite code
    cy.get('[data-testid="league-invite-code"]')
      .invoke('text')
      .then((inviteCode) => {
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

        // Should be redirected to join league URL (may be /leagues/join/:code first, then redirects)
        // Wait for potential redirect to league detail
        cy.url({ timeout: 15000 }).should((url) => {
          expect(url).to.match(/\/leagues\/[a-f0-9-]+$/);
        });
        cy.get('[data-testid="league-detail-name"]', { timeout: 10000 }).should(
          'contain',
          'Redirect Test League'
        );

        // Verify we're on the league detail page
        cy.get('[data-testid="league-detail-name"]', { timeout: 10000 }).should(
          'contain',
          'Redirect Test League'
        );
      });
  });

  it('should redirect existing user back after login', () => {
    // Create a league using the helper
    cy.createLeague('Login Redirect League', 'Pool');

    cy.get('[data-testid="league-invite-code"]')
      .invoke('text')
      .then((inviteCode) => {
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

        // Should redirect to join league URL (may be /leagues/join/:code first, then redirects)
        // Wait for potential redirect to league detail
        cy.url({ timeout: 15000 }).should((url) => {
          expect(url).to.match(/\/leagues\/[a-f0-9-]+$/);
        });
        cy.get('[data-testid="league-detail-name"]', { timeout: 15000 }).should(
          'contain',
          'Login Redirect League'
        );
      });
  });
});
