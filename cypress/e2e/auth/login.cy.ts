describe('Login Flow', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage();
  });

  it('should display login form', () => {
    cy.visit('/login');
    cy.get('h2').should('contain', 'Sign In');
    cy.get('input[formControlName="email"]').should('be.visible');
    cy.get('input[formControlName="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('should show validation errors for empty form', () => {
    cy.visit('/login');
    cy.get('input[formControlName="email"]').focus().blur();
    cy.get('input[formControlName="password"]').focus().blur();
    cy.get('.error-message').should('be.visible');
  });

  it('should show validation error for invalid email', () => {
    cy.visit('/login');
    cy.get('input[formControlName="email"]').type('invalid-email');
    cy.get('input[formControlName="email"]').blur();
    cy.get('.error-message').should('contain', 'valid email');
  });

  it('should show validation error for short password', () => {
    cy.visit('/login');
    cy.get('input[formControlName="email"]').type('user@example.com');
    cy.get('input[formControlName="password"]').type('123');
    cy.get('input[formControlName="password"]').blur();
    cy.get('.error-message').should('contain', 'at least');
  });

  it('should login successfully with valid credentials', () => {
    cy.login('user@example.com', 'user123');
    cy.get('h1').should('contain', 'Dashboard');
    cy.get('.info-card').should('contain', 'Regular User');
  });

  it('should login successfully with admin credentials', () => {
    cy.login('admin@example.com', 'admin123');
    cy.get('h1').should('contain', 'Dashboard');
    cy.get('.info-card').should('contain', 'Admin User');
    cy.get('.info-card').should('contain', 'Admin Panel');
  });

  it('should show error for invalid credentials', () => {
    cy.visit('/login');
    cy.get('input[formControlName="email"]').type('invalid@example.com');
    cy.get('input[formControlName="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    cy.get('.server-error').should('contain', 'Invalid email or password');
    cy.url().should('include', '/login');
  });

  it('should navigate to register page', () => {
    cy.visit('/login');
    cy.get('a').contains('Sign up here').click();
    cy.wait(1000); // Wait for navigation
    cy.url().should('include', '/register');
  });

  it('should show loading state during login', () => {
    cy.visit('/login');
    cy.get('input[formControlName="email"]').type('user@example.com');
    cy.get('input[formControlName="password"]').type('user123');
    cy.get('button[type="submit"]').click();
    cy.get('.spinner').should('be.visible');
    cy.get('button[type="submit"]').should('contain', 'Signing In...');
  });
});
