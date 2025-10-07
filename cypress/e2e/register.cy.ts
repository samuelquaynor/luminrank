describe('Register', () => {
  it('should display registration form', () => {
    cy.visit('/auth');
    cy.contains('button', 'Register').click();
    cy.get('input[formControlName="name"]').should('be.visible');
    cy.get('input[formControlName="email"]').should('be.visible');
    cy.get('input[formControlName="password"]').should('be.visible');
    cy.get('input[formControlName="confirmPassword"]').should('be.visible');
  });

  it('should show validation errors for empty form', () => {
    cy.visit('/auth');
    cy.contains('button', 'Register').click();
    cy.get('input[formControlName="name"]').focus().blur();
    cy.get('input[formControlName="email"]').focus().blur();
    cy.get('input[formControlName="password"]').focus().blur();
    cy.contains('Name is required').should('be.visible');
    cy.contains('Email is required').should('be.visible');
  });

  it('should register successfully with valid data', () => {
    const timestamp = Date.now();
    const user = {
      name: `New User ${timestamp}`,
      email: `newuser${timestamp}@example.com`,
      password: 'NewPassword123!'
    };

    cy.visit('/auth');
    cy.contains('button', 'Register').click();
    cy.get('input[formControlName="name"]').type(user.name);
    cy.get('input[formControlName="email"]').type(user.email);
    cy.get('input[formControlName="password"]').type(user.password);
    cy.get('input[formControlName="confirmPassword"]').type(user.password);
    cy.get('button[type="submit"]').click();
    // Wait for redirect to home page
    cy.url().should('eq', Cypress.config().baseUrl + '/', { timeout: 10000 });
    // Check for authenticated state - Logout button should be visible
    cy.contains('button', 'Logout').should('be.visible');
  });
});

