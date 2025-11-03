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
  cy.get('[data-testid="register-email-input"]', { timeout: 5000 })
    .should('be.visible')
    .type(email);
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
  // Check if we're authenticated (menu button should exist)
  cy.get('body').then(($body) => {
    if ($body.find('button[aria-label="Menu"]').length > 0) {
      // Open the burger menu dropdown
      cy.get('button[aria-label="Menu"]').should('be.visible').click();
      // Click Sign Out from dropdown
      cy.contains('button', 'Sign Out').should('be.visible').click();
      // Wait for logout to complete
      cy.wait(1000);
    }
  });
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
    name: `Test User ${timestamp}`,
  };

  // Register the user
  cy.registerUser(credentials.email, credentials.password, credentials.name);

  // Verify we're on home page and authenticated
  cy.url({ timeout: 10000 }).should('eq', Cypress.config().baseUrl + '/');
  cy.get('[data-testid="create-league-button"]', { timeout: 10000 }).should('be.visible');

  // Return credentials for use in tests
  cy.wrap(credentials);
});

// Create league helper - handles the form filling with proper waits
Cypress.Commands.add('createLeague', (name: string, gameType: string, description?: string) => {
  // Navigate to home page using logo if not already there
  cy.url().then((url) => {
    if (
      !url.includes('/') ||
      url.includes('/leagues/') ||
    url.includes('/auth') ||
      url.includes('/profile-setup')
    ) {
      // Click logo to navigate to home
      cy.get('div[routerLink="/"]', { timeout: 10000 }).first().should('be.visible').click();
      cy.wait(1000);
    }
  });

  // Navigate to create page using Create League button (always visible now)
  cy.get('[data-testid="create-league-button"]', { timeout: 10000 }).should('be.visible').click();

  cy.url({ timeout: 10000 }).should('include', '/leagues/create');

  // Wait for page to fully load and stabilize
  cy.get('h1').should('contain', 'Create a League');
  cy.wait(2000);

  // Fill form with force: true to avoid detachment issues
  cy.get('[data-testid="league-name-input"]')
    .should('be.visible')
    .clear()
    .type(name, { force: true });
  if (description) {
    cy.get('[data-testid="league-description-input"]')
      .should('be.visible')
      .clear()
      .type(description, { force: true });
  }
  cy.get('[data-testid="league-gametype-select"]').should('be.visible').select(gameType);
  cy.wait(500);

  // Submit
  cy.get('[data-testid="submit-create-league-button"]').should('not.be.disabled').click();

  // Wait for redirect
  cy.url({ timeout: 20000 }).should('match', /\/leagues\/[a-f0-9-]+$/);
});
