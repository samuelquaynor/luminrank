describe('Profile Setup', () => {
  it('should redirect to profile setup after registration', () => {
    const timestamp = Date.now();
    const user = {
      email: `newuser${timestamp}@example.com`,
      password: 'TestPassword123!'
    };

    cy.visit('/auth');
    cy.contains('button', 'Sign Up').click();
    cy.get('input[formControlName="email"]').type(user.email);
    cy.get('input[formControlName="password"]').type(user.password);
    cy.get('input[formControlName="confirmPassword"]').type(user.password);
    cy.get('button[type="submit"]').click();

    // Should redirect to profile setup
    cy.url().should('include', '/profile-setup', { timeout: 10000 });
    cy.contains('Welcome to LuminRank!').should('be.visible');
    cy.get('input[formControlName="name"]').should('be.visible');
  });

  it('should show validation error for empty name', () => {
    const timestamp = Date.now();
    const user = {
      email: `newuser${timestamp}@example.com`,
      password: 'TestPassword123!'
    };

    cy.visit('/auth');
    cy.contains('button', 'Sign Up').click();
    cy.get('input[formControlName="email"]').type(user.email);
    cy.get('input[formControlName="password"]').type(user.password);
    cy.get('input[formControlName="confirmPassword"]').type(user.password);
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/profile-setup', { timeout: 10000 });
    cy.get('input[formControlName="name"]').focus().blur();
    cy.contains('Name is required').should('be.visible');
  });

  it('should complete profile setup and redirect to home', () => {
    const timestamp = Date.now();
    const user = {
      email: `newuser${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: `Test User ${timestamp}`
    };

    cy.visit('/auth');
    cy.contains('button', 'Sign Up').click();
    cy.get('input[formControlName="email"]').type(user.email);
    cy.get('input[formControlName="password"]').type(user.password);
    cy.get('input[formControlName="confirmPassword"]').type(user.password);
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/profile-setup', { timeout: 10000 });
    cy.get('input[formControlName="name"]').type(user.name);
    cy.get('button[type="submit"]').click();

    // Should redirect to home
    cy.url().should('eq', Cypress.config().baseUrl + '/', { timeout: 10000 });
    cy.contains('button', 'Sign Out').should('be.visible');
  });
});