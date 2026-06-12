describe("ServiceDetails E2E Suite", () => {

  const service = {
    _id: "507f1f77bcf86cd799439011",
    title: "Home Plumbing Service",
    description: "Professional plumbing repairs",
    category: "Plumber",
    subCategory: "Pipe Repair",
    price: 2500,
    provider: {
      _id: "provider123",
      name: "Ali Plumber",
      email: "ali@plumber.com"
    }
  };

  beforeEach(() => {

    cy.intercept("GET", "**/api/services?category=*", {
      statusCode: 200,
      body: [service]
    }).as("categoryServices");

    cy.intercept(
      "GET",
      `**/api/services/${service._id}`,
      {
        statusCode: 200,
        body: service
      }
    ).as("serviceDetails");

    cy.visit("http://localhost:5173");
  });

  it("should open service details from home page", () => {

    cy.get(".category-card")
      .first()
      .click();

    cy.wait("@categoryServices");

    cy.get(".card-link")
      .first()
      .click();

    cy.url()
      .should("include", `/services/${service._id}`);
  });

  it("should display service information", () => {

    cy.get(".category-card")
      .first()
      .click();

    cy.wait("@categoryServices");

    cy.get(".card-link")
      .first()
      .click();

    cy.wait("@serviceDetails");

    cy.contains(service.title);
    cy.contains(service.description);
    cy.contains(`₹${service.price}`);
    cy.contains(service.provider.name);
    cy.contains(service.provider.email);
  });

  it("should show guest booking CTA", () => {

    cy.get(".category-card")
      .first()
      .click();

    cy.wait("@categoryServices");

    cy.get(".card-link")
      .first()
      .click();

    cy.wait("@serviceDetails");

    cy.contains("Ready to book?");
    cy.contains("Sign in to book");
  });

  it("should show booking form for customer", () => {

    cy.visit("http://localhost:5173", {
      onBeforeLoad(win) {
        win.localStorage.setItem("token", "fake-token");
      }
    });

    cy.intercept("GET", "**/api/auth/me", {
      statusCode: 200,
      body: {
        _id: "customer1",
        name: "Customer User",
        email: "customer@test.com",
        role: "user"
      }
    }).as("auth");

    cy.get(".category-card")
      .first()
      .click();

    cy.wait("@categoryServices");

    cy.get(".card-link")
      .first()
      .click();

    cy.wait("@serviceDetails");

    cy.contains("Book this service");

    cy.get('input[placeholder="Where should the provider go?"]')
      .should("exist");

    cy.get('input[type="tel"]')
      .should("exist");

    cy.get('input[type="date"]')
      .should("exist");
  });

  it("should create booking successfully", () => {

    cy.visit("http://localhost:5173", {
      onBeforeLoad(win) {
        win.localStorage.setItem("token", "fake-token");
      }
    });

    cy.intercept("GET", "**/api/auth/me", {
      statusCode: 200,
      body: {
        _id: "customer1",
        role: "user"
      }
    });

    cy.intercept("POST", "**/api/bookings", {
      statusCode: 201,
      body: {
        msg: "Booking Created"
      }
    }).as("booking");

    cy.get(".category-card")
      .first()
      .click();

    cy.wait("@categoryServices");

    cy.get(".card-link")
      .first()
      .click();

    cy.get('input[placeholder="Where should the provider go?"]')
      .type("Lahore");

    cy.get('input[type="tel"]')
      .type("03001234567");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateString = tomorrow
      .toISOString()
      .split("T")[0];

    cy.get('input[type="date"]')
      .type(dateString);

    cy.contains("Confirm Booking")
      .click();

    cy.wait("@booking");

    cy.contains("Booking placed");
  });

  it("should send correct booking payload", () => {

    cy.visit("http://localhost:5173", {
      onBeforeLoad(win) {
        win.localStorage.setItem("token", "fake-token");
      }
    });

    cy.intercept("GET", "**/api/auth/me", {
      statusCode: 200,
      body: {
        _id: "customer1",
        role: "user"
      }
    });

    cy.intercept("POST", "**/api/bookings", (req) => {

      expect(req.body.serviceId)
        .to.equal(service._id);

      expect(req.body.address)
        .to.equal("Lahore");

      expect(req.body.phone)
        .to.equal("03001234567");

      req.reply({
        statusCode: 201,
        body: { success: true }
      });

    }).as("booking");

    cy.get(".category-card")
      .first()
      .click();

    cy.wait("@categoryServices");

    cy.get(".card-link")
      .first()
      .click();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateString = tomorrow
      .toISOString()
      .split("T")[0];

    cy.get('input[placeholder="Where should the provider go?"]')
      .type("Lahore");

    cy.get('input[type="tel"]')
      .type("03001234567");

    cy.get('input[type="date"]')
      .type(dateString);

    cy.contains("Confirm Booking")
      .click();

    cy.wait("@booking");
  });

  it("should show booking error message", () => {

    cy.visit("http://localhost:5173", {
      onBeforeLoad(win) {
        win.localStorage.setItem("token", "fake-token");
      }
    });

    cy.intercept("GET", "**/api/auth/me", {
      statusCode: 200,
      body: {
        _id: "customer1",
        role: "user"
      }
    });

    cy.intercept("POST", "**/api/bookings", {
      statusCode: 400,
      body: {
        msg: "Booking failed"
      }
    }).as("booking");

    cy.get(".category-card")
      .first()
      .click();

    cy.wait("@categoryServices");

    cy.get(".card-link")
      .first()
      .click();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateString = tomorrow
      .toISOString()
      .split("T")[0];

    cy.get('input[placeholder="Where should the provider go?"]')
      .type("Lahore");

    cy.get('input[type="tel"]')
      .type("03001234567");

    cy.get('input[type="date"]')
      .type(dateString);

    cy.contains("Confirm Booking")
      .click();

    cy.wait("@booking");

    cy.contains("Booking failed");
  });

  it("should clear form after successful booking", () => {

    cy.visit("http://localhost:5173", {
      onBeforeLoad(win) {
        win.localStorage.setItem("token", "fake-token");
      }
    });

    cy.intercept("GET", "**/api/auth/me", {
      statusCode: 200,
      body: {
        _id: "customer1",
        role: "user"
      }
    });

    cy.intercept("POST", "**/api/bookings", {
      statusCode: 201,
      body: {
        success: true
      }
    }).as("booking");

    cy.get(".category-card")
      .first()
      .click();

    cy.wait("@categoryServices");

    cy.get(".card-link")
      .first()
      .click();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateString = tomorrow
      .toISOString()
      .split("T")[0];

    cy.get('input[placeholder="Where should the provider go?"]')
      .type("Lahore");

    cy.get('input[type="tel"]')
      .type("03001234567");

    cy.get('input[type="date"]')
      .type(dateString);

    cy.contains("Confirm Booking")
      .click();

    cy.wait("@booking");

    cy.get('input[placeholder="Where should the provider go?"]')
      .should("have.value", "");

    cy.get('input[type="tel"]')
      .should("have.value", "");
  });

  it("should have minimum date set", () => {

    cy.visit("http://localhost:5173", {
      onBeforeLoad(win) {
        win.localStorage.setItem("token", "fake-token");
      }
    });

    cy.intercept("GET", "**/api/auth/me", {
      statusCode: 200,
      body: {
        _id: "customer1",
        role: "user"
      }
    });

    cy.get(".category-card")
      .first()
      .click();

    cy.wait("@categoryServices");

    cy.get(".card-link")
      .first()
      .click();

    const today = new Date()
      .toISOString()
      .split("T")[0];

    cy.get('input[type="date"]')
      .should("have.attr", "min", today);
  });

});