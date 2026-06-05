#define DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN
#include "doctest.h"

// include your project file
#include "EliteDrive.cpp"


// =======================================================
// ? FAILING TEST CASES - UNIT TESTING
// =======================================================

TEST_CASE("FAIL - Empty name should be invalid") {
    CHECK(isName("") == false);
}


// =======================================================
// ? FAILING TEST CASES - GRAPH MODULE
// =======================================================

TEST_CASE("FAIL - Unreachable node should not have valid distance") {

    Graph g(10);

    g.addEdge(1,2,100);

    vector<int> dist = dijkstra(g,1);

    CHECK(dist[5] != INT_MAX); // ? should FAIL
}

TEST_CASE("FAIL - Wrong shortest path expectation") {

    Graph g(10);

    g.addEdge(1,2,100);
    g.addEdge(2,3,100);

    vector<int> dist = dijkstra(g,1);

    CHECK(dist[3] == 100); // ? WRONG (actual is 200)
}

TEST_CASE("FAIL - Negative weight edge should be accepted") {

    Graph g(10);

    g.addEdge(1,2,-50); // ? invalid logically

    vector<int> dist = dijkstra(g,1);

    CHECK(dist[2] >= 0); // ? should fail
}

// =======================================================
// ? FAILING TEST CASES - CAR MODULE
// =======================================================

TEST_CASE("FAIL - No car available should still return true") {

    CarList cl;

    cl.addCar("Bike", "Red", 1);

    CHECK(cl.assignCar(100) == true); // ? wrong expectation
}

TEST_CASE("FAIL - Exact capacity edge case failure") {

    CarList cl;

    cl.addCar("BMW", "Black", 4);

    CHECK(cl.assignCar(5) == true); // ? should fail
}




// =======================================================
// ? FAILING TEST CASES - INTEGRATION
// =======================================================

TEST_CASE("FAIL - Booking flow without car should still succeed") {

    CarList cl;
    RideLinkedList list;

    bool booked = cl.assignCar(999); // false expected

    if(booked){
        list.Add_ride(5001);
    }

    CHECK(booked == true); // ? should fail
}

TEST_CASE("FAIL - Fare mismatch integration") {

    Graph g(10);

    g.addEdge(1,2,100);
    g.addEdge(2,4,100);

    vector<int> dist = dijkstra(g,1);

    CHECK(dist[4] == 150); // ? wrong expected result
}

TEST_CASE("FAIL - Invalid registration still passes system") {

    string name = "Ali123";
    string email = "wrongemail";

    CHECK(isName(name) == true);      // ? wrong
    CHECK(is_valid(email) == true);   // ? wrong
}

// =======================================================
// ? FAILING TEST CASES - BOUNDARY TESTING
// =======================================================



TEST_CASE("FAIL - Extremely large passenger count") {

    CarList cl;

    cl.addCar("Van", "White", 10);

    CHECK(cl.assignCar(100000) == true); // ? should fail
}

TEST_CASE("FAIL - Zero length NIC accepted") {

    string nic = "";

    CHECK(nic.length() == 13); // ? wrong
}

TEST_CASE("FAIL - Short phone accepted") {

    string phone = "123";

    CHECK(phone.length() == 11); // ? wrong
}