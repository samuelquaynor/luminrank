describe('Login', () => {
  it('should display login form', () => {
    cy.visit('/auth');
    cy.get('[data-testid="login-email-input"]').should('be.visible');
    cy.get('[data-testid="login-password-input"]').should('be.visible');
    cy.get('[data-testid="login-submit-button"]').should('be.visible');
  });

  it('should show validation error for empty fields', () => {
    cy.visit('/auth');
    cy.wait(500); // Wait for form to be ready
    cy.get('[data-testid="login-email-input"]').should('not.be.disabled').type('a').clear().blur();
    cy.contains('Email is required').should('be.visible');
  });

  it('should login successfully with valid credentials', () => {
    cy.createAndLoginTestUser().then((user: { email: string; password: string; name: string }) => {
      // User is already logged in from createAndLoginTestUser
      cy.url().should('eq', Cypress.config().baseUrl + '/', { timeout: 10000 });
      cy.contains('button', 'Sign Out').should('be.visible');
    });
  });

  it('should persist auth state after page reload', () => {
    cy.createAndLoginTestUser().then((user: { email: string; password: string; name: string }) => {
      // Verify user is logged in
      cy.url().should('eq', Cypress.config().baseUrl + '/');
      cy.get('[data-testid="welcome-message"]').should('be.visible');
      cy.contains('button', 'Sign Out').should('be.visible');
      
      // Check that auth token exists in localStorage
      cy.checkAuth();
      
      // Reload the page
      cy.reload();
      
      // Verify user is still logged in after reload
      cy.url({ timeout: 10000 }).should('eq', Cypress.config().baseUrl + '/');
      cy.get('[data-testid="welcome-message"]', { timeout: 10000 }).should('be.visible');
      cy.contains('button', 'Sign Out', { timeout: 10000 }).should('be.visible');
      
      // Verify auth token still exists
      cy.checkAuth();
      
      // Verify user can access protected content (e.g., create league button)
      cy.get('[data-testid="create-league-button"]').should('be.visible');
    });
  });
});