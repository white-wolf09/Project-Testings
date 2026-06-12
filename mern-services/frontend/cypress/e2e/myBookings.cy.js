describe("MyBookings E2E Suite", () => {

  const mockUser = {
    _id: "u1",
    name: "Test User",
    email: "test@gmail.com",
    role: "user"
  };

  beforeEach(() => {

    cy.visit("http://localhost:5173", {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          "token",
          "fake-jwt-token"
        );
      }
    });

    cy.intercept("GET", "**/auth/me", {
      statusCode: 200,
      body: mockUser
    }).as("getUser");
  });

  // ==================================================
  // PAGE TITLE
  // ==================================================

  it("should display My Bookings page title", () => {

    cy.intercept("GET", "**/bookings/mine", {
      body: []
    });

    cy.visit("http://localhost:5173/my-bookings");

    cy.wait("@getUser");

    cy.contains("My Bookings")
      .should("be.visible");

    cy.contains("Track and manage your service requests")
      .should("be.visible");
  });

  // ==================================================
  // LOADING STATE
  // ==================================================

  it("should show loading state", () => {

    cy.intercept("GET", "**/bookings/mine", (req) => {
      req.reply((res) => {
        res.delay = 2000;
        res.send([]);
      });
    });

    cy.visit("http://localhost:5173/my-bookings");

    cy.contains("Loading bookings...")
      .should("be.visible");
  });

  // ==================================================
  // EMPTY BOOKINGS
  // ==================================================

  it("should show empty state", () => {

    cy.intercept("GET", "**/bookings/mine", {
      body: []
    });

    cy.visit("http://localhost:5173/my-bookings");

    cy.contains("You haven't booked any services yet.")
      .should("be.visible");

    cy.contains("Browse services")
      .should("be.visible");
  });

  // ==================================================
  // API ERROR
  // ==================================================

  it("should display API error message", () => {

    cy.intercept("GET", "**/bookings/mine", {
      statusCode: 500
    });

    cy.visit("http://localhost:5173/my-bookings");

    cy.contains("Failed to load bookings")
      .should("be.visible");
  });

  // ==================================================
  // SINGLE BOOKING
  // ==================================================

  it("should display booking information", () => {

    cy.intercept("GET", "**/bookings/mine", {
      body: [
        {
          _id: "b1",
          status: "pending",
          date: "2026-06-15",
          address: "Lahore",
          phone: "03001234567",
          service: {
            title: "Home Cleaning",
            provider: {
              name: "Ali"
            }
          }
        }
      ]
    });

    cy.visit("http://localhost:5173/my-bookings");

    cy.contains("Home Cleaning");
    cy.contains("by Ali");
    cy.contains("Lahore");
    cy.contains("03001234567");
    cy.contains("pending");
  });

  // ==================================================
  // MULTIPLE BOOKINGS
  // ==================================================

  it("should render multiple bookings", () => {

    cy.intercept("GET", "**/bookings/mine", {
      body: [
        {
          _id: "1",
          status: "pending",
          service: {
            title: "Cleaning",
            provider: {
              name: "Ali"
            }
          }
        },
        {
          _id: "2",
          status: "accepted",
          service: {
            title: "Electrician",
            provider: {
              name: "Ahmed"
            }
          }
        }
      ]
    });

    cy.visit("http://localhost:5173/my-bookings");

    cy.get(".booking-card-row")
      .should("have.length", 2);
  });

  // ==================================================
  // STATUS BADGES
  // ==================================================

  it("should render pending badge", () => {

    cy.intercept("GET", "**/bookings/mine", {
      body: [{
        _id: "1",
        status: "pending",
        service: {
          title: "Cleaning",
          provider: {
            name: "Ali"
          }
        }
      }]
    });

    cy.visit("http://localhost:5173/my-bookings");

    cy.get(".status-badge")
      .should("have.class", "status-pending");
  });

  it("should render accepted badge", () => {

    cy.intercept("GET", "**/bookings/mine", {
      body: [{
        _id: "1",
        status: "accepted",
        service: {
          title: "Cleaning",
          provider: {
            name: "Ali"
          }
        }
      }]
    });

    cy.visit("http://localhost:5173/my-bookings");

    cy.get(".status-badge")
      .should("have.class", "status-accepted");
  });

  it("should render completed badge", () => {

    cy.intercept("GET", "**/bookings/mine", {
      body: [{
        _id: "1",
        status: "completed",
        service: {
          title: "Cleaning",
          provider: {
            name: "Ali"
          }
        }
      }]
    });

    cy.visit("http://localhost:5173/my-bookings");

    cy.get(".status-badge")
      .should("have.class", "status-completed");
  });

  it("should render cancelled badge", () => {

    cy.intercept("GET", "**/bookings/mine", {
      body: [{
        _id: "1",
        status: "cancelled",
        service: {
          title: "Cleaning",
          provider: {
            name: "Ali"
          }
        }
      }]
    });

    cy.visit("http://localhost:5173/my-bookings");

    cy.get(".status-badge")
      .should("have.class", "status-cancelled");
  });

  // ==================================================
  // CANCEL BUTTON VISIBILITY
  // ==================================================

  it("should show cancel button for pending booking", () => {

    cy.intercept("GET", "**/bookings/mine", {
      body: [{
        _id: "1",
        status: "pending",
        service: {
          title: "Cleaning",
          provider: {
            name: "Ali"
          }
        }
      }]
    });

    cy.visit("http://localhost:5173/my-bookings");

    cy.contains("Cancel")
      .should("be.visible");
  });

  it("should hide cancel button for accepted booking", () => {

    cy.intercept("GET", "**/bookings/mine", {
      body: [{
        _id: "1",
        status: "accepted",
        service: {
          title: "Cleaning",
          provider: {
            name: "Ali"
          }
        }
      }]
    });

    cy.visit("http://localhost:5173/my-bookings");

    cy.contains("Cancel")
      .should("not.exist");
  });

  // ==================================================
  // SUCCESSFUL CANCELLATION
  // ==================================================

  it("should cancel booking successfully", () => {

    cy.intercept("GET", "**/bookings/mine", {
      body: [{
        _id: "1",
        status: "pending",
        service: {
          title: "Cleaning",
          provider: {
            name: "Ali"
          }
        }
      }]
    });

    cy.intercept("PUT", "**/bookings/1/status", {
      statusCode: 200,
      body: {
        msg: "Cancelled"
      }
    }).as("cancelBooking");

    cy.visit("http://localhost:5173/my-bookings");

    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(true);
    });

    cy.contains("Cancel").click();

    cy.wait("@cancelBooking");

    cy.get("@cancelBooking")
      .its("request.body")
      .should("deep.equal", {
        status: "cancelled"
      });
  });

  // ==================================================
  // USER REJECTS CONFIRMATION
  // ==================================================

  it("should not cancel booking if user rejects confirmation", () => {

    cy.intercept("GET", "**/bookings/mine", {
      body: [{
        _id: "1",
        status: "pending",
        service: {
          title: "Cleaning",
          provider: {
            name: "Ali"
          }
        }
      }]
    });

    cy.intercept(
      "PUT",
      "**/bookings/1/status"
    ).as("cancelBooking");

    cy.visit("http://localhost:5173/my-bookings");

    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(false);
    });

    cy.contains("Cancel").click();

    cy.get("@cancelBooking.all")
      .should("have.length", 0);
  });

  // ==================================================
  // CANCELLATION FAILURE
  // ==================================================

  it("should show alert when cancellation fails", () => {

    cy.intercept("GET", "**/bookings/mine", {
      body: [{
        _id: "1",
        status: "pending",
        service: {
          title: "Cleaning",
          provider: {
            name: "Ali"
          }
        }
      }]
    });

    cy.intercept("PUT", "**/bookings/1/status", {
      statusCode: 400,
      body: {
        msg: "Could not cancel booking"
      }
    });

    cy.visit("http://localhost:5173/my-bookings");

    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(true);
      cy.stub(win, "alert").as("alertStub");
    });

    cy.contains("Cancel").click();

    cy.get("@alertStub")
      .should(
        "have.been.calledWith",
        "Could not cancel booking"
      );
  });

  // ==================================================
  // MISSING DATA
  // ==================================================

  it("should show N/A when service is missing", () => {

    cy.intercept("GET", "**/bookings/mine", {
      body: [{
        _id: "1",
        status: "pending",
        address: "Lahore",
        phone: "03001234567"
      }]
    });

    cy.visit("http://localhost:5173/my-bookings");

    cy.contains("N/A");
  });

  it("should show N/A when provider is missing", () => {

    cy.intercept("GET", "**/bookings/mine", {
      body: [{
        _id: "1",
        status: "pending",
        service: {
          title: "Cleaning"
        }
      }]
    });

    cy.visit("http://localhost:5173/my-bookings");

    cy.contains("by N/A");
  });

  it("should show N/A when date is missing", () => {

    cy.intercept("GET", "**/bookings/mine", {
      body: [{
        _id: "1",
        status: "pending",
        service: {
          title: "Cleaning",
          provider: {
            name: "Ali"
          }
        }
      }]
    });

    cy.visit("http://localhost:5173/my-bookings");

    cy.contains("N/A");
  });

});