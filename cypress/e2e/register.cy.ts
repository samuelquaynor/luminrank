describe('Register', () => {
  it('should display registration form', () => {
    cy.visit('/auth');
    cy.contains('button', 'Sign Up').click();
    cy.get('input[formControlName="email"]').should('be.visible');
    cy.get('input[formControlName="password"]').should('be.visible');
    cy.get('input[formControlName="confirmPassword"]').should('be.visible');
  });

  it('should show validation error for password mismatch', () => {
    cy.visit('/auth');
    cy.contains('button', 'Sign Up').click();
    cy.get('input[formControlName="email"]').type('test@example.com');
    cy.get('input[formControlName="password"]').type('password123');
    cy.get('input[formControlName="confirmPassword"]').type('differentpassword');
    cy.get('input[formControlName="confirmPassword"]').blur();
    cy.contains('Passwords do not match').should('be.visible');
  });

  it('should register successfully with valid data', () => {
    const timestamp = Date.now();
    const user = {
      email: `newuser${timestamp}@example.com`,
      password: 'NewPassword123!',
      name: `New User ${timestamp}`
    };

    cy.visit('/auth');
    cy.contains('button', 'Sign Up').click();
    cy.get('input[formControlName="email"]').type(user.email);
    cy.get('input[formControlName="password"]').type(user.password);
    cy.get('input[formControlName="confirmPassword"]').type(user.password);
    cy.get('button[type="submit"]').click();
    
    // Wait for redirect to profile setup
    cy.url().should('include', '/profile-setup', { timeout: 10000 });
    
    // Fill in the name
    cy.get('input[formControlName="name"]').type(user.name);
    cy.get('button[type="submit"]').click();
    
    // Wait for redirect to home page
    cy.url().should('eq', Cypress.config().baseUrl + '/', { timeout: 10000 });
    cy.contains('button', 'Sign Out').should('be.visible');
  });
});