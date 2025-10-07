describe('Login', () => {
  it('should display login form', () => {
    cy.visit('/auth');
    cy.get('input[formControlName="email"]').should('be.visible');
    cy.get('input[formControlName="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('should show validation errors for empty form', () => {
    cy.visit('/auth');
    cy.get('input[formControlName="email"]').focus().blur();
    cy.get('input[formControlName="password"]').focus().blur();
    cy.contains('Email is required').should('be.visible');
    cy.contains('Password is required').should('be.visible');
  });

  it('should login successfully with valid credentials', () => {
    cy.createTestUser().then((user) => {
      cy.visit('/auth');
      cy.get('input[formControlName="email"]').type(user.email);
      cy.get('input[formControlName="password"]').type(user.password);
      cy.get('button[type="submit"]').click();
      // Wait for redirect to home page
      cy.url().should('eq', Cypress.config().baseUrl + '/', { timeout: 10000 });
      // Check for authenticated state - Logout button should be visible
      cy.contains('button', 'Logout').should('be.visible');
    });
  });
});

