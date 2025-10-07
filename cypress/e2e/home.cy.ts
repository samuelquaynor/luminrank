describe('Home Page', () => {
  it('should display landing page for non-authenticated users', () => {
    cy.visit('/');
    cy.contains('Welcome to LuminRank').should('be.visible');
    cy.contains('Get Started').should('be.visible');
  });

  it('should navigate to auth page when clicking Get Started', () => {
    cy.visit('/');
    cy.contains('Get Started').click();
    cy.url().should('include', '/auth');
  });

  it('should show login tab by default on auth page', () => {
    cy.visit('/auth');
    cy.contains('button', 'Login').should('have.class', 'active');
  });
});

