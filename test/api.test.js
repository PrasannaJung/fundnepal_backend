// for sending request
const request = require("supertest");

// server main file(index.js)
const app = require("../index");

const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2YjM2ZGNkZjg3MmQwNDJkZmMwMTI3ZiIsImlhdCI6MTcyNDI5NDEzMiwiZXhwIjoxNzI0MzgwNTMyfQ.bC94puTkld_7Dm4u9MpWZS8ydU9bSQZbQgx_O1CY_9E";

// making test collections
describe("Auth Test Collection", () => {
  it("POST /api/user/login | Response with message", async () => {
    const response = await request(app)
      .post("/api/user/login")
      .send({ email: "john@gmail.com", password: "123" });

    if (!response.body.success) {
      expect(response.body.message).toEqual(
        "Invalid credentials. User does not exist",
      );
    } else {
      expect(response.statusCode).toBe(200);
    }
  });

  it("POST /api/user/register | Response with message", async () => {
    const response = await request(app).post("/api/user/register").send({
      username: "New user",
      phone: "9182123812",
      email: "newuser@gmail.com",
      password: "Newuser10_",
    });

    console.log(response.body);

    if (response.body.success === false) {
      expect(response.body.message).toEqual("User already exists");
    } else {
      expect(response.body.success).toBe(true);
      expect(response.body.message).toEqual("User created successfully");
    }
  });

  it("POST /api/user/register | Response with missing fields", async () => {
    const response = await request(app).post("/api/user/register").send({
      username: "New user",
      phone: "9182123812",
      password: "Newuser10_",
    });

    console.log(response.body);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(true);
  });
});

describe("Project Test Collection", () => {
  it("GET Products | Fetch all products", async () => {
    const response = await request(app).get("/api/project/all");
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
  });
});

describe("User profile test", () => {
  it("GET User Profile | get a single user profile", async () => {
    const response = await request(app)
      .get("/api/user/profile")
      .set("authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("GET Fail To Get User Profile | get a single user profile that fails", async () => {
    const response = await request(app)
      .get("/api/user/profile")
      .set("authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(true);
  });

  it("UPDATE User Profile | update a user profile", async () => {
    const response = await request(app)
      .post("/api/user/profile")
      .send({
        phone: "1234567892",
      })
      .set("authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.phone).toBe("1234567892");
  });
});

describe("Review API", () => {
  it("GET /api/project/reviews/:pid | Fetch all reviews for a project", async () => {
    const projectId = "666fa8ed42c07767303ca07b";
    const response = await request(app).get(
      `/api/project/reviews/${projectId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeInstanceOf(Array);
  });

  it("GET /api/project/reviews/:pid | Faile to fetch all reviews for a project", async () => {
    const projectId = "666fa8ed42c07767303ca07b";
    const response = await request(app).get(
      `/api/project/reviews/${projectId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeInstanceOf(Array);
  });

  it("POST /api/project/review/:pid | Add a new review", async () => {
    const projectId = "66bc45245c6828ad2da2c858";
    const response = await request(app)
      .post(`/api/project/review/${projectId}`)
      .send({
        reviewContent: "This is a great project!",
      })
      .set("authorization", `Bearer ${token}`);

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("success");
    expect(response.body.data.content).toBe("This is a great project!");
    expect(response.body.data.user.username).toBeDefined();
    expect(response.body.data.user.email).toBeDefined();
    expect(response.body.data.user._id).toBeDefined();
  });
});
