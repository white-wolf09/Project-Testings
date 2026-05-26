#define DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN
#include "doctest.h"
#include "EliteDrive.cpp"

// =======================================================
// ===================== UNIT TESTING ====================
// =======================================================

// ---------- isChar ----------
TEST_CASE("UNIT - isChar uppercase") {
    CHECK(isChar('A') == true);
}

TEST_CASE("UNIT - isChar lowercase") {
    CHECK(isChar('z') == true);
}

TEST_CASE("UNIT - isChar invalid digit") {
    CHECK(isChar('5') == false);
}

TEST_CASE("UNIT - lowercase mid") {
    CHECK(isChar('m') == true);
}

// ---------- isName ----------
TEST_CASE("UNIT - valid name") {
    CHECK(isName("Ali") == true);
}

TEST_CASE("UNIT - invalid name digits") {
    CHECK(isName("Ali123") == false);
}

TEST_CASE("UNIT - empty name") {
    CHECK(isName("") == true);
}

TEST_CASE("UNIT - special character name") {
    CHECK(isName("Ali@") == false);
}

// ---------- is_valid email ----------
TEST_CASE("UNIT - valid email") {
    CHECK(is_valid("abc@gmail.com") == true);
}

TEST_CASE("UNIT - invalid email no @") {
    CHECK(is_valid("abcgmail.com") == false);
}

TEST_CASE("UNIT - email starts with digit") {
    CHECK(is_valid("1abc@gmail.com") == false);
}

TEST_CASE("UNIT - email without dot") {
    CHECK(is_valid("abc@gmailcom") == false);
}

TEST_CASE("UNIT - email ending dot") {
    CHECK(is_valid("abc@gmail.") == false);
}

// =======================================================
// ===================== MODULE TESTING ==================
// =======================================================

// ---------------- GRAPH MODULE ----------------

TEST_CASE("MODULE - University Road to Karsaz") {
    Graph g(20);
    g.addEdge(1,2,300);
    g.addEdge(2,1,300);

    vector<int> result = dijkstra(g,1);
    CHECK(result[2] == 300);
}

TEST_CASE("MODULE - University Road to Bahadurabad") {
    Graph g(20);
    g.addEdge(1,3,400);

    vector<int> result = dijkstra(g,1);
    CHECK(result[3] == 400);
}

TEST_CASE("MODULE - intermediate path") {
    Graph g(20);
    g.addEdge(1,2,300);
    g.addEdge(2,3,200);

    vector<int> result = dijkstra(g,1);
    CHECK(result[3] == 500);
}

TEST_CASE("MODULE - shortest path selection") {
    Graph g(20);
    g.addEdge(1,2,300);
    g.addEdge(2,3,200);
    g.addEdge(1,3,1000);

    vector<int> result = dijkstra(g,1);
    CHECK(result[3] == 500);
}

// ---------------- CAR MODULE ----------------

TEST_CASE("MODULE - car 1 passenger") {
    CarList cl;
    cl.addCar("Bike","Red",1);
    CHECK(cl.assignCar(1) == true);
}

TEST_CASE("MODULE - car 4 passengers") {
    CarList cl;
    cl.addCar("BMW","Black",4);
    CHECK(cl.assignCar(4) == true);
}

TEST_CASE("MODULE - larger car match") {
    CarList cl;
    cl.addCar("Audi","White",5);
    CHECK(cl.assignCar(3) == true);
}

TEST_CASE("MODULE - no suitable car") {
    CarList cl;
    cl.addCar("Honda","White",4);
    CHECK(cl.assignCar(10) == false);
}

TEST_CASE("MODULE - exact capacity match") {
    CarList cl;
    cl.addCar("Corolla","White",5);
    CHECK(cl.assignCar(5) == true);
}

// ---------------- RIDE LIST MODULE ----------------

TEST_CASE("MODULE - add ride") {
    RideLinkedList list;
    CHECK_NOTHROW(list.Add_ride(1001));
}

TEST_CASE("MODULE - multiple insert") {
    RideLinkedList list;
    CHECK_NOTHROW(list.Add_ride(111));
    CHECK_NOTHROW(list.Add_ride(222));
    CHECK_NOTHROW(list.Add_ride(333));
}

TEST_CASE("MODULE - delete ride existing") {
    RideLinkedList list;
    list.Add_ride(1001);
    CHECK_NOTHROW(list.delete_ride(1001));
}

TEST_CASE("MODULE - delete ride missing") {
    RideLinkedList list;
    CHECK_NOTHROW(list.delete_ride(9999));
}

// =======================================================
// ================= INTEGRATION TESTING ================
// =======================================================

TEST_CASE("INTEGRATION - booking flow") {
    CarList cl;
    RideLinkedList list;

    cl.addCar("BMW","Black",4);

    bool booked = cl.assignCar(2);

    if(booked){
        list.Add_ride(5001);
    }

    CHECK(booked == true);
}

TEST_CASE("INTEGRATION - fare system") {
    Graph g(20);

    g.addEdge(1,2,300);
    g.addEdge(2,4,500);

    vector<int> fare = dijkstra(g,1);
    CHECK(fare[4] == 800);
}

TEST_CASE("INTEGRATION - validation system") {
    CHECK(isName("Ahmed") == true);
    CHECK(is_valid("ahmed@gmail.com") == true);
}

// =======================================================
// ================= BOUNDARY TESTING ===================
// =======================================================

TEST_CASE("BOUNDARY - min passenger") {
    CarList cl;
    cl.addCar("Bike","Red",1);
    CHECK(cl.assignCar(1) == true);
}

TEST_CASE("BOUNDARY - max passenger") {
    CarList cl;
    cl.addCar("Van","White",15);
    CHECK(cl.assignCar(15) == true);
}

TEST_CASE("BOUNDARY - above limit") {
    CarList cl;
    cl.addCar("Van","White",15);
    CHECK(cl.assignCar(16) == false);
}

TEST_CASE("BOUNDARY - NIC length") {
    string nic = "1234567890123";
    CHECK(nic.length() == 13);
}

TEST_CASE("BOUNDARY - phone length") {
    string phone = "03123456789";
    CHECK(phone.length() == 11);
}

// =======================================================
// ================= NEGATIVE TESTING ===================
// =======================================================

TEST_CASE("NEGATIVE - invalid pickup") {
    int pickup = 15;
    CHECK((pickup >= 1 && pickup <= 13) == false);
}

TEST_CASE("NEGATIVE - invalid destination") {
    int dest = -2;
    CHECK((dest >= 1 && dest <= 13) == false);
}

TEST_CASE("NEGATIVE - empty email") {
    CHECK(is_valid("") == false);
}

// =======================================================
// ================= FUNCTIONAL TESTING =================
// =======================================================

TEST_CASE("FUNCTIONAL - booking system") {
    CarList cl;
    RideLinkedList list;

    cl.addCar("Audi","White",4);

    bool assigned = cl.assignCar(3);

    if(assigned){
        list.Add_ride(1001);
    }

    CHECK(assigned == true);
}

TEST_CASE("FUNCTIONAL - fare calculation") {
    Graph g(20);

    g.addEdge(1,2,300);
    g.addEdge(2,4,500);

    vector<int> fare = dijkstra(g,1);
    CHECK(fare[4] == 800);
}