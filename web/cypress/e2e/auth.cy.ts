describe('Authentication', () => {
  it('redirects unauthenticated users to /login', () => {
    cy.visit('/')
    cy.url().should('include', '/login')
  })

  it('shows the login page with the correct heading and fields', () => {
    cy.visit('/login')
    cy.contains('Sign in to Pianoter')
    cy.get('input[type="text"], input:not([type="password"]):not([type="checkbox"])').should('exist')
    cy.get('input[type="password"]').should('exist')
    cy.get('button[type="submit"]').contains(/sign in/i)
    cy.contains('a', /register/i).should('have.attr', 'href', '/register')
  })

  it('shows an error on invalid credentials', () => {
    cy.visit('/login')
    cy.get('input[type="text"], input:not([type])').first().type('nobody')
    cy.get('input[type="password"]').type('wrongpassword')
    cy.get('button[type="submit"]').click()
    cy.contains(/invalid username or password/i)
  })

  it('shows the register page with the correct heading and fields', () => {
    cy.visit('/register')
    cy.contains('Create an account')
    cy.get('input[type="password"]').should('have.length', 2)
    cy.get('button[type="submit"]').contains(/register/i)
    cy.contains('a', /sign in/i).should('have.attr', 'href', '/login')
  })

  it('shows an error when passwords do not match', () => {
    cy.visit('/register')
    cy.get('input[type="text"], input:not([type])').first().type(`user_${Date.now()}`)
    cy.get('input[type="password"]').first().type('password1')
    cy.get('input[type="password"]').last().type('password2')
    cy.get('button[type="submit"]').click()
    cy.contains(/passwords do not match/i)
  })

  it('registers a new account and lands on the dashboard', () => {
    cy.registerAndLogin()
    cy.url().should('eq', Cypress.config('baseUrl') + '/')
    cy.contains(/welcome back/i)
  })

  it('logs out and redirects to login', () => {
    cy.registerAndLogin()
    cy.contains('button', /logout/i).click()
    cy.url().should('include', '/login')
  })

  it('can log back in after logout', () => {
    const password = 'testpassword'
    cy.registerAndLogin(undefined, password).then(username => {
      cy.contains('button', /logout/i).click()
      cy.loginAs(username, password)
      cy.contains(/welcome back/i)
    })
  })
})
