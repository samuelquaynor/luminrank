describe('Login', () => {
  it('should display login form', () => {
    cy.visit('/auth');
    cy.get('input[formControlName="email"]').should('be.visible');
    cy.get('input[formControlName="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('should show validation error for empty fields', () => {
    cy.visit('/auth');
    cy.wait(500); // Wait for form to be ready
    cy.get('input[formControlName="email"]').should('not.be.disabled').type('a').clear().blur();
    cy.contains('Email is required').should('be.visible');
  });

  it('should login successfully with valid credentials', () => {
    cy.createTestUser().then((user) => {
      cy.visit('/auth');
      cy.get('input[formControlName="email"]').type(user.email);
      cy.get('input[formControlName="password"]').type(user.password);
      cy.get('button[type="submit"]').click();
      cy.url().should('eq', Cypress.config().baseUrl + '/', { timeout: 10000 });
      cy.contains('button', 'Sign Out').should('be.visible');
    });
  });
});