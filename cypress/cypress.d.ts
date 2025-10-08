/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to login with email and password
     * @example cy.loginUser('user@example.com', 'user123')
     */
    loginUser(email: string, password: string): Chainable<void>;
    
    /**
     * Custom command to register and complete profile setup
     * @example cy.registerUser('newuser@example.com', 'password123', 'John Doe')
     */
    registerUser(email: string, password: string, name: string): Chainable<void>;
    
    /**
     * Custom command to logout
     * @example cy.logout()
     */
    logout(): Chainable<void>;
    
    /**
     * Custom command to check if user is authenticated
     * @example cy.checkAuth()
     */
    checkAuth(): Chainable<void>;
    
    /**
     * Custom command to create a test user with auto-generated credentials and login
     * @example cy.createAndLoginTestUser().then(({ email, password, name }) => { ... })
     */
    createAndLoginTestUser(): Chainable<{ email: string; password: string; name: string }>;
  }
}
