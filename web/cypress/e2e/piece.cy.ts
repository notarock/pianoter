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

  it('submitting with all fields filled creates piece and navigates to detail', () => {
    cy.get('input[type="text"], input:not([type])').first().type('Moonlight Sonata')
    cy.get('select').first().select('Ludwig van Beethoven')
    cy.get('input[placeholder*="opus" i]').type('27')
    cy.get('input[placeholder*="number" i]').type('2')
    cy.get('input[type="number"]').clear().type('7')
    cy.get('select').eq(1).select('active')
    cy.get('button[type="submit"]').click()
    cy.url().should('match', /\/pieces\/\d+$/)
    cy.contains('h1', 'Moonlight Sonata')
  })

  it('submitting with default status (wishlist) works', () => {
    cy.get('input[type="text"], input:not([type])').first().type('Clair de Lune')
    cy.get('select').first().select('Claude Debussy')
    cy.get('button[type="submit"]').click()
    cy.url().should('match', /\/pieces\/\d+$/)
    cy.contains(/wishlist/i)
  })

  it('submitting with shelved status works', () => {
    cy.get('input[type="text"], input:not([type])').first().type('Nocturne')
    cy.get('select').first().select('Frédéric Chopin')
    cy.get('select').eq(1).select('shelved')
    cy.get('button[type="submit"]').click()
    cy.url().should('match', /\/pieces\/\d+$/)
    cy.contains(/shelved/i)
  })

  it('submitting with learning status works', () => {
    cy.get('input[type="text"], input:not([type])').first().type('Gymnopédie No. 1')
    cy.get('select').first().select('Erik Satie')
    cy.get('select').eq(1).select('learning')
    cy.get('button[type="submit"]').click()
    cy.url().should('match', /\/pieces\/\d+$/)
    cy.contains(/learning/i)
  })

  it('Cancel button goes back without saving', () => {
    cy.get('input[type="text"], input:not([type])').first().type('Should Not Persist')
    cy.contains('button', /cancel/i).click()
    cy.url().should('not.include', '/pieces/new')
  })

  it('composer dropdown includes system composers', () => {
    cy.get('select').first().find('option').should('have.length.gte', 5)
    cy.contains('option', /Bach/i)
    cy.contains('option', /Beethoven/i)
    cy.contains('option', /Chopin/i)
  })

  it('can set a start date using the date picker', () => {
    cy.get('input[type="text"], input:not([type])').first().type('Test Piece')
    cy.get('select').first().select('Ludwig van Beethoven')
    // The date input exists
    cy.get('input[placeholder*="date" i], input[placeholder*="start" i]').should('exist')
    cy.get('button[type="submit"]').click()
    cy.url().should('match', /\/pieces\/\d+$/)
  })

  it('can set opus and number fields', () => {
    cy.get('input[type="text"], input:not([type])').first().type('Opus Test')
    cy.get('select').first().select('Ludwig van Beethoven')
    cy.get('input[placeholder*="opus" i]').type('27 bis')
    cy.get('input[placeholder*="number" i]').type('3')
    cy.get('button[type="submit"]').click()
    cy.url().should('match', /\/pieces\/\d+$/)
    cy.contains('h1', 'Opus Test')
  })

  it('can create piece with difficulty 10', () => {
    cy.get('input[type="text"], input:not([type])').first().type('Hard Piece')
    cy.get('select').first().select('Ludwig van Beethoven')
    cy.get('input[type="number"]').clear().type('10')
    cy.get('button[type="submit"]').click()
    cy.url().should('match', /\/pieces\/\d+$/)
    cy.contains('10/10')
  })

  it('can create piece with difficulty 1', () => {
    cy.get('input[type="text"], input:not([type])').first().type('Easy Piece')
    cy.get('select').first().select('Claude Debussy')
    cy.get('input[type="number"]').clear().type('1')
    cy.get('button[type="submit"]').click()
    cy.url().should('match', /\/pieces\/\d+$/)
    cy.contains('1/10')
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

  it('logging multiple practice sessions shows all of them', () => {
    cy.contains('button', /log practice session/i).click()
    cy.get('[placeholder*="notes" i]').type('First session notes')
    cy.contains('button', /save/i).click()
    cy.contains('button', /log practice session/i).click()
    cy.get('[placeholder*="notes" i]').last().type('Second session notes')
    cy.contains('button', /save/i).click()
    cy.contains('First session notes')
    cy.contains('Second session notes')
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

  it('navigating to repertoire from piece detail works', () => {
    cy.contains('a', /repertoire/i).click()
    cy.url().should('include', '/repertoire')
    cy.contains(/repertoire/i)
  })

  it('navigating to composer from piece detail works', () => {
    cy.contains('a', /Ludwig van Beethoven/i).click()
    cy.url().should('include', '/composers/')
    cy.contains('Ludwig van Beethoven')
  })

  it('can delete the piece', () => {
    cy.contains('button', /delete/i).click()
    // After delete, should redirect to repertoire
    cy.url().should('include', '/repertoire')
    cy.contains('Moonlight Sonata').should('not.exist')
  })
})
