describe('Repertoire', () => {
  beforeEach(() => {
    cy.registerAndLogin()
    cy.visit('/repertoire')
  })

  it('renders the Repertoire heading', () => {
    cy.contains('h1', /repertoire/i)
  })

  it('renders the "Add Piece" button', () => {
    cy.contains('a', /add piece/i).should('have.attr', 'href', '/pieces/new')
  })

  it('renders status and composer filter dropdowns', () => {
    cy.get('select').should('have.length.gte', 2)
    cy.contains('option', /all statuses/i)
    cy.contains('option', /all composers/i)
  })

  it('renders table column headers', () => {
    cy.contains('th', /title/i)
    cy.contains('th', /composer/i)
    cy.contains('th', /difficulty/i)
    cy.contains('th', /status/i)
    cy.contains('th', /last played/i)
  })

  it('shows the empty state when no pieces exist', () => {
    cy.contains(/no pieces yet/i)
    cy.contains('button', /add your first piece/i)
  })

  it('"Add your first piece" button navigates to /pieces/new', () => {
    cy.contains('button', /add your first piece/i).click()
    cy.url().should('include', '/pieces/new')
  })
})

describe('Repertoire — with a piece', () => {
  beforeEach(() => {
    cy.registerAndLogin()
    // Add a piece via the form
    cy.visit('/pieces/new')
    cy.get('input[type="text"], input:not([type])').first().type('Moonlight Sonata')
    cy.get('select').first().select('Ludwig van Beethoven')
    cy.get('input[type="number"]').clear().type('7')
    cy.get('select').eq(1).select('active')
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/pieces/')
  })

  it('shows the newly added piece in the repertoire table', () => {
    cy.visit('/repertoire')
    cy.contains('a', 'Moonlight Sonata')
    cy.contains('Ludwig van Beethoven')
    cy.contains('7/10')
    cy.contains(/active/i)
  })

  it('filters by status — shows only matching pieces', () => {
    cy.visit('/repertoire')
    cy.get('select').first().select('wishlist')
    cy.contains(/no pieces match your filters/i)
  })

  it('clicking a piece title navigates to its detail page', () => {
    cy.visit('/repertoire')
    cy.contains('a', 'Moonlight Sonata').click()
    cy.url().should('match', /\/pieces\/\d+$/)
    cy.contains('h1', 'Moonlight Sonata')
  })
})
