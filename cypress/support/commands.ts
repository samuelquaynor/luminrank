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
       * @example cy.register('newuser@example.com', 'password123', 'New User')
       */
      register(email: string, password: string, name: string): Chainable<void>;
      
      /**
       * Custom command to check if user is authenticated
       * @example cy.checkAuth()
       */
      checkAuth(): Chainable<void>;
    }
  }
}

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('input[formControlName="email"]').clear();
  cy.get('input[formControlName="email"]').type(email);
  cy.get('input[formControlName="password"]').clear();
  cy.get('input[formControlName="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/dashboard');
});

// Logout command
Cypress.Commands.add('logout', () => {
  cy.get('button').contains('Logout').click();
  cy.url().should('include', '/login');
});

// Register command
Cypress.Commands.add('register', (email: string, password: string, name: string) => {
  cy.visit('/register');
  cy.get('input[formControlName="name"]').clear();
  cy.get('input[formControlName="name"]').type(name);
  cy.get('input[formControlName="email"]').clear();
  cy.get('input[formControlName="email"]').type(email);
  cy.get('input[formControlName="password"]').clear();
  cy.get('input[formControlName="password"]').type(password);
  cy.get('input[formControlName="confirmPassword"]').clear();
  cy.get('input[formControlName="confirmPassword"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/dashboard');
});

// Check auth command
Cypress.Commands.add('checkAuth', () => {
  cy.window().its('localStorage').should('have.property', 'luminrank_auth_token');
});
