describe('Registration Flow', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage();
  });

  it('should display registration form', () => {
    cy.visit('/register');
    cy.get('h2').should('contain', 'Create Account');
    cy.get('input[formControlName="name"]').should('be.visible');
    cy.get('input[formControlName="email"]').should('be.visible');
    cy.get('input[formControlName="password"]').should('be.visible');
    cy.get('input[formControlName="confirmPassword"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('should show validation errors for empty form', () => {
    cy.visit('/register');
    cy.get('button[type="submit"]').click();
    cy.get('.error-message').should('be.visible');
  });

  it('should show password strength indicator', () => {
    cy.visit('/register');
    cy.get('input[formControlName="password"]').type('weak');
    cy.get('.password-strength').should('be.visible');
    cy.get('.strength-text').should('contain', 'Weak');
  });

  it('should show error for password mismatch', () => {
    cy.visit('/register');
    cy.get('input[formControlName="password"]').type('password123');
    cy.get('input[formControlName="confirmPassword"]').type('different123');
    cy.get('input[formControlName="confirmPassword"]').blur();
    cy.get('.error-message').should('contain', 'Passwords do not match');
  });

  it('should register new user successfully', () => {
    const timestamp = Date.now();
    const email = `newuser${timestamp}@example.com`;
    
    cy.register(email, 'password123', 'New User');
    cy.get('h1').should('contain', 'Welcome to Dashboard');
    cy.get('.user-info').should('contain', 'New User');
  });

  it('should show error for existing email', () => {
    cy.visit('/register');
    cy.get('input[formControlName="name"]').type('Test User');
    cy.get('input[formControlName="email"]').type('admin@example.com'); // Already exists
    cy.get('input[formControlName="password"]').type('password123');
    cy.get('input[formControlName="confirmPassword"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.get('.server-error').should('contain', 'already exists');
    cy.url().should('include', '/register');
  });

  it('should navigate to login page', () => {
    cy.visit('/register');
    cy.get('a').contains('Sign in here').click();
    cy.url().should('include', '/login');
  });

  it('should show loading state during registration', () => {
    cy.visit('/register');
    const timestamp = Date.now();
    cy.get('input[formControlName="name"]').type('Test User');
    cy.get('input[formControlName="email"]').type(`test${timestamp}@example.com`);
    cy.get('input[formControlName="password"]').type('password123');
    cy.get('input[formControlName="confirmPassword"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.get('.spinner').should('be.visible');
    cy.get('button[type="submit"]').should('contain', 'Creating Account...');
  });
});
