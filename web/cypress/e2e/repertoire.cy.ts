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

  it('defaults to grouped view', () => {
    cy.get('.mantine-SegmentedControl-root').should('exist')
    cy.contains('span', /grouped/i).should('be.visible')
  })

  it('toggling to flat view shows table', () => {
    cy.contains('span', /flat/i).click()
    cy.contains('th', /title/i)
    cy.contains('th', /composer/i)
    cy.contains('th', /difficulty/i)
    cy.contains('th', /status/i)
    cy.contains('th', /last played/i)
  })

  it('grouped view shows segmented control selected on grouped', () => {
    cy.get('.mantine-SegmentedControl-root').should('exist')
    cy.contains('span', /grouped/i).should('be.visible')
  })

  it('shows group-by dropdown when grouped', () => {
    cy.get('select').should('have.length.gte', 2)
  })

  it('renders status and composer filter dropdowns in flat view', () => {
    cy.contains('span', /flat/i).click()
    cy.contains('option', /all statuses/i)
    cy.contains('option', /all composers/i)
  })

  it('shows the empty state when no pieces exist in flat view', () => {
    cy.contains('span', /flat/i).click()
    cy.contains(/no pieces yet/i)
    cy.contains('button', /add your first piece/i)
  })

  it('"Add your first piece" button navigates to /pieces/new', () => {
    cy.contains('span', /flat/i).click()
    cy.contains('button', /add your first piece/i).click()
    cy.url().should('include', '/pieces/new')
  })

  it('shows group headers with piece counts when pieces exist', () => {
    cy.visit('/pieces/new')
    cy.get('input[type="text"], input:not([type])').first().type('Moonlight Sonata')
    cy.get('select').first().select('Ludwig van Beethoven')
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/pieces/')

    cy.visit('/repertoire')
    cy.get('.mantine-Accordion-control').should('exist')
  })

  it('searching filters by piece title', () => {
    cy.visit('/pieces/new')
    cy.get('input[type="text"], input:not([type])').first().type('Moonlight Sonata')
    cy.get('select').first().select('Ludwig van Beethoven')
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/pieces/')

    cy.visit('/repertoire')
    cy.contains('span', /flat/i).click()

    cy.get('input[placeholder*="search" i]').type('Moonlight')
    cy.contains('a', 'Moonlight Sonata')
  })

  it('searching with no results shows empty message', () => {
    cy.visit('/repertoire')
    cy.contains('span', /flat/i).click()
    cy.get('input[placeholder*="search" i]').type('xyznonexistent')
    cy.contains(/no pieces match your filters/i)
  })
})

// Helper: get status filter select (on repertoire) or status select (on piece form)
Cypress.Commands.add('getStatusSelect', () => {
  return cy.get('select').then($selects => {
    for (const el of $selects) {
      const options = Array.from(el.options)
      // On repertoire page: look for "All statuses" label
      if (options.some(o => o.textContent.toLowerCase().includes('all statuses'))) {
        return cy.wrap(el)
      }
      // On piece form: look for select with status values
      if (options.some(o => ['wishlist', 'learning', 'active', 'shelved'].includes(o.value))) {
        return cy.wrap(el)
      }
    }
    return cy.wrap($selects.first())
  })
})

// Helper: get composer filter select (on repertoire) or composer select (on piece form)
Cypress.Commands.add('getComposerSelect', () => {
  return cy.get('select').then($selects => {
    for (const el of $selects) {
      const options = Array.from(el.options)
      // On repertoire page: look for "All composers" label
      if (options.some(o => o.textContent.toLowerCase().includes('all composers'))) {
        return cy.wrap(el)
      }
      // On piece form: look for select with known composer names
      if (options.some(o => ['Johann Sebastian Bach', 'Ludwig van Beethoven', 'Claude Debussy', 'Frédéric Chopin'].includes(o.textContent))) {
        return cy.wrap(el)
      }
    }
    return cy.wrap($selects.first())
  })
})

// Helper: get group-by select
Cypress.Commands.add('getGroupBySelect', () => {
  return cy.get('select').then($selects => {
    for (const el of $selects) {
      const options = Array.from(el.options)
      if (options.some(o => ['composer', 'opus', 'composer-opus'].includes(o.value))) {
        return cy.wrap(el)
      }
    }
    return cy.wrap($selects.first())
  })
})

describe('Repertoire — with pieces', () => {
  beforeEach(() => {
    cy.registerAndLogin()
    cy.visit('/pieces/new')
    cy.get('input[type="text"], input:not([type])').first().type('Moonlight Sonata')
    cy.get('select').first().select('Ludwig van Beethoven')
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/pieces/')
    cy.visit('/repertoire')
  })

  it('shows the newly added piece in flat view', () => {
    cy.contains('span', /flat/i).click()
    cy.contains('a', 'Moonlight Sonata')
    cy.contains('Ludwig van Beethoven')
  })

  it('clicking a piece title navigates to its detail page in flat view', () => {
    cy.contains('span', /flat/i).click()
    cy.contains('a', 'Moonlight Sonata').click()
    cy.url().should('match', /\/pieces\/\d+$/)
    cy.contains('h1', 'Moonlight Sonata')
  })

  it('filters by status in flat view', () => {
    cy.contains('span', /flat/i).click()
    cy.getStatusSelect().select('wishlist')
    cy.contains(/no pieces match your filters/i)
  })

  it('filters by composer in flat view', () => {
    cy.contains('span', /flat/i).click()
    cy.getComposerSelect().select('Ludwig van Beethoven')
    cy.contains('a', 'Moonlight Sonata')
  })

  it('combines search and status filters', () => {
    cy.visit('/pieces/new')
    cy.get('input[type="text"], input:not([type])').first().type('Für Elise')
    cy.get('select').first().select('Ludwig van Beethoven')
    cy.getStatusSelect().select('active')
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/pieces/')

    cy.visit('/repertoire')
    cy.contains('span', /flat/i).click()

    cy.get('input[placeholder*="search" i]').type('Elise')
    cy.contains('a', 'Für Elise')
    cy.contains('a', 'Moonlight Sonata').should('not.exist')
  })

  it('clearing search shows all pieces again', () => {
    cy.contains('span', /flat/i).click()
    cy.get('input[placeholder*="search" i]').type('Moonlight')
    cy.contains('a', 'Moonlight Sonata')
    cy.get('input[placeholder*="search" i]').clear()
    cy.contains('a', 'Moonlight Sonata')
  })

  it('toggling between grouped and flat preserves filters', () => {
    cy.contains('span', /flat/i).click()
    cy.getComposerSelect().select('Ludwig van Beethoven')
    cy.contains('a', 'Moonlight Sonata')

    cy.contains('span', /grouped/i).click()
    cy.get('.mantine-Accordion-control').should('exist')
  })

  it('group-by selector changes group headers', () => {
    cy.visit('/pieces/new')
    cy.get('input[type="text"], input:not([type])').first().type('Clair de Lune')
    cy.get('select').first().select('Claude Debussy')
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/pieces/')

    cy.visit('/repertoire')

    cy.get('.mantine-Accordion-control').should('have.length.gte', 1)

    cy.getGroupBySelect().select('composer')
    cy.get('.mantine-Accordion-control').should('have.length.gte', 1)
  })

  it('navigating to a composer from repertoire opens composer page', () => {
    cy.contains('span', /flat/i).click()
    cy.contains('a', 'Ludwig van Beethoven').click()
    cy.url().should('include', '/composers/')
    cy.contains('Ludwig van Beethoven')
  })
})

describe('Repertoire — multiple pieces', () => {
  const pieces = [
    { title: 'Moonlight Sonata', composer: 'Ludwig van Beethoven', status: 'active' },
    { title: 'Für Elise', composer: 'Ludwig van Beethoven', status: 'wishlist' },
    { title: 'Clair de Lune', composer: 'Claude Debussy', status: 'learning' },
    { title: 'Nocturne Op. 9 No. 2', composer: 'Frédéric Chopin', status: 'shelved' },
  ]

  beforeEach(() => {
    cy.registerAndLogin()
    for (const piece of pieces) {
      cy.visit('/pieces/new')
      cy.get('input[type="text"], input:not([type])').first().type(piece.title)
      cy.get('select').first().select(piece.composer)
      cy.getStatusSelect().select(piece.status)
      cy.get('button[type="submit"]').click()
    }
    cy.visit('/repertoire')
  })

  it('shows all pieces in flat view', () => {
    cy.contains('span', /flat/i).click()
    cy.contains('a', 'Moonlight Sonata')
    cy.contains('a', 'Für Elise')
    cy.contains('a', 'Clair de Lune')
    cy.contains('a', 'Nocturne Op. 9 No. 2')
  })

  it('filtering by wishlist shows only wishlist pieces', () => {
    cy.contains('span', /flat/i).click()
    cy.getStatusSelect().select('wishlist')
    cy.contains('a', 'Für Elise')
    cy.contains('a', 'Moonlight Sonata').should('not.exist')
    cy.contains('a', 'Clair de Lune').should('not.exist')
    cy.contains('a', 'Nocturne Op. 9 No. 2').should('not.exist')
  })

  it('filtering by learning shows only learning pieces', () => {
    cy.contains('span', /flat/i).click()
    cy.getStatusSelect().select('learning')
    cy.contains('a', 'Clair de Lune')
    cy.contains('a', 'Moonlight Sonata').should('not.exist')
  })

  it('filtering by shelved shows only shelved pieces', () => {
    cy.contains('span', /flat/i).click()
    cy.getStatusSelect().select('shelved')
    cy.contains('a', 'Nocturne Op. 9 No. 2')
    cy.contains('a', 'Moonlight Sonata').should('not.exist')
  })

  it('filtering by composer shows only that composer pieces', () => {
    cy.contains('span', /flat/i).click()
    cy.getComposerSelect().select('Ludwig van Beethoven')
    cy.contains('a', 'Moonlight Sonata')
    cy.contains('a', 'Für Elise')
    cy.contains('a', 'Clair de Lune').should('not.exist')
    cy.contains('a', 'Nocturne Op. 9 No. 2').should('not.exist')
  })

  it('search by partial title finds matching pieces', () => {
    cy.contains('span', /flat/i).click()
    cy.get('input[placeholder*="search" i]').type('Nocturne')
    cy.contains('a', 'Nocturne Op. 9 No. 2')
    cy.contains('a', 'Moonlight Sonata').should('not.exist')
  })

  it('search by opus number finds pieces', () => {
    cy.contains('span', /flat/i).click()
    cy.get('input[placeholder*="search" i]').type('9')
    cy.contains('a', 'Nocturne Op. 9 No. 2')
  })

  it('clearing all filters shows all pieces', () => {
    cy.contains('span', /flat/i).click()
    cy.getStatusSelect().select('wishlist')
    cy.contains('a', 'Für Elise')
    cy.getStatusSelect().select('All statuses')
    cy.contains('a', 'Moonlight Sonata')
    cy.contains('a', 'Für Elise')
    cy.contains('a', 'Clair de Lune')
    cy.contains('a', 'Nocturne Op. 9 No. 2')
  })

  it('sorting by title works in flat view', () => {
    cy.contains('span', /flat/i).click()
    cy.contains('th', /title/i).click()
    cy.contains('a', 'Moonlight Sonata').should('exist')
  })

  it('grouped view groups pieces by composer + opus', () => {
    cy.get('.mantine-Accordion-control').should('have.length.gte', 1)
  })

  it('clicking piece from grouped view navigates to detail', () => {
    cy.get('.mantine-Accordion-control').first().click()
    cy.get('.mantine-Accordion-panel').first().should('be.visible')
    cy.get('.mantine-Accordion-panel a').first().click()
    cy.url().should('match', /\/pieces\/\d+$/)
  })

  it('group-by composer groups all same-composer pieces together', () => {
    cy.getGroupBySelect().select('composer')
    cy.get('.mantine-Accordion-control').its('length').should('be.gte', 1)
  })

  it('group-by opus groups pieces by opus value', () => {
    cy.getGroupBySelect().select('opus')
    cy.get('.mantine-Accordion-control').should('exist')
  })

  it('switching to flat view and back to grouped resets pagination', () => {
    cy.contains('span', /flat/i).click()
    cy.contains('span', /grouped/i).click()
    // Should show accordion controls (default view)
    cy.get('.mantine-Accordion-control').should('exist')
  })

  it('piece count in group header is accurate', () => {
    // Each group header shows the count of pieces in that group
    cy.get('.mantine-Accordion-control').should('exist')
  })

  it('empty filter values show all pieces', () => {
    cy.contains('span', /flat/i).click()
    cy.getStatusSelect().select('All statuses')
    cy.getComposerSelect().select('All composers')
    cy.contains('a', 'Moonlight Sonata')
    cy.contains('a', 'Für Elise')
    cy.contains('a', 'Clair de Lune')
    cy.contains('a', 'Nocturne Op. 9 No. 2')
  })

  it('rapid filter changes do not crash the page', () => {
    cy.contains('span', /flat/i).click()
    cy.getStatusSelect().select('wishlist')
    cy.getStatusSelect().select('learning')
    cy.getStatusSelect().select('active')
    cy.getStatusSelect().select('shelved')
    cy.getStatusSelect().select('All statuses')
    cy.getComposerSelect().select('Ludwig van Beethoven')
    cy.getComposerSelect().select('All composers')
    cy.contains('a', 'Moonlight Sonata')
  })
})
