describe('Role-Based Access Control', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  describe('Admin User', () => {
    beforeEach(() => {
      cy.login('admin@example.com', 'admin123');
    });

    it('should access admin panel', () => {
      cy.visit('/admin');
      cy.url().should('include', '/admin');
      cy.get('h1').should('contain', 'Admin Panel');
      cy.get('.admin-info').should('contain', 'Admin User');
    });

    it('should see admin-only content on dashboard', () => {
      cy.get('.info-card').should('contain', 'Admin Panel');
      cy.get('button').contains('Go to Admin Panel').should('be.visible');
    });

    it('should display admin role in user info', () => {
      cy.get('.info-card').should('contain', 'Role: Admin');
    });

    it('should have access to admin actions', () => {
      cy.visit('/admin');
      cy.get('.admin-actions-section').should('be.visible');
      cy.get('button').contains('Manage Users').should('be.visible');
      cy.get('button').contains('System Settings').should('be.visible');
      cy.get('button').contains('View Logs').should('be.visible');
    });
  });

  describe('Regular User', () => {
    beforeEach(() => {
      cy.login('user@example.com', 'user123');
    });

    it('should not access admin panel', () => {
      cy.visit('/admin');
      cy.url().should('include', '/unauthorized');
      cy.get('h1').should('contain', 'Access Denied');
    });

    it('should not see admin-only content on dashboard', () => {
      cy.get('.info-card').should('not.contain', 'Admin Panel');
      cy.get('button').contains('Go to Admin Panel').should('not.exist');
    });

    it('should display user role in user info', () => {
      cy.get('.info-card').should('contain', 'Role: User');
    });

    it('should be redirected to unauthorized page with back options', () => {
      cy.visit('/admin');
      cy.get('h1').should('contain', 'Access Denied');
      cy.get('button').contains('Go to Dashboard').should('be.visible');
      cy.get('button').contains('Go Back').should('be.visible');
    });
  });

  describe('Unauthorized Page', () => {
    it('should navigate back to dashboard from unauthorized page', () => {
      cy.login('user@example.com', 'user123');
      cy.visit('/admin'); // This will redirect to unauthorized
      cy.get('button').contains('Go to Dashboard').click();
      cy.url().should('include', '/dashboard');
    });

    it('should navigate back using browser back button from unauthorized page', () => {
      cy.login('user@example.com', 'user123');
      cy.visit('/admin'); // This will redirect to unauthorized
      cy.get('button').contains('Go Back').click();
      cy.url().should('include', '/dashboard');
    });
  });

  describe('Role Persistence', () => {
    it('should maintain admin role across page reloads', () => {
      cy.login('admin@example.com', 'admin123');
      cy.get('.info-card').should('contain', 'Role: Admin');
      
      cy.reload();
      cy.get('.info-card').should('contain', 'Role: Admin');
      
      cy.visit('/admin');
      cy.url().should('include', '/admin');
    });

    it('should maintain user role across page reloads', () => {
      cy.login('user@example.com', 'user123');
      cy.get('.info-card').should('contain', 'Role: User');
      
      cy.reload();
      cy.get('.info-card').should('contain', 'Role: User');
      
      cy.visit('/admin');
      cy.url().should('include', '/unauthorized');
    });
  });
});
