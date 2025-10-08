/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login with email and password
       * @example cy.login('user@example.com', 'user123')
       */
      login(email: string, password: string): Chainable<void>;
      
      /**
       * Custom command to logout
       * @example cy.logout()
       */
      logout(): Chainable<void>;
      
      /**
       * Custom command to register a new user
       * @example cy.register('newuser@example.com', 'password123')
       */
      register(email: string, password: string): Chainable<void>;
      
      /**
       * Custom command to check if user is authenticated
       * @example cy.checkAuth()
       */
      checkAuth(): Chainable<void>;
      
      /**
       * Custom command to create a test user with auto-generated credentials
       * @example cy.createTestUser().then(({ email, password, name }) => { ... })
       */
      createTestUser(): Chainable<{ email: string; password: string; name: string }>;
    }
  }
}

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/auth');
  cy.get('input[formControlName="email"]').type(email);
  cy.get('input[formControlName="password"]').type(password);
  cy.get('button[type="submit"]').click();
});

// Logout command
Cypress.Commands.add('logout', () => {
  cy.contains('button', 'Logout').click();
});

// Register command
Cypress.Commands.add('register', (email: string, password: string) => {
  cy.visit('/auth');
  cy.contains('button', 'Sign Up').click();
  cy.get('input[formControlName="email"]').type(email);
  cy.get('input[formControlName="password"]').type(password);
  cy.get('input[formControlName="confirmPassword"]').type(password);
  cy.get('button[type="submit"]').click();
});

// Check auth command
Cypress.Commands.add('checkAuth', () => {
  cy.window().its('localStorage').should('have.property', 'luminrank_auth_token');
});

// Create test user command
Cypress.Commands.add('createTestUser', () => {
  const timestamp = Date.now();
  const credentials = {
    email: `testuser${timestamp}@example.com`,
    password: 'TestPassword123!',
    name: `Test User ${timestamp}`
  };

  cy.visit('/auth');
  cy.contains('button', 'Sign Up').click();
  cy.get('input[formControlName="email"]').type(credentials.email);
  cy.get('input[formControlName="password"]').type(credentials.password);
  cy.get('input[formControlName="confirmPassword"]').type(credentials.password);
  cy.get('button[type="submit"]').click();
  
  // Wait for redirect to profile setup
  cy.url().should('include', '/profile-setup', { timeout: 10000 });
  
  // Fill in the name
  cy.get('input[formControlName="name"]').type(credentials.name);
  cy.get('button[type="submit"]').click();
  
  // Wait for redirect to home
  cy.url().should('eq', Cypress.config().baseUrl + '/', { timeout: 10000 });
  
  // Logout after registration
  cy.contains('button', 'Sign Out').click();
  
  // Return credentials for use in tests
  cy.wrap(credentials);
});
