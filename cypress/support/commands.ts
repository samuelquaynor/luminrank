/// <reference types="cypress" />

// Login command - navigates to auth page, logs in, and waits for redirect
Cypress.Commands.add('loginUser', (email: string, password: string) => {
  cy.visit('/auth');
  cy.get('[data-testid="login-email-input"]').clear().type(email);
  cy.get('[data-testid="login-password-input"]').clear().type(password);
  cy.get('[data-testid="login-submit-button"]').click();
  
  // Wait for navigation away from auth page
  cy.url({ timeout: 15000 }).should('not.include', '/auth');
});

// Register command - navigates to auth page, registers, completes profile setup
Cypress.Commands.add('registerUser', (email: string, password: string, name: string) => {
  // Clear any existing auth state
  cy.clearLocalStorage();
  cy.visit('/auth');
  cy.wait(500); // Wait for auth check to complete
  cy.get('[data-testid="signup-tab"]', { timeout: 10000 }).should('be.visible').click();
  cy.get('[data-testid="register-email-input"]', { timeout: 5000 }).should('be.visible').type(email);
  cy.get('[data-testid="register-password-input"]').type(password);
  cy.get('[data-testid="register-confirm-password-input"]').type(password);
  cy.get('[data-testid="register-submit-button"]').click();
  
  // Wait for redirect to profile setup
  cy.url({ timeout: 10000 }).should('include', '/profile-setup');
  
  // Fill in the name
  cy.get('[data-testid="profile-name-input"]').type(name);
  cy.get('[data-testid="profile-continue-button"]').click();
  
  // Wait for redirect to home
  cy.url({ timeout: 10000 }).should('not.include', '/profile-setup');
});

// Logout command
Cypress.Commands.add('logout', () => {
  cy.contains('button', 'Sign Out').click();
  // Clear localStorage to ensure clean logout
  cy.clearLocalStorage();
  // Wait a bit for logout to complete
  cy.wait(500);
});

// Check auth command
Cypress.Commands.add('checkAuth', () => {
  cy.window().its('localStorage').should('have.property', 'luminrank_auth_token');
});

// Create test user and login - generates unique credentials, registers, and logs in
Cypress.Commands.add('createAndLoginTestUser', () => {
  const timestamp = Date.now();
  const credentials = {
    email: `testuser${timestamp}@example.com`,
    password: 'TestPassword123!',
    name: `Test User ${timestamp}`
  };

  // Register the user
  cy.registerUser(credentials.email, credentials.password, credentials.name);
  
  // Verify we're on home page
  cy.get('[data-testid="welcome-message"]', { timeout: 10000 }).should('be.visible');
  
  // Return credentials for use in tests
  cy.wrap(credentials);
});
