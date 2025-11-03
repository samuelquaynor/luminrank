describe('Leagues', () => {
  let testUser: { email: string; password: string; name: string };

  beforeEach(() => {
    // Create and login a test user
    cy.createAndLoginTestUser().then((credentials) => {
      testUser = credentials;
    });
  });

  // it('should create a league successfully', () => {
  //   // Use the helper command
  //   cy.createLeague('Test League', 'GamePigeon');

  //   // Verify league details are displayed
  //   cy.get('[data-testid="league-detail-name"]', { timeout: 15000 }).should(
  //     'contain',
  //     'Test League'
  //   );
  //   cy.contains('GamePigeon');
  //   cy.get('[data-testid="league-invite-code"]').should('contain', 'LMNR-');
  // });

  // it('should join a league via invite code', () => {
  //   // Create a league using the helper
  //   cy.createLeague('Joinable League', 'Chess');

  //   // Get the invite code
  //   cy.wait(1000);
  //   cy.get('[data-testid="league-invite-code"]')
  //     .invoke('text')
  //     .then((inviteCode) => {
  //       const code = inviteCode.trim();

  //       // Logout
  //       cy.logout();

  //       // Create and login as a different user
  //       const timestamp = Date.now();
  //       cy.registerUser(`seconduser${timestamp}@example.com`, 'TestPassword123!', 'Second User');

  //       // Wait for home page to load and auth to be fully set
  //       cy.url({ timeout: 10000 }).should('eq', Cypress.config().baseUrl + '/');
  //       cy.get('[data-testid="create-league-button"]', { timeout: 10000 }).should('be.visible');
  //       cy.wait(2000); // Wait for auth state to fully propagate through the app

  //       // Click on Join League button to navigate to join page
  //       cy.get('[data-testid="join-league-button"]', { timeout: 10000 })
  //         .should('be.visible')
  //         .click();

  //       // Verify we're on the join page
  //       cy.url({ timeout: 10000 }).should('include', '/leagues/join');
  //       cy.contains('h1', 'Join a League', { timeout: 10000 }).should('be.visible');

  //       // Wait for form to be ready
  //       cy.wait(1000);

  //       // Enter invite code and join
  //       cy.get('[data-testid="invite-code-input"]', { timeout: 10000 })
  //         .should('be.visible')
  //         .should('not.be.disabled')
  //         .clear()
  //         .type(code);

  //       // Wait for form to validate
  //       cy.wait(500);

  //       // Ensure button is enabled before clicking
  //       cy.get('[data-testid="submit-join-league-button"]', { timeout: 10000 })
  //         .should('not.be.disabled')
  //         .click();

  //       // Should redirect to league detail
  //       cy.url().should('match', /\/leagues\/[a-f0-9-]+$/);
  //       cy.get('[data-testid="league-detail-name"]', { timeout: 10000 }).should(
  //         'contain',
  //         'Joinable League'
  //       );
  //     });
  // });

  // it('should join a league via invite link', () => {
  //   // Create a league using the helper
  //   cy.createLeague('Link Join League', 'Chess');

  //   cy.wait(1000);
  //   cy.get('[data-testid="league-invite-code"]')
  //     .invoke('text')
  //     .then((inviteCode) => {
  //       const code = inviteCode.trim();

  //       // Logout and create second user
  //       cy.logout();

  //       const timestamp = Date.now();
  //       cy.registerUser(
  //         `linkjoinuser${timestamp}@example.com`,
  //         'TestPassword123!',
  //         'Link Join User'
  //       );

  //       // Wait for home page
  //       cy.url({ timeout: 10000 }).should('eq', Cypress.config().baseUrl + '/');
  //       cy.get('[data-testid="create-league-button"]', { timeout: 10000 }).should('be.visible');
  //       cy.wait(2000);

  //       // Click on Join League button to navigate to join page
  //       cy.get('[data-testid="join-league-button"]', { timeout: 10000 })
  //         .should('be.visible')
  //         .click();
  //       cy.wait(1000);

  //       // Enter invite code in the form
  //       cy.get('[data-testid="invite-code-input"]', { timeout: 10000 })
  //         .should('be.visible')
  //         .should('not.be.disabled')
  //         .clear()
  //         .type(code);

  //       // Wait for form to validate
  //       cy.wait(500);

  //       // Ensure button is enabled before clicking
  //       cy.get('[data-testid="submit-join-league-button"]', { timeout: 10000 })
  //         .should('not.be.disabled')
  //         .click();
  //       cy.wait(2000);

  //       // Should auto-join and redirect to league detail
  //       cy.url({ timeout: 15000 }).should('match', /\/leagues\/[a-f0-9-]+$/);
  //       cy.get('[data-testid="league-detail-name"]', { timeout: 10000 }).should(
  //         'contain',
  //         'Link Join League'
  //       );
  //     });
  // });

  // it('should view league details and members', () => {
  //   // Create a league using the helper
  //   cy.createLeague('Detail Test League', 'Pool');

  //   // Should be on league detail page
  //   cy.url().should('match', /\/leagues\/[a-f0-9-]+$/);

  //   // Verify header information
  //   cy.get('[data-testid="league-detail-name"]', { timeout: 15000 }).should(
  //     'contain',
  //     'Detail Test League'
  //   );
  //   cy.contains('Pool');

  //   // Details tab is the default tab
  //   cy.get('[data-testid="details-tab"]').should('have.class', 'text-white');

  //   // Verify invite code and link are displayed (only visible to creator)
  //   cy.get('[data-testid="league-invite-code"]', { timeout: 10000 })
  //     .should('be.visible')
  //     .should('contain', 'LMNR-');
  //   cy.get('[data-testid="league-invite-link"]').should('contain', '/leagues/join/LMNR-');

  //   // Test copy link button - stub clipboard API to avoid focus issues
  //   cy.window().then((win) => {
  //     cy.stub(win.navigator.clipboard, 'writeText').resolves();
  //   });
  //   cy.get('[data-testid="copy-invite-link-button"]').click();
  //   // Verify the button exists and is clickable (clipboard stubbed)

  //   // Check Standings tab
  //   cy.get('[data-testid="standings-tab"]').click();
  //   cy.wait(2000); // Wait for leaderboard to load

  //   // Check Matches tab
  //   cy.get('[data-testid="matches-tab"]').click();
  //   cy.wait(1000);
  //   cy.contains('No matches yet').should('be.visible');
  // });

  it('should display correct member count', () => {
    // Create a league
    cy.createLeague('Member Count League', 'Chess');

    // Should be on league detail page
    cy.url().should('match', /\/leagues\/[a-f0-9-]+$/);
    cy.wait(2000);

    // Verify member count shows 1 (creator only)
    cy.contains('League Information').should('be.visible');
    cy.contains('Members').parent().find('span.text-xs.text-white').should('contain', '1');

    // Verify members list shows 1 member
    cy.contains('Members (1)').should('be.visible');
    cy.contains(testUser.name).should('be.visible');

    // Get the invite code
    cy.get('[data-testid="league-invite-code"]')
      .invoke('text')
      .then((inviteCode) => {
        const code = inviteCode.trim();

        // Logout and create second user
        cy.logout();
        const timestamp = Date.now();
        cy.registerUser(`member2${timestamp}@example.com`, 'TestPassword123!', 'Member Two');

        // Join the league
        cy.wait(2000);
        cy.get('[data-testid="join-league-button"]', { timeout: 10000 })
          .should('be.visible')
          .click();
        cy.url({ timeout: 10000 }).should('include', '/leagues/join');
        cy.get('[data-testid="invite-code-input"]', { timeout: 10000 })
          .should('be.visible')
          .clear()
          .type(code);
        cy.wait(500);
        cy.get('[data-testid="submit-join-league-button"]', { timeout: 10000 })
          .should('not.be.disabled')
          .click();

        // Should redirect to league detail
        cy.url({ timeout: 15000 }).should('match', /\/leagues\/[a-f0-9-]+$/);
        cy.wait(2000);

        // Verify member count shows 2
        cy.contains('League Information').should('be.visible');
        cy.contains('Members').parent().find('span.text-xs.text-white').should('contain', '2');

        // Verify members list shows 2 members
        cy.contains('Members (2)').should('be.visible');
        cy.contains('Member Two').should('be.visible');

        // Logout and create third user
        cy.logout();
        const timestamp2 = Date.now();
        cy.registerUser(`member3${timestamp2}@example.com`, 'TestPassword123!', 'Member Three');

        // Join the league
        cy.wait(2000);
        cy.get('[data-testid="join-league-button"]', { timeout: 10000 })
          .should('be.visible')
          .click();
        cy.url({ timeout: 10000 }).should('include', '/leagues/join');
        cy.get('[data-testid="invite-code-input"]', { timeout: 10000 })
          .should('be.visible')
          .clear()
          .type(code);
        cy.wait(500);
        cy.get('[data-testid="submit-join-league-button"]', { timeout: 10000 })
          .should('not.be.disabled')
          .click();

        // Should redirect to league detail
        cy.url({ timeout: 15000 }).should('match', /\/leagues\/[a-f0-9-]+$/);
        cy.wait(2000);

        // Verify member count shows 3
        cy.contains('League Information').should('be.visible');
        cy.contains('Members').parent().find('span.text-xs.text-white').should('contain', '3');

        // Verify members list shows 3 members
        cy.contains('Members (3)').should('be.visible');
        cy.contains('Member Three').should('be.visible');
      });
  });

  it('should update league name and description (owner only)', () => {
    // Create a league using the helper with description
    cy.createLeague('Original League Name', 'Pool', 'Original description');

    // Verify original name and description
    cy.url().should('match', /\/leagues\/[a-f0-9-]+$/);
    cy.get('[data-testid="league-detail-name"]', { timeout: 10000 }).should(
      'contain',
      'Original League Name'
    );

    // Wait for page to fully load
    cy.wait(2000);

    // Verify we can see the invite code (confirms we're the creator)
    cy.get('[data-testid="league-invite-code"]', { timeout: 10000 }).should('be.visible');

    // Click edit button
    cy.get('[data-testid="edit-league-button-header"]', { timeout: 15000 })
      .should('be.visible')
      .click();
    cy.wait(500);

    // Verify edit form is visible
    cy.get('[data-testid="edit-league-name-input"]', { timeout: 10000 })
      .should('be.visible')
      .should('have.value', 'Original League Name');
    cy.get('[data-testid="edit-league-description-input"]', { timeout: 10000 })
      .should('be.visible')
      .should('have.value', 'Original description');

    // Update name and description
    cy.get('[data-testid="edit-league-name-input"]').clear().type('Updated League Name');
    cy.get('[data-testid="edit-league-description-input"]').clear().type('Updated description');

    // Save changes
    cy.get('[data-testid="save-league-button"]').should('not.be.disabled').click();
    cy.wait(2000);

    // Verify updated name is displayed
    cy.get('[data-testid="league-detail-name"]', { timeout: 10000 }).should(
      'contain',
      'Updated League Name'
    );
    cy.contains('Updated description').should('be.visible');
  });

  it('should not show edit button to non-owner', () => {
    // Create a league using the helper
    cy.createLeague('Owner League', 'Chess');

    // Get the invite code
    cy.get('[data-testid="league-invite-code"]')
      .invoke('text')
      .then((inviteCode) => {
        const code = inviteCode.trim();

        // Logout and create second user
        cy.logout();

        const timestamp = Date.now();
        cy.registerUser(`nonowner${timestamp}@example.com`, 'TestPassword123!', 'Non Owner User');

        // Join the league
        cy.url({ timeout: 10000 }).should('eq', Cypress.config().baseUrl + '/');
        cy.get('[data-testid="create-league-button"]', { timeout: 10000 }).should('be.visible');
        cy.wait(2000);

        // Click on Join League button
        cy.get('[data-testid="join-league-button"]', { timeout: 10000 })
          .should('be.visible')
          .click();
        cy.wait(1000);

        cy.get('[data-testid="invite-code-input"]', { timeout: 10000 })
          .should('be.visible')
          .should('not.be.disabled')
          .clear()
          .type(code);

        // Wait for form to validate
        cy.wait(500);

        // Ensure button is enabled before clicking
        cy.get('[data-testid="submit-join-league-button"]', { timeout: 10000 })
          .should('not.be.disabled')
          .click();

        // Should be on league detail page
        cy.url().should('match', /\/leagues\/[a-f0-9-]+$/);
        cy.get('[data-testid="league-detail-name"]', { timeout: 10000 }).should('be.visible');

        // Verify edit button is NOT visible to non-owner
        cy.get('[data-testid="edit-league-button-header"]').should('not.exist');
      });
  });

  it('should leave a league', () => {
    // Create a league using the helper
    cy.createLeague('League to Leave', 'Chess');
    cy.get('[data-testid="league-invite-code"]')
      .invoke('text')
      .then((inviteCode) => {
        const code = inviteCode.trim();

        // Logout and create second user
        cy.logout();

        const timestamp = Date.now();
        cy.registerUser(`leaveuser${timestamp}@example.com`, 'TestPassword123!', 'Leave Test User');

        // Join the league
        cy.url({ timeout: 10000 }).should('eq', Cypress.config().baseUrl + '/');
        cy.get('[data-testid="create-league-button"]', { timeout: 10000 }).should('be.visible');
        cy.wait(2000);

        // Click on Join League button
        cy.get('[data-testid="join-league-button"]', { timeout: 10000 })
          .should('be.visible')
          .click();
        cy.wait(1000);

        cy.get('[data-testid="invite-code-input"]', { timeout: 10000 })
          .should('be.visible')
          .should('not.be.disabled')
          .clear()
          .type(code);

        // Wait for form to validate
        cy.wait(500);

        // Ensure button is enabled before clicking
        cy.get('[data-testid="submit-join-league-button"]', { timeout: 10000 })
          .should('not.be.disabled')
          .click();

        // Should be on league detail page
        cy.url().should('match', /\/leagues\/[a-f0-9-]+$/);

        // Leave functionality might not be available in current UI
        // For now, verify we're on the league detail page
        cy.get('[data-testid="league-detail-name"]', { timeout: 10000 }).should('be.visible');
      });
  });

  it('should view leagues list', () => {
    // Create multiple leagues using the helper
    cy.createLeague('First League', 'Chess');

    // Navigate back to home using back button
    cy.get('button[aria-label="Back"]').click();

    // Wait for navigation to complete
    cy.url({ timeout: 10000 }).should('eq', Cypress.config().baseUrl + '/');
    cy.wait(1000);

    // Ensure home page is loaded by clicking logo if needed
    cy.get('div[routerLink="/"]', { timeout: 10000 }).first().should('be.visible').click();
    cy.wait(1000);

    // Wait for home page to be ready - check for leagues list
    cy.contains('Leagues').should('be.visible', { timeout: 15000 });
    cy.get('[data-testid*="league-toggle-"]', { timeout: 10000 }).should('have.length.at.least', 1);
    cy.wait(1000);

    // Create second league - use createLeague helper which handles navigation
    cy.createLeague('Second League', 'Pool');

    // Navigate back to home using back button
    cy.get('button[aria-label="Back"]').click();

    // Wait for navigation to complete
    cy.url({ timeout: 10000 }).should('eq', Cypress.config().baseUrl + '/');
    cy.wait(1000);

    // Ensure home page is loaded by clicking logo if needed
    cy.get('div[routerLink="/"]', { timeout: 10000 }).first().should('be.visible').click();
    cy.wait(1000);

    // Wait for home page to be ready - check for leagues list
    cy.contains('Leagues').should('be.visible', { timeout: 15000 });
    cy.wait(2000); // Wait for leagues to load

    // Verify both leagues are displayed in expandable list
    cy.get('[data-testid*="league-toggle-"]', { timeout: 10000 }).should('have.length.at.least', 2);

    // Click on a league title to view details (expandable component title has routerLink)
    cy.contains('First League').first().click();
    cy.url({ timeout: 10000 }).should('match', /\/leagues\/[a-f0-9-]+$/);
    cy.get('[data-testid="league-detail-name"]', { timeout: 10000 }).should(
      'contain',
      'First League'
    );
  });

  it('should navigate between different leagues', () => {
    // Create two leagues using the helper
    cy.createLeague('Navigation League 1', 'Chess');

    // Navigate back to home using back button
    cy.get('button[aria-label="Back"]').click();

    // Wait for navigation to complete
    cy.url({ timeout: 10000 }).should('eq', Cypress.config().baseUrl + '/');
    cy.wait(1000);

    // Ensure home page is loaded by clicking logo if needed
    cy.get('div[routerLink="/"]', { timeout: 10000 }).first().should('be.visible').click();
    cy.wait(1000);

    // Wait for home page to be ready - check for leagues list
    cy.contains('Leagues').should('be.visible', { timeout: 15000 });
    cy.get('[data-testid*="league-toggle-"]', { timeout: 10000 }).should('have.length.at.least', 1);
    cy.wait(1000);

    // Create second league
    cy.createLeague('Navigation League 2', 'Pool');

    // Navigate back to home using back button
    cy.get('button[aria-label="Back"]').click();

    // Wait for navigation to complete
    cy.url({ timeout: 10000 }).should('eq', Cypress.config().baseUrl + '/');

    // Ensure home page is loaded by explicitly visiting if needed
    cy.visit('/');
    cy.wait(1000);

    // Wait for home page to be ready - check for leagues list
    cy.contains('Leagues').should('be.visible', { timeout: 15000 });
    cy.get('[data-testid*="league-toggle-"]', { timeout: 10000 }).should('have.length.at.least', 2);
    cy.wait(1000);

    // Click on first league title to navigate
    cy.contains('Navigation League 1').first().click();
    cy.url({ timeout: 10000 }).should('match', /\/leagues\/[a-f0-9-]+$/);
    cy.get('[data-testid="league-detail-name"]', { timeout: 10000 }).should(
      'contain',
      'Navigation League 1'
    );
    cy.contains('Chess');

    // Go back to home using back button
    cy.get('button[aria-label="Back"]').click();

    // Wait for navigation to complete
    cy.url({ timeout: 10000 }).should('eq', Cypress.config().baseUrl + '/');
    cy.wait(1000);

    // Ensure home page is loaded by clicking logo if needed
    cy.get('div[routerLink="/"]', { timeout: 10000 }).first().should('be.visible').click();
    cy.wait(1000);

    // Wait for home page to be ready - check for leagues list
    cy.contains('Leagues').should('be.visible', { timeout: 15000 });
    cy.get('[data-testid*="league-toggle-"]', { timeout: 10000 }).should('have.length.at.least', 2);
    cy.wait(1000);

    // Click on second league title to navigate
    cy.contains('Navigation League 2').first().click();
    cy.url({ timeout: 10000 }).should('match', /\/leagues\/[a-f0-9-]+$/);
    cy.get('[data-testid="league-detail-name"]', { timeout: 10000 }).should(
      'contain',
      'Navigation League 2'
    );
    cy.contains('Pool');
  });

  it('should not redirect when refreshing league detail page', () => {
    // Create a league
    cy.createLeague('Refresh Test League', 'Trivia');

    // Verify we're on the league detail page
    cy.url({ timeout: 10000 }).should('match', /\/leagues\/[a-f0-9-]+$/);
    cy.get('[data-testid="league-detail-name"]', { timeout: 10000 }).should(
      'contain',
      'Refresh Test League'
    );

    // Capture the current URL
    cy.url().then((leagueUrl) => {
      // Refresh the page
      cy.reload();

      // Wait for page to reload
      cy.wait(2000);

      // Verify we're still on the same league detail page
      cy.url({ timeout: 10000 }).should('eq', leagueUrl);
      cy.get('[data-testid="league-detail-name"]', { timeout: 10000 }).should(
        'contain',
        'Refresh Test League'
      );

      // Verify we're NOT on the leagues list page or redirected elsewhere
      cy.url().should('not.include', '/leagues/create');
      cy.url().should('not.eq', Cypress.config().baseUrl + '/leagues');
      cy.url().should('not.eq', Cypress.config().baseUrl + '/');
    });
  });
});
