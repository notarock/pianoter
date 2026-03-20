describe('Composers page', () => {
  beforeEach(() => {
    cy.registerAndLogin()
    cy.visit('/composers')
  })

  it('renders the Composers heading', () => {
    cy.contains('h1', /composers/i)
  })

  it('renders the Add Composer button', () => {
    cy.contains('button', /add composer/i)
  })

  it('renders the "Hide system composers" checkbox', () => {
    cy.contains(/hide system composers/i)
    cy.get('input[type="checkbox"]').should('exist')
  })

  it('renders table column headers', () => {
    cy.contains('th', /name/i)
    cy.contains('th', /nationality/i)
    cy.contains('th', /born/i)
    cy.contains('th', /died/i)
  })

  it('renders system composers with a "system" badge', () => {
    cy.contains('Johann Sebastian Bach')
    cy.contains('Ludwig van Beethoven')
    cy.contains('system')
  })

  it('hides system composers when the checkbox is checked', () => {
    cy.get('input[type="checkbox"]').check()
    cy.contains('Johann Sebastian Bach').should('not.exist')
  })

  it('shows the Add Composer inline form when button is clicked', () => {
    cy.contains('button', /add composer/i).click()
    cy.get('input[placeholder*="name" i]').should('be.visible')
    cy.contains('button', /cancel/i)
  })

  it('can add a custom composer', () => {
    cy.contains('button', /add composer/i).click()
    cy.get('input[placeholder*="name" i]').type('Erik Satie')
    cy.get('select').first().select('French')
    cy.get('input[placeholder*="born" i]').type('1866')
    cy.get('input[placeholder*="died" i]').type('1925')
    cy.contains('button', /^add$/i).click()
    cy.contains('Erik Satie')
  })

  it('can delete a user-created composer', () => {
    // First add one
    cy.contains('button', /add composer/i).click()
    cy.get('input[placeholder*="name" i]').type('ToDelete Composer')
    cy.contains('button', /^add$/i).click()
    cy.contains('ToDelete Composer')

    // Hide system composers so only ours is visible and we click the right Delete
    cy.get('input[type="checkbox"]').check()
    cy.contains('tr', 'ToDelete Composer').within(() => {
      cy.contains('button', /delete/i).click()
    })
    cy.contains('ToDelete Composer').should('not.exist')
  })
})
