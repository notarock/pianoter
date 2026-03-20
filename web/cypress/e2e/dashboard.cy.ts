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
})
