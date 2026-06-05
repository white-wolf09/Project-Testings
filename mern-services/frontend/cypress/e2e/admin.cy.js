describe('Admin Control Panel - Full System E2E Suite', () => {
  const mockAdminId = 'admin_999';

beforeEach(() => {
    const adminUser = {
      _id: 'admin_999',
      id: 'admin_999',
      name: 'Super Admin',
      email: 'admin@quickserve.com',
      role: 'admin'
    };

    // 1. INTERCEPT THE BACKGROUND VALIDATION ROUTE (This prevents the 401 redirect!)
    cy.intercept('GET', '**/api/auth/me', {
      statusCode: 200,
      body: adminUser
    }).as('authMe');

    // 2. Intercept the Login Action API route
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        token: 'mock-valid-jwt-token',
        user: adminUser
      }
    }).as('loginApi');

    // 3. Setup the Admin Panel view intercepts
    cy.intercept('GET', '**/api/admin/users', {
      statusCode: 200,
      body: [
        { _id: 'admin_999', name: 'Super Admin', email: 'admin@quickserve.com', role: 'admin' },
        { _id: 'user_001', name: 'John Customer', email: 'john@gmail.com', role: 'user' },
        { _id: 'user_002', name: 'Alex Electrician', email: 'alex@sparky.com', role: 'provider', providerType: 'Electrical' }
      ]
    }).as('fetchUsers');

    cy.intercept('GET', '**/api/admin/services', {
      statusCode: 200,
      body: [
        { _id: 'srv_1', title: 'Home AC Installation', category: 'AC Repair', price: 1200, approved: true, provider: { name: 'Alex Electrician' } },
        { _id: 'srv_2', title: 'Deep Sofa Shampoo Cleaning', category: 'Cleaning', price: 800, approved: false, provider: { name: 'John Customer' } }
      ]
    }).as('fetchServices');

    cy.intercept('GET', '**/api/admin/bookings', {
      statusCode: 200,
      body: [
        { _id: 'bk_1', service: { title: 'Home AC Installation', provider: { name: 'Alex Electrician' } }, user: { name: 'John Customer' }, date: '2026-07-15', status: 'pending' },
        { _id: 'bk_2', service: { title: 'Deep Sofa Shampoo Cleaning', provider: { name: 'John Customer' } }, user: { name: 'Alex Electrician' }, date: '2026-06-01', status: 'completed' }
      ]
    }).as('fetchBookings');

    // 4. Perform the user sequence
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('admin@quickserve.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('button[type="submit"]').click();

    // Wait for login processing to resolve
    cy.wait('@loginApi');

    // 5. Navigate to the admin view securely
    cy.visit('http://localhost:5173/admin');
    
    // Wait for your admin panel and the initialization endpoints to finish downloading
    cy.wait(['@fetchUsers', '@fetchServices', '@fetchBookings']);
  });

  // ── 1. DASHBOARD SUMMARY STATS & CARD COMPUTATIONS ──
  it('should render the dynamic metrics accurately inside stat metric display blocks', () => {
    cy.get('.admin-role-label').should('contain', 'Admin Control Panel');
    cy.get('.page-subtitle').should('contain', 'Logged in as Super Admin');

    // Total Users metric check (3 mocked data arrays matching elements)
    cy.get('.admin-stat-card').eq(0).within(() => {
      cy.get('.admin-stat-num').should('contain', '3');
      cy.get('.admin-stat-sub').should('contain', '1 customers · 1 providers');
    });

    // Active Services metric check
    cy.get('.admin-stat-card').eq(1).find('.admin-stat-num').should('contain', '2');

    // Total Bookings metric check
    cy.get('.admin-stat-card').eq(2).within(() => {
      cy.get('.admin-stat-num').should('contain', '2');
      cy.get('.admin-stat-sub').should('contain', '1 pending · 1 completed');
    });
  });

  // ── 2. USERS MANAGEMENT DATA MATRIX INTERACTION ──
  it('should enable user role reassignment and defend self against deletion/demotion', () => {
    // Intercept Role Update Route
    cy.intercept('PUT', '**/api/admin/users/user_001/role', { statusCode: 200 }).as('updateRole');

    // Verify self record has safe flags
    cy.get('.row-self').within(() => {
      cy.get('.you-badge').should('be.visible');
      cy.get('.status-select').should('be.disabled');
      cy.get('.btn-delete').should('be.disabled');
    });

    // Select alternative user and assign a new structural role
    cy.get('tr').contains('John Customer').parents('tr').within(() => {
      cy.get('.status-select').select('provider');
    });
    
    cy.wait('@updateRole');
    cy.get('@updateRole').its('request.body').should('deep.equal', { role: 'provider' });

    // Test Deletion Confirmation Interception
    cy.intercept('DELETE', '**/api/admin/users/user_001', { statusCode: 200 }).as('deleteUser');
    
    // Stub browser window confirm intercept alert
    cy.window().then((win) => {
      cy.stub(win, 'confirm').returns(true);
    });

    cy.get('tr').contains('John Customer').parents('tr').find('.btn-delete').click();
    cy.wait('@deleteUser');
  });

  // ── 3. SERVICES WORKFLOW (APPROVAl, REVOCATION, EXCLUSION) ──
  it('should switch panels to Services and toggle service operational life cycles', () => {
    // Intercept state mutation handlers
    cy.intercept('PUT', '**/api/admin/services/srv_2/approve', { statusCode: 200 }).as('approveSrv');
    cy.intercept('PUT', '**/api/admin/services/srv_1/reject', { statusCode: 200 }).as('revokeSrv');

    // Confirm visual notice badges render properly inside tabs
    cy.get('.tab').contains('Services').find('.tab-badge').should('contain', '1');
    cy.get('.tab').contains('Services').click();

    // Notice alert check
    cy.get('.alert-pending-notice').should('contain', '1 service(s) awaiting your approval');

    // Test Service Approval
    cy.get('.row-pending').within(() => {
      cy.get('.approval-badge').should('contain', 'Pending');
      cy.get('.btn-approve').click();
    });
    cy.wait('@approveSrv');

    // Test Service Revocation
    cy.get('tr').contains('Home AC Installation').parents('tr').within(() => {
      cy.get('.approval-badge').should('contain', 'Live');
      cy.get('.btn-reject').click();
    });
    cy.wait('@revokeSrv');
  });

  // ── 4. BOOKINGS ARCHIVE DISPLAY MATRIX ──
  it('should navigate to the Bookings pane and accurately process formatting arrays', () => {
    cy.get('.tab').contains('Bookings').click();

    // Verify localized date string translation renders accurately inside columns
    cy.get('tr').contains('Home AC Installation').parents('tr').within(() => {
      cy.get('td').eq(1).should('contain', 'John Customer');
      cy.get('td').eq(2).should('contain', 'Alex Electrician');
      
      // Asserts CSS theme layout configuration binding matching STATUS_COLORS dictionary rules
      cy.get('.status-badge').should('have.class', 'status-pending').and('contain', 'pending');
    });
  });

  // ── 5. ERROR BOUNDARY CATCH DIAGNOSTICS ──
  it('should display explicit error notifications when transactional updates crash', () => {
    const errorMsg = 'Access Denied: Insufficient Clearance.';
    cy.intercept('PUT', '**/api/admin/users/user_001/role', {
      statusCode: 403,
      body: { msg: errorMsg }
    }).as('failedRoleChange');

    cy.get('tr').contains('John Customer').parents('tr').within(() => {
      cy.get('.status-select').select('admin');
    });

    cy.wait('@failedRoleChange');
    
    // Assert structural notification rendering alerts operational
    cy.get('.alert-error').should('be.visible').and('contain', errorMsg);
  });
});