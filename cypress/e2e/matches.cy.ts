/**
 * E2E tests for Match Recording & Leaderboard (Phase 2)
 */
describe('Matches', () => {
  let testUser: { email: string; password: string; name: string };

  beforeEach(() => {
    cy.createAndLoginTestUser().then((credentials) => {
      testUser = credentials;
    });
  });

  // describe('Match Recording', () => {
  //   it('should record a match and display real data in matches tab and leaderboard', () => {
  //     // Create a league
  //     cy.visit('/');
  //     cy.createLeague('Match Data Test League', 'Chess');

  //     // Navigate to details tab to get invite code
  //     cy.get('[data-testid="details-tab"]').click();
  //     cy.wait(1000);

  //     cy.get('[data-testid="league-invite-code"]')
  //       .invoke('text')
  //       .then((inviteCode) => {
  //         const code = inviteCode.trim();

  //         // Logout and create second user
  //         cy.logout();

  //         const timestamp = Date.now();
  //         const opponentEmail = `matchopp${timestamp}@example.com`;
  //         cy.registerUser(opponentEmail, 'TestPassword123!', 'Match Opponent');

  //         // Wait for home page
  //         cy.get('[data-testid="welcome-message"]', { timeout: 10000 }).should('be.visible');
  //         cy.wait(3000);

  //         // Join the league via invite link (auto-joins)
  //         cy.visit(`/leagues/join/${code}`);
  //         cy.wait(2000);

  //         // Should auto-join and redirect to league detail
  //         cy.url({ timeout: 15000 }).should('match', /\/leagues\/[a-f0-9-]+$/);
  //         cy.get('[data-testid="league-detail-name"]').should('contain', 'Match Data Test League');

  //         // Capture league ID
  //         cy.url().then((url) => {
  //           const urlMatches = url.match(/\/leagues\/([a-f0-9-]+)/);
  //           const leagueId = urlMatches![1];

  //           // Navigate to matches tab to find record match button
  //           cy.get('[data-testid="matches-tab"]').click();
  //           cy.wait(1000);

  //           // Record a match as the opponent (currently logged in)
  //           cy.get('[data-testid="record-match-button"]', { timeout: 10000 })
  //             .should('be.visible')
  //             .click();
  //           cy.url().should('include', '/record-match');
  //           cy.wait(2000);

  //           // Fill in match details with real data
  //           cy.get('[data-testid="player1-select"]').select(1); // Match Opponent (current user)
  //           cy.wait(500);
  //           cy.get('[data-testid="player1-score-input"]').clear().type('15', { force: true });
  //           cy.get('[data-testid="player1-result-select"]').select('win');
  //           cy.wait(500);

  //           cy.get('[data-testid="player2-select"]').select(2); // Main user
  //           cy.wait(500);
  //           cy.get('[data-testid="player2-score-input"]').clear().type('8', { force: true });
  //           cy.get('[data-testid="player2-result-select"]').select('loss');
  //           cy.wait(500);

  //           // Submit the match
  //           cy.get('[data-testid="submit-record-match-button"]').should('not.be.disabled').click();

  //           // Wait for redirect or check for errors
  //           cy.wait(5000);

  //           // Check if we're redirected or if there's an error
  //           cy.url().then((currentUrl) => {
  //             if (currentUrl.includes('/record-match')) {
  //               // Still on record page - check for error message
  //               cy.log('Still on record-match page, checking for errors');
  //               cy.get('body').then(($body) => {
  //                 cy.log($body.text());
  //               });
  //             }
  //           });

  //           // Navigate to league detail manually if needed
  //           cy.visit(`/leagues/${leagueId}`);
  //           cy.wait(3000); // Wait for data to load

  //           // ✅ VERIFY LEADERBOARD DISPLAYS REAL DATA (not empty state)
  //           cy.get('[data-testid="standings-tab"]').click();
  //           cy.wait(1000);
  //           cy.get('[data-testid="standings-tab"]').should('have.class', 'text-white');

  //           // Check that leaderboard displays player names
  //           cy.get('[data-testid^="leaderboard-row-"]', { timeout: 10000 }).should(
  //             'have.length.at.least',
  //             2
  //           );
  //           cy.contains('Match Opponent').should('be.visible');
  //           cy.contains(testUser.name).should('be.visible');

  //           // Verify actual stats are shown (not just empty state)
  //           cy.get('[data-testid="leaderboard-row-1"]').should('be.visible');
  //           // Check for actual numbers in the leaderboard (matches, wins, points)
  //           cy.get('[data-testid="leaderboard-row-1"]').invoke('text').should('match', /[1-9]/); // Should contain at least one non-zero number

  //           // ✅ VERIFY MATCHES TAB DISPLAYS REAL DATA
  //           cy.get('[data-testid="matches-tab"]').click();
  //           cy.wait(2000);

  //           // Verify match card displays with real player names and scores
  //           cy.get('[data-testid^="match-card-"]', { timeout: 10000 }).should('have.length', 1);
  //           cy.contains('Match Opponent').should('be.visible');
  //           cy.contains(testUser.name).should('be.visible');
  //           cy.contains('15').should('be.visible'); // Winner score
  //           cy.contains('8').should('be.visible'); // Loser score
  //           cy.contains('WIN').should('be.visible'); // Result badge
  //         });
  //       });
  //   });

  //   it('should show validation errors for invalid match data', () => {
  //     // Create a league
  //     cy.visit('/');
  //     cy.createLeague('Validation Test League', 'Pool');

  //     // Wait for page to load
  //     cy.wait(2000);

  //     // Navigate to matches tab where record match button is
  //     cy.get('[data-testid="matches-tab"]').click();
  //     cy.wait(1000);
  //     cy.get('[data-testid="record-match-button"]', { timeout: 10000 })
  //       .should('be.visible')
  //       .click();
  //     cy.url().should('include', '/record-match');

  //     cy.wait(2000);

  //     // Try to submit without filling the form
  //     cy.get('[data-testid="submit-record-match-button"]').should('be.disabled');
  //   });
  // });

  // describe('Leaderboard', () => {
  //   it.only('should display matches after users join and league is started', () => {
  //     // Stub window.confirm to return true
  //     cy.window().then((win) => {
  //       cy.stub(win, 'confirm').returns(true);
  //     });

  //     // Create a league
  //     cy.visit('/');
  //     cy.createLeague('Test League With Matches', 'Chess');

  //     // Wait for page to load
  //     cy.wait(2000);
  //     cy.get('[data-testid="league-detail-name"]', { timeout: 10000 }).should('be.visible');

  //     // Navigate to details tab to get invite code
  //     cy.get('[data-testid="details-tab"]').click();
  //     cy.wait(1000);

  //     // Get invite code
  //     cy.get('[data-testid="league-invite-code"]')
  //       .invoke('text')
  //       .then((inviteCode) => {
  //         const code = inviteCode.trim();

  //         // Capture league ID
  //         cy.url().then((url) => {
  //           const urlMatches = url.match(/\/leagues\/([a-f0-9-]+)/);
  //           const leagueId = urlMatches![1];

  //           // Logout and add a member
  //           cy.logout();
  //           const timestamp = Date.now();
  //           cy.registerUser(`member${timestamp}@example.com`, 'TestPassword123!', 'Member User');

  //           // Join the league
  //           cy.visit(`/leagues/join/${code}`);
  //           cy.wait(2000);
  //           cy.url({ timeout: 15000 }).should('match', /\/leagues\/[a-f0-9-]+$/);

  //           // Logout and sign in as creator
  //           cy.logout();
  //           cy.loginUser(testUser.email, testUser.password);
  //           cy.wait(2000);

  //           // Navigate back to league
  //           cy.visit(`/leagues/${leagueId}`);
  //           cy.wait(3000);

  //           // Wait for page to load
  //           cy.get('[data-testid="league-detail-name"]', { timeout: 10000 }).should('be.visible');

  //           // Navigate to details tab where Start League button is
  //           cy.get('[data-testid="details-tab"]', { timeout: 10000 }).should('be.visible').click();
  //           cy.wait(1000);

  //           // Verify Start League button is visible
  //           cy.get('[data-testid="start-league-button"]', { timeout: 10000 }).should('be.visible');

  //           // Start the league
  //           cy.get('[data-testid="start-league-button"]').click();

  //           // Wait for league to start (matches to be generated)
  //           cy.wait(5000);

  //           // Navigate to matches tab to verify matches are displayed
  //           cy.get('[data-testid="matches-tab"]').click();
  //           cy.wait(2000);

  //           // Verify scheduled matches are displayed
  //           // For 2 players, should have 1 scheduled match
  //           cy.get('[data-testid^="match-card-"]', { timeout: 10000 }).should(
  //             'have.length.at.least',
  //             1
  //           );

  //           // Verify match shows as scheduled
  //           cy.contains('Scheduled').should('be.visible');

  //           // Verify both player names are shown in the match
  //           cy.contains(testUser.name).should('be.visible');
  //           cy.contains('Member User').should('be.visible');
  //         });
  //       });
  //   });

  //   it('should navigate between tabs', () => {
  //     // Create a league
  //     cy.visit('/');
  //     cy.createLeague('Tab Navigation League', 'Pool');

  //     // Wait for page to load
  //     cy.wait(2000);

  //     // Verify details tab is active by default
  //     cy.get('[data-testid="details-tab"]').should('have.class', 'text-white');

  //     // Click matches tab
  //     cy.get('[data-testid="matches-tab"]').click();
  //     cy.wait(1000);
  //     cy.contains('Match History').should('be.visible');
  //     cy.contains('No Matches Yet').should('be.visible');

  //     // Click standings tab
  //     cy.get('[data-testid="standings-tab"]').click();
  //     cy.wait(1000);
  //     cy.contains('Leaderboard').should('be.visible');
  //     cy.contains('No Matches Yet').should('be.visible');

  //     // Go back to details
  //     cy.get('[data-testid="details-tab"]').click();
  //     cy.wait(1000);
  //     cy.contains('League Overview').should('be.visible');
  //   });

  //   it('should show record match button on matches tab', () => {
  //     // Create a league
  //     cy.visit('/');
  //     cy.createLeague('Record Button League', 'Chess');

  //     // Wait for page to load
  //     cy.wait(2000);

  //     // Navigate to matches tab where record match button is
  //     cy.get('[data-testid="matches-tab"]').click();
  //     cy.wait(1000);

  //     // Verify record match button exists on matches tab
  //     cy.get('[data-testid="matches-tab"]').should('have.class', 'text-white');
  //     cy.get('[data-testid="record-match-button"]', { timeout: 10000 }).should('be.visible');
  //     cy.get('[data-testid="record-match-button"]').should('contain', 'Record Match');
  //   });
  // });

  // describe('Match History', () => {
  //   it('should display empty state for matches tab', () => {
  //     // Create a league
  //     cy.visit('/');
  //     cy.createLeague('Empty Matches League', 'GamePigeon');

  //     // Wait for page to load
  //     cy.wait(2000);

  //     // Navigate to matches tab
  //     cy.get('[data-testid="matches-tab"]').click();
  //     cy.wait(1000);

  //     // Should show empty state
  //     cy.contains('Match History').should('be.visible');
  //     cy.contains('No Matches Yet').should('be.visible');
  //     cy.contains('Be the first to record a match!').should('be.visible');
  //   });

  //   it('should show record match button on matches tab', () => {
  //     // Create a league
  //     cy.visit('/');
  //     cy.createLeague('Matches Tab League', 'Pool');

  //     // Wait for page to load
  //     cy.wait(2000);

  //     // Navigate to matches tab
  //     cy.get('[data-testid="matches-tab"]').click();
  //     cy.wait(1000);

  //     // Verify record match button exists on matches tab
  //     cy.get('[data-testid="record-match-button"]', { timeout: 10000 }).should('be.visible');
  //     cy.get('[data-testid="record-match-button"]').should('contain', 'Record Match');
  //   });
  // });

  describe('Start League', () => {
    // it('should start league and generate scheduled matches', () => {
    //   // Stub window.confirm to return true
    //   cy.window().then((win) => {
    //     cy.stub(win, 'confirm').returns(true);
    //   });

    //   // Create a league
    //   cy.visit('/');
    //   cy.createLeague('Generate Matches Test', 'Chess');

    //   // Get invite code
    //   cy.get('[data-testid="league-invite-code"]')
    //     .invoke('text')
    //     .then((inviteCode) => {
    //       const code = inviteCode.trim();

    //       // Logout and add a member
    //       cy.logout();

    //       const timestamp = Date.now();
    //       cy.registerUser(`member${timestamp}@example.com`, 'TestPassword123!', 'Member User');

    //       // Join the league
    //       cy.visit(`/leagues/join/${code}`);
    //       cy.wait(2000);
    //       cy.url({ timeout: 15000 }).should('match', /\/leagues\/[a-f0-9-]+$/);

    //       // Logout and sign in as creator
    //       cy.logout();
    //       cy.loginUser(testUser.email, testUser.password);
    //       cy.wait(2000);

    //       // Navigate to home page using logo if not already there
    //       cy.get('div[routerLink="/"]', { timeout: 10000 }).first().should('be.visible').click();
    //       cy.wait(1000);

    //       // Wait for home page to load - check for leagues list
    //       cy.contains('Leagues').should('be.visible', { timeout: 15000 });
    //       cy.get('[data-testid*="league-toggle-"]', { timeout: 10000 }).should(
    //         'have.length.at.least',
    //         1
    //       );
    //       cy.wait(1000);

    //       // Click on league name to navigate to league detail
    //       cy.contains('Generate Matches Test').should('be.visible', { timeout: 10000 }).click();
    //       cy.wait(2000);

    //       // Wait for league detail page to load
    //       cy.get('[data-testid="league-detail-name"]', { timeout: 10000 }).should('be.visible');

    //       // Navigate to details tab where Start League button is
    //       cy.get('[data-testid="details-tab"]').click();
    //       cy.wait(1000);

    //       // Verify Start League button is visible
    //       cy.get('[data-testid="start-league-button"]', { timeout: 10000 }).should('be.visible');

    //       // Click Start League button
    //       cy.get('[data-testid="start-league-button"]').click();

    //       // Wait for league to start (matches to be generated)
    //       cy.wait(5000);

    //       // Verify Start League button is no longer visible (league is now active)
    //       cy.get('[data-testid="start-league-button"]').should('not.exist');

    //       // Navigate to matches tab
    //       cy.get('[data-testid="matches-tab"]').click();
    //       cy.wait(2000);

    //       // Verify scheduled matches are displayed
    //       // For 2 players, should have 1 scheduled match
    //       cy.get('[data-testid^="match-card-"]', { timeout: 10000 }).should(
    //         'have.length.at.least',
    //         1
    //       );

    //       // Verify match shows as scheduled
    //       cy.contains('Scheduled').should('be.visible');

    //       // Verify both player names are shown in the match
    //       cy.contains(testUser.name).should('be.visible');
    //       cy.contains('Member User').should('be.visible');
    //     });
    // });
    it('should generate correct number of matches for 4 players', () => {
      // Stub window.confirm to auto-accept
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true);
      });

      // Create a league
      cy.visit('/');
      cy.createLeague('Four Player League', 'Chess');

      // Get invite code
      cy.get('[data-testid="league-invite-code"]')
        .invoke('text')
        .then((inviteCode) => {
          const code = inviteCode.trim();

          // Capture league ID
          cy.url().then((url) => {
            const urlMatches = url.match(/\/leagues\/([a-f0-9-]+)/);
            const leagueId = urlMatches![1];

            // Add 3 more members using the join flow
            for (let i = 1; i <= 3; i++) {
              cy.logout();
              const timestamp = Date.now() + i; // Ensure unique timestamps
              cy.registerUser(`member${timestamp}@example.com`, 'TestPassword123!', `Member ${i}`);

              // Navigate to home and use Join League button
              cy.get('div[routerLink="/"]', { timeout: 10000 })
                .first()
                .should('be.visible')
                .click();
              cy.wait(1000);

              // Click Join League button
              cy.get('[data-testid="join-league-button"]', { timeout: 10000 })
                .should('be.visible')
                .click();
              cy.wait(500);

              // Enter invite code
              cy.get('[data-testid="invite-code-input"]', { timeout: 10000 })
                .should('be.visible')
                .type(code);
              cy.wait(500);

              // Click submit
              cy.get('[data-testid="submit-join-league-button"]').should('not.be.disabled').click();

              // Wait for redirect to league detail page
              cy.url({ timeout: 15000 }).should('match', /\/leagues\/[a-f0-9-]+$/);
              cy.wait(2000);
            }

            // Logout and sign in as creator
            cy.logout();
            cy.loginUser(testUser.email, testUser.password);
            cy.wait(2000);

            // Navigate to home page using logo if not already there
            cy.get('div[routerLink="/"]', { timeout: 10000 }).first().should('be.visible').click();
            cy.wait(1000);

            // Wait for home page to load - check for leagues list
            cy.contains('Leagues').should('be.visible', { timeout: 15000 });
            cy.get('[data-testid*="league-toggle-"]', { timeout: 10000 }).should(
              'have.length.at.least',
              1
            );
            cy.wait(1000);

            // Click on league name to navigate to league detail
            cy.contains('Four Player League').should('be.visible', { timeout: 10000 }).click();
            cy.wait(2000);

            // Wait for league detail page to load
            cy.get('[data-testid="league-detail-name"]', { timeout: 10000 }).should('be.visible');

            // Navigate to details tab where Start League button is
            cy.get('[data-testid="details-tab"]', { timeout: 10000 }).should('be.visible').click();
            cy.wait(1000);

            // // Start the league
            cy.get('[data-testid="start-league-button"]', { timeout: 10000 })
              .should('be.visible')
              .click();

            // Wait for match generation and reload
            cy.wait(8000);

            // Navigate to matches tab
            cy.get('[data-testid="matches-tab"]').click();
            cy.wait(2000);

            // Verify scheduled matches are displayed
            // For 4 players, should have 6 matches (3 rounds * 2 matches per round)
            cy.get('[data-testid^="match-card-"]', { timeout: 10000 }).should('have.length', 6);

            // Verify matches show as scheduled
            cy.contains('Scheduled').should('be.visible');
          });
        });
    });
  });

  // describe('Integration', () => {
  //   it('should navigate to record match from matches tab', () => {
  //     // Create a league
  //     cy.visit('/');
  //     cy.createLeague('Navigation Test League', 'Chess');

  //     // Wait for page to load
  //     cy.wait(2000);

  //     // Navigate to matches tab
  //     cy.get('[data-testid="matches-tab"]').click();
  //     cy.wait(1000);

  //     // Click record match button from matches tab
  //     cy.get('[data-testid="record-match-button"]', { timeout: 10000 })
  //       .should('be.visible')
  //       .click();
  //     cy.url().should('include', '/record-match');
  //     cy.get('h1').should('contain', 'Record Match');
  //   });

  //   it('should navigate back from record match page', () => {
  //     // Create a league
  //     cy.visit('/');
  //     cy.createLeague('Back Navigation League', 'GamePigeon');

  //     // Wait for page to load
  //     cy.wait(2000);

  //     // Navigate to matches tab
  //     cy.get('[data-testid="matches-tab"]').click();
  //     cy.wait(1000);

  //     // Go to record match
  //     cy.get('[data-testid="record-match-button"]', { timeout: 10000 })
  //       .should('be.visible')
  //       .click();
  //     cy.url().should('include', '/record-match');

  //     // Click back button
  //     cy.get('[data-testid="back-to-league-button"]').click();

  //     // Should be back on league detail page
  //     cy.url().should('match', /\/leagues\/[a-f0-9-]+$/);
  //     cy.get('[data-testid="league-detail-name"]').should('contain', 'Back Navigation League');
  //   });
  // });
});
