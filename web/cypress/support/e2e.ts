// Global E2E support file — runs before every spec.

// Silence uncaught exceptions from the app that aren't relevant to the test.
Cypress.on('uncaught:exception', (_err, _runnable) => false)

// ---------------------------------------------------------------------------
// Custom commands
// ---------------------------------------------------------------------------

/**
 * Register a fresh user and land on the dashboard.
 * Uses a timestamp suffix so each test run gets a unique username.
 */
Cypress.Commands.add('registerAndLogin', (username?: string, password = 'testpassword') => {
  const user = username ?? `user_${Date.now()}`
  cy.visit('/register')
  cy.get('input[type="text"], input:not([type])').first().type(user)
  cy.get('input[type="password"]').first().type(password)
  cy.get('input[type="password"]').last().type(password)
  cy.get('button[type="submit"]').click()
  cy.url().should('eq', Cypress.config('baseUrl') + '/')
  return cy.wrap(user)
})

/**
 * Log in with existing credentials.
 */
Cypress.Commands.add('loginAs', (username: string, password = 'testpassword') => {
  cy.visit('/login')
  cy.get('input[type="text"], input:not([type])').first().type(username)
  cy.get('input[type="password"]').first().type(password)
  cy.get('button[type="submit"]').click()
  cy.url().should('eq', Cypress.config('baseUrl') + '/')
})

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      registerAndLogin(username?: string, password?: string): Chainable<string>
      loginAs(username: string, password?: string): Chainable<void>
    }
  }
}
