describe('Home Page E2E Test Suite', () => {
  
  beforeEach(() => {
    // 1. Mock the API request Cypress expects when a category is selected
    cy.intercept('GET', '**/api/services?category=*', {
      statusCode: 200,
      body: [
        {
          _id: 'service_001',
          title: 'Premium House Cleaning',
          description: 'Deep cleaning for standard 2BHK apartments.',
          category: 'Cleaning',
          subCategory: 'Deep Clean',
          price: 1500,
          createdAt: '2026-05-01T12:00:00.000Z',
          provider: { name: 'John Doe Cleaners' }
        },
        {
          _id: 'service_002',
          title: 'Kitchen Pipe Fix',
          description: 'Emergency plumbing fixing leaky pipes.',
          category: 'Cleaning',
          subCategory: 'Plumbing Repair', // using 'Cleaning' category container here just to match the active mock bundle
          price: 450,
          createdAt: '2026-06-01T12:00:00.000Z',
          provider: { name: 'Super Plumber' }
        }
      ]
    }).as('getServices');

    // 2. Visit your local Vite development server
    cy.visit('http://localhost:5173');
  });

  // ── STATE 1: CATEGORY GRID VIEW TESTS ──

  it('should render the hero section, stats belt, and category selection grid', () => {
    // Assert Hero Elements exist
    cy.get('.premium-hero-title').should('contain', 'FIND TRUSTED');
    cy.get('.premium-hero-stats-belt').should('be.visible');
    cy.get('.premium-stat-box').should('have.length', 3);

    // Assert that the Categories view layout renders the grid cards
    cy.get('.services-section').should('contain', 'Browse by Category');
    cy.get('.category-card').should('have.length.at.least', 1);
  });

  it('should scroll down smoothly when "Book Now" is clicked', () => {
    cy.get('.premium-btn-book').click();
    cy.window().its('scrollY').should('be.greaterThan', 0);
  });

  // ── STATE 2: INNER SERVICES LIST & FILTERS TESTS ──

  it('should drill down into a category and interact with filters', () => {
    // 1. Click on the first category card to load the services view
    cy.get('.category-card').first().click();
    
    // Wait for our mocked API route to respond
    cy.wait('@getServices');

    // 2. Assert hero section goes away and breadcrumb/banner takes its place
    cy.get('.premium-hero-wrapper').should('not.exist');
    cy.get('.breadcrumb').should('be.visible');
    cy.get('.cat-banner-title').should('be.visible');

    // 3. Test client-side text searching
    cy.get('.search-input').type('Kitchen');
    cy.get('.service-card').should('have.length', 1);
    cy.get('.service-card').first().find('.card-title').should('contain', 'Kitchen Pipe Fix');

    // Clear search using the "✕" button
    cy.get('.search-clear').click();
    cy.get('.service-card').should('have.length', 2);

    // 4. Test Maximum Price Filter
    cy.get('.filter-label').contains('Max Price').next('input').type('500');
    // 'Premium House Cleaning' is ₹1500, so it should disappear
    cy.get('.service-card').should('have.length', 1); 
    cy.get('.service-card').first().find('.card-title').should('contain', 'Kitchen Pipe Fix');

    // 5. Test Reset Filters Button
    cy.get('.filter-reset').click();
    cy.get('.service-card').should('have.length', 2);

    // 6. Click 'Book Now' on a service card and verify it links to the dynamic route
    cy.get('.service-card').first().find('.card-link').click();
    cy.url().should('match', /\/services\/service_\d+/);
  });

  it('should clear parameters and return to categories when breadcrumb "All Categories" is clicked', () => {
    // Enter internal view
    cy.get('.category-card').first().click();
    cy.wait('@getServices');
    
    // Type a filter to check if it gets cleared
    cy.get('.search-input').type('House');

    // Click breadcrumb home
    cy.get('.breadcrumb-home').click();

    // Verify main components reset
    cy.get('.premium-hero-wrapper').should('be.visible');
    cy.get('.category-card').should('be.visible');
    cy.get('.search-input').should('not.exist');
  });

  it('should render an empty state if search filters match zero elements', () => {
    cy.get('.category-card').first().click();
    cy.wait('@getServices');

    // Type a mismatching query string
    cy.get('.search-input').type('Non-Existent Ghost Service');
    
    // Check for your empty state structure
    cy.get('.empty-state').should('be.visible');
    cy.get('.empty-state').should('contain', 'No services found');
    
    // Click clean button inside empty state
    cy.get('.empty-state').find('.btn-outline').click();
    cy.get('.service-card').should('have.length', 2);
  });

});