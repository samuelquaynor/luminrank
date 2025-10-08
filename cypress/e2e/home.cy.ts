describe('Home Page', () => {
  it('should display landing page for non-authenticated users', () => {
    cy.visit('/');
    cy.contains('Illuminate the Competition').should('be.visible');
    cy.contains('button', 'Get Started').should('be.visible');
  });

  it('should navigate to auth page when clicking Get Started', () => {
    cy.visit('/');
    cy.wait(500); // Wait for Angular to stabilize
    cy.contains('button', 'Get Started').should('be.visible');
    cy.contains('button', 'Get Started').click({ force: true });
    cy.url().should('include', '/auth', { timeout: 5000 });
    cy.get('input[formControlName="email"]').should('be.visible');
  });

  it('should display user dashboard for authenticated users', () => {
    cy.createTestUser().then((user) => {
      cy.visit('/auth');
      cy.get('input[formControlName="email"]').type(user.email);
      cy.get('input[formControlName="password"]').type(user.password);
      cy.get('button[type="submit"]').click();
      
      cy.url().should('eq', Cypress.config().baseUrl + '/', { timeout: 10000 });
      cy.contains('Welcome back').should('be.visible');
      cy.contains('button', 'Sign Out').should('be.visible');
    });
  });
});