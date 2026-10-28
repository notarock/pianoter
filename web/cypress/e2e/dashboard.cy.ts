describe('Dashboard', () => {
  beforeEach(() => {
    cy.registerAndLogin()
  })

  it('shows a personalised welcome message', () => {
    cy.contains(/welcome back/i)
  })

  it('shows the four status stat cards', () => {
    cy.contains(/wishlist/i)
    cy.contains(/learning/i)
    cy.contains(/active/i)
    cy.contains(/shelved/i)
  })

  it('shows the empty repertoire prompt when there are no pieces', () => {
    cy.contains(/your repertoire is empty/i)
    cy.contains('button', /go to repertoire/i)
  })

  it('"Go to Repertoire" button navigates to /repertoire', () => {
    cy.contains('button', /go to repertoire/i).click()
    cy.url().should('include', '/repertoire')
  })

  it('shows the "To Revisit" section', () => {
    cy.contains(/to revisit/i)
  })

  it('shows "all caught up" when no pieces are overdue', () => {
    cy.contains(/all caught up/i)
  })

  it('shows navigation links for Dashboard, Repertoire, Composers', () => {
    cy.contains('nav', /pianoter/i)
    cy.contains('a', /dashboard/i)
    cy.contains('a', /repertoire/i)
    cy.contains('a', /composers/i)
  })

  it('clicking Dashboard nav link stays on dashboard', () => {
    cy.contains('a', /dashboard/i).click()
    cy.url().should('include', '/dashboard')
    cy.contains(/welcome back/i)
  })

  it('clicking Composers nav link goes to composers page', () => {
    cy.contains('a', /composers/i).click()
    cy.url().should('include', '/composers')
    cy.contains(/composers/i)
  })

  it('shows stat cards with zero counts when no pieces exist', () => {
    cy.contains('h2', /wishlist/i)
    cy.contains('h2', /learning/i)
    cy.contains('h2', /active/i)
    cy.contains('h2', /shelved/i)
  })
})

describe('Dashboard — with pieces', () => {
  beforeEach(() => {
    cy.registerAndLogin()
    // Add pieces with different statuses
    const pieces = [
      { title: 'Moonlight Sonata', composer: 'Ludwig van Beethoven', status: 'active' },
      { title: 'Für Elise', composer: 'Ludwig van Beethoven', status: 'wishlist' },
      { title: 'Clair de Lune', composer: 'Claude Debussy', status: 'learning' },
    ]
    for (const piece of pieces) {
      cy.visit('/pieces/new')
      cy.get('input[type="text"], input:not([type])').first().type(piece.title)
      cy.get('select').first().select(piece.composer)
      cy.get('select').eq(1).select(piece.status)
      cy.get('button[type="submit"]').click()
    }
    cy.visit('/dashboard')
  })

  it('shows stat cards with non-zero counts', () => {
    cy.contains(/active/i)
    cy.contains(/wishlist/i)
    cy.contains(/learning/i)
  })

  it('clicking a stat card navigates to filtered repertoire', () => {
    cy.contains(/active/i).click()
    cy.url().should('include', '/repertoire')
    cy.contains('a', 'Moonlight Sonata')
  })

  it('shows "To Revisit" section with overdue pieces', () => {
    cy.contains(/to revisit/i)
  })

  it('navigation links are accessible from dashboard', () => {
    cy.contains('nav', /pianoter/i).should('exist')
    cy.contains('a', /dashboard/i).should('have.attr', 'href', '/dashboard')
    cy.contains('a', /repertoire/i).should('have.attr', 'href', '/repertoire')
    cy.contains('a', /composers/i).should('have.attr', 'href', '/composers')
  })
})
