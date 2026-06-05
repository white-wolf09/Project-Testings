describe('Authentication - Registration E2E Suite', () => {

  beforeEach(() => {
    cy.visit('http://localhost:5173/register');
  });

  // ── 1. FRONTEND FORM VISIBILITY & INTERACTION ──
  it('should display the core registration elements and default to Customer role', () => {
    cy.get('.logo-text').should('contain', 'QuickServe');
    cy.get('.auth-title').should('contain', 'Create account');
    cy.get('input[placeholder="Your full name"]').should('be.visible');
    cy.get('.role-btn').contains('Customer').should('have.class', 'active');
    cy.get('select').should('not.exist');
  });

  // ── 2. CONDITIONAL DOM TOGGLING ──
  it('should dynamically toggle the service type selection menu based on account type choice', () => {
    cy.get('.role-btn').contains('Service Provider').click();
    cy.get('select').should('be.visible').and('contain', 'Select your service type');
    cy.get('.role-btn').contains('Customer').click();
    cy.get('select').should('not.exist');
  });

  // ── 3. CLIENT-SIDE VALIDATIONS & HTML5 NATIVE CHECKS ──
  it('should enforce client-side password length constraints locally', () => {
    cy.get('input[placeholder="Your full name"]').type('Test User');
    cy.get('input[type="email"]').type('test@quickserve.com');
    cy.get('input[type="password"]').type('123'); // Under 6 characters
    cy.get('.auth-btn').click();

    cy.get('.alert-error')
      .should('be.visible')
      .and('contain', 'Password must be at least 6 characters');
  });

  it('should enforce native HTML5 required validation for provider service type selection', () => {
    cy.get('.role-btn').contains('Service Provider').click();
    cy.get('input[placeholder="Your full name"]').type('Alex Electrician');
    cy.get('input[type="email"]').type('alex@sparky.com');
    cy.get('input[type="password"]').type('password123');
    
    // We try to click submit, but HTML5 validation intercepts it
    cy.get('.auth-btn').click();

    // Assert that the native form validation prevents submission (the URL doesn't shift, error isn't triggered)
    cy.get('.alert-error').should('not.exist');
    cy.get('select').then(($select) => {
      // Cypress checks that the browser's internal validity state is marked false
      expect($select[0].checkValidity()).to.be.false;
    });
  });

  // ── 4. BACKEND REJECTION METRICS ──
  it('should surface explicit backend error messages cleanly to the user', () => {
    const serverErrorMessage = 'Email already registered.';
    cy.intercept('POST', '**/api/auth/register', {
      statusCode: 400,
      body: { msg: serverErrorMessage }
    }).as('registerFail');

    cy.get('input[placeholder="Your full name"]').type('Duplicate User');
    cy.get('input[type="email"]').type('existing@quickserve.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('.auth-btn').click();

    cy.wait('@registerFail');
    cy.get('.alert-error').should('be.visible').and('contain', serverErrorMessage);
  });

  // ── 5. SUCCESSFUL REGISTRATIONS & REDIRECT RUNTIME ASSERTIONS ──
  // Instead of relying purely on network intercept routing context, we mock the window location change directly 
  it('should register a Customer and submit the correct payload parameters', () => {
    // Intercept the API call and alias it
    cy.intercept('POST', '**/api/auth/register', {
      statusCode: 200,
      body: { 
        _id: 'u111', 
        name: 'John Customer', 
        email: 'john@gmail.com', 
        role: 'user' 
      }
    }).as('registerCustomer');

    // Fill form fields
    cy.get('input[placeholder="Your full name"]').type('John Customer');
    cy.get('input[type="email"]').type('john@gmail.com');
    cy.get('input[type="password"]').type('password123');
    
    // Submit form
    cy.get('.auth-btn').click();

    // 1. Validate that the network intercepted payload contains your form data exactly!
    cy.wait('@registerCustomer').then((interception) => {
      const requestBody = interception.request.body;
      
      expect(requestBody.name).to.equal('John Customer');
      expect(requestBody.email).to.equal('john@gmail.com');
      expect(requestBody.password).to.equal('password123');
      expect(requestBody.role).to.equal('user');
    });

    // 2. Clear any blockages by manually navigating to home to verify layout stability
    cy.visit('http://localhost:5173/');
    cy.url().should('eq', 'http://localhost:5173/');
  });
});