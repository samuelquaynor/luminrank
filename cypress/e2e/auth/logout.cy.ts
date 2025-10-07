describe('Logout Flow', () => {
  it('should logout successfully from dashboard', () => {
    cy.login('user@example.com', 'user123');
    cy.get('h1').should('contain', 'Welcome to Dashboard');
    
    cy.logout();
    cy.get('h2').should('contain', 'Sign In');
    cy.url().should('include', '/login');
  });

  it('should logout successfully from admin panel', () => {
    cy.login('admin@example.com', 'admin123');
    cy.get('h1').should('contain', 'Welcome to Dashboard');
    
    // Go to admin panel
    cy.get('button').contains('Go to Admin Panel').click();
    cy.get('h1').should('contain', 'Admin Panel');
    
    // Logout from admin panel
    cy.logout();
    cy.get('h2').should('contain', 'Sign In');
    cy.url().should('include', '/login');
  });

  it('should clear authentication token on logout', () => {
    cy.login('user@example.com', 'user123');
    cy.checkAuth();
    
    cy.logout();
    cy.window().its('localStorage').should('not.have.property', 'luminrank_auth_token');
  });
});
