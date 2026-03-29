describe('Add Piece form', () => {
  beforeEach(() => {
    cy.registerAndLogin()
    cy.visit('/pieces/new')
  })

  it('renders the Add Piece heading', () => {
    cy.contains('h1', /add piece/i)
  })

  it('renders all form fields', () => {
    cy.contains(/title/i)
    cy.contains(/composer/i)
    cy.contains(/difficulty/i)
    cy.contains(/status/i)
    cy.contains(/started at/i)
  })

  it('renders the Add Piece submit button and Cancel button', () => {
    cy.contains('button', /^add piece$/i)
    cy.contains('button', /cancel/i)
  })

  it('shows status options: Wishlist, Learning, Active, Shelved', () => {
    cy.contains('option', /wishlist/i)
    cy.contains('option', /learning/i)
    cy.contains('option', /active/i)
    cy.contains('option', /shelved/i)
  })

  it('populates the composer dropdown with system composers', () => {
    cy.contains('option', /beethoven/i)
    cy.contains('option', /chopin/i)
  })

  it('submitting the form navigates to the piece detail page', () => {
    cy.get('input[type="text"], input:not([type])').first().type('Für Elise')
    cy.get('select').first().select('Ludwig van Beethoven')
    cy.get('button[type="submit"]').click()
    cy.url().should('match', /\/pieces\/\d+$/)
    cy.contains('h1', 'Für Elise')
  })

  it('Cancel button goes back without saving', () => {
    cy.contains('button', /cancel/i).click()
    cy.url().should('not.include', '/pieces/new')
  })
})

describe('Piece Detail page', () => {
  beforeEach(() => {
    cy.registerAndLogin()
    cy.visit('/pieces/new')
    cy.get('input[type="text"], input:not([type])').first().type('Moonlight Sonata')
    cy.get('select').first().select('Ludwig van Beethoven')
    cy.get('button[type="submit"]').click()
    cy.url().should('match', /\/pieces\/\d+$/)
  })

  it('shows the piece title, composer, difficulty, status', () => {
    cy.contains('h1', 'Moonlight Sonata')
    cy.contains('Ludwig van Beethoven')
    cy.contains(/wishlist/i)
  })

  it('shows "Never" for last played when no sessions logged', () => {
    cy.contains(/never/i)
  })

  it('renders Edit and Delete buttons', () => {
    cy.contains('a', /edit/i)
    cy.contains('button', /delete/i)
  })

  it('renders the Practice History section', () => {
    cy.contains(/practice history/i)
    cy.contains(/no sessions logged yet/i)
  })

  it('Log Practice Session button reveals the session form', () => {
    cy.contains('button', /log practice session/i).click()
    cy.get('[placeholder*="notes" i]').should('be.visible')
    cy.contains('button', /save/i)
  })

  it('logging a practice session updates the history', () => {
    cy.contains('button', /log practice session/i).click()
    cy.get('[placeholder*="notes" i]').type('Worked on the arpeggios')
    cy.contains('button', /save/i).click()
    cy.contains('Worked on the arpeggios')
  })

  it('Edit link navigates to the edit form', () => {
    cy.contains('a', /edit/i).click()
    cy.url().should('include', '/edit')
    cy.contains('h1', /edit piece/i)
  })

  it('edit form is pre-filled with existing piece data', () => {
    cy.contains('a', /edit/i).click()
    cy.get('input[type="text"], input:not([type])').first().should('have.value', 'Moonlight Sonata')
  })

  it('saving edits updates the piece and returns to detail page', () => {
    cy.contains('a', /edit/i).click()
    cy.get('input[type="text"], input:not([type])').first().clear().type('Für Elise')
    cy.contains('button', /save changes/i).click()
    cy.contains('h1', 'Für Elise')
  })
})
