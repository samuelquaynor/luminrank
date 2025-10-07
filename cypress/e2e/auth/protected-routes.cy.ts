describe('Protected Routes', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('should redirect to login when accessing dashboard without auth', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
    cy.get('h2').should('contain', 'Sign In');
  });

  it('should redirect to login when accessing admin without auth', () => {
    cy.visit('/admin');
    cy.url().should('include', '/login');
    cy.get('h2').should('contain', 'Sign In');
  });

  it('should redirect to login with return URL', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
    cy.url().should('include', 'returnUrl=%2Fdashboard');
  });

  it('should allow access to dashboard after login', () => {
    cy.login('user@example.com', 'user123');
    cy.url().should('include', '/dashboard');
    cy.get('h1').should('contain', 'Welcome to Dashboard');
  });

  it('should allow access to admin panel for admin user', () => {
    cy.login('admin@example.com', 'admin123');
    cy.visit('/admin');
    cy.url().should('include', '/admin');
    cy.get('h1').should('contain', 'Admin Panel');
  });

  it('should redirect to unauthorized for regular user accessing admin', () => {
    cy.login('user@example.com', 'user123');
    cy.visit('/admin');
    cy.url().should('include', '/unauthorized');
    cy.get('h1').should('contain', 'Access Denied');
  });

  it('should maintain auth state across page reloads', () => {
    cy.login('user@example.com', 'user123');
    cy.url().should('include', '/dashboard');
    
    cy.reload();
    cy.url().should('include', '/dashboard');
    cy.get('h1').should('contain', 'Welcome to Dashboard');
    cy.get('.user-info').should('contain', 'Regular User');
  });

  it('should redirect to dashboard when accessing root path', () => {
    cy.login('user@example.com', 'user123');
    cy.visit('/');
    cy.url().should('include', '/dashboard');
  });

  it('should handle 404 routes by redirecting to dashboard', () => {
    cy.login('user@example.com', 'user123');
    cy.visit('/non-existent-route');
    cy.url().should('include', '/dashboard');
  });
});
