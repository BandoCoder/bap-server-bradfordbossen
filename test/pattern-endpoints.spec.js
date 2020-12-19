const knex = require("knex");
const app = require("../src/app");
const helpers = require("./helpers");

describe.only("Pattern Endpoints", function () {
  let db;
  const { testPatterns, testUsers } = helpers.makeSequencerFixtures();
  const testPattern = testPatterns[0];
  const testUser = testUsers[0];

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DB_URL,
    });
    app.set("db", db);
  });

  after("disconnect from db", () => db.destroy());
  before("cleanup", () => helpers.cleanTables(db));
  afterEach("cleanup", () => helpers.cleanTables(db));

  describe("POST /api/patterns", () => {
    beforeEach(() => helpers.seedPatterns(db, testUsers, testPatterns));

    const requiredFields = ["title", "pattern_data"];
    requiredFields.forEach((field) => {
      const newPattern = {
        title: "Test new pattern",
        pattern_data: {
          bpm: 130,
          notes: [
            ["0:0:1", "C1"],
            ["0:1:1", "D1"],
          ],
        },
      };

      it(`responds 400 and error msg when '${field}' is missing`, () => {
        delete newPattern[field];

        return supertest(app)
          .post("/api/patterns")
          .set("Authorization", helpers.makeAuthHeader(testUser))
          .send(newPattern)
          .expect(400, {
            error: `Missing '${field}' in request body`,
          });
      });
    });

    it("responds 201 and creates new pattern", () => {
      const newPattern = {
        title: "Test new pattern",
        pattern_data: {
          bpm: 130,
          notes: [
            ["0:0:1", "C1"],
            ["0:1:1", "D1"],
          ],
        },
      };

      return supertest(app)
        .post("/api/patterns")
        .set("Authorization", helpers.makeAuthHeader(testUser))
        .send(newPattern)
        .expect(201)
        .then((res) => {
          expect(res.body.id).to.eql(4);
          expect(res.body.title).to.eql(newPattern.title);
          expect(res.body.user_id).to.eql(1);
          expect(res.body.pattern_data).to.eql(newPattern.pattern_data);
          expect(res.headers.location).to.eql(`/api/patterns/${res.body.id}`);
        })
        .then((res) =>
          supertest(app)
            .get(`/api/patterns/4`)
            .set("Authorization", helpers.makeAuthHeader(testUser))
            .expect(200)
            .expect((res) => {
              expect(res.body).to.have.property("id");
              expect(res.body.title).to.eql(newPattern.title);
              expect(res.body.pattern_data).to.eql(newPattern.pattern_data);
              expect(res.body.user_id).to.eql(testUser.id);
            })
        );
    });

    it("removes XSS attack content from response", () => {
      const {
        maliciousPattern,
        expectedPattern,
      } = helpers.makeMaliciousPattern();
      return supertest(app)
        .post("/api/patterns")
        .set("Authorization", helpers.makeAuthHeader(testUser))
        .send(maliciousPattern)
        .expect(201)
        .expect((res) => {
          expect(res.body.title).to.eql(expectedPattern.title);
        });
    });
  });

  describe("GET /api/patterns/users/:userid", () => {
    beforeEach(() => helpers.seedPatterns(db, testUsers, testPatterns));

    context("given user doesn't exist or not authorized user", () => {
      it("responds 401, unauthorized request", () => {
        return supertest(app)
          .get("/api/patterns/users/123456")
          .set("Authorization", helpers.makeAuthHeader(testUsers[0]))
          .expect(401, {
            error: "Unauthorized request",
          });
      });
    });

    context("given proper authorization, but no patterns", () => {
      it("responds 200, empty array", () => {
        return supertest(app)
          .get("/api/patterns/users/3")
          .set("Authorization", helpers.makeAuthHeader(testUsers[2]))
          .expect(200, []);
      });
    });

    context("given proper authorization, user has patterns", () => {
      it("responds 200, array of patterns", () => {
        let expectedArray = [];
        expectedArray.push(helpers.makeExpectedPattern(testPattern));
        return supertest(app)
          .get("/api/patterns/users/1")
          .set("Authorization", helpers.makeAuthHeader(testUser))
          .expect(200)
          .expect((res) => {
            expect(res.body[0]).to.have.property("id");
            expect(res.body[0].title).to.eql(expectedArray[0].title);
            expect(res.body[0].pattern_data).to.eql(
              expectedArray[0].pattern_data
            );
            expect(res.body[0].user_id).to.eql(expectedArray[0].user_id);
          });
      });
    });
  });

  describe("GET /api/patterns/:patternid", () => {
    context("given pattern doesn't exist", () => {
      beforeEach(() => helpers.seedPatterns(db, testUsers, testPatterns));
      it("responds 404, pattern doesn't exist", () => {
        return supertest(app)
          .get("/api/patterns/1234")
          .set("Authorization", helpers.makeAuthHeader(testUsers[0]))
          .expect(404, {
            error: "Pattern doesn't exist",
          });
      });
    });

    context("given improper authorization", () => {
      beforeEach(() => helpers.seedPatterns(db, testUsers, testPatterns));
      it("responds 401, unauthorized request", () => {
        return supertest(app)
          .get("/api/patterns/1")
          .set("Authorization", helpers.makeAuthHeader(testUsers[2]))
          .expect(401, {
            error: "Unauthorized request",
          });
      });
    });

    context("given proper authorization and pattern exists", () => {
      beforeEach(() => helpers.seedPatterns(db, testUsers, testPatterns));
      it("responds 200 with pattern", () => {
        const expectedPattern = helpers.makeExpectedPattern(testPattern);
        return supertest(app)
          .get("/api/patterns/1")
          .set("Authorization", helpers.makeAuthHeader(testUser))
          .expect(200)
          .expect((res) => {
            expect(res.body).to.have.property("id");
            expect(res.body.title).to.eql(expectedPattern.title);
            expect(res.body.pattern_data).to.eql(expectedPattern.pattern_data);
            expect(res.body.user_id).to.eql(expectedPattern.user_id);
          });
      });
    });

    context("given an XSS attack article", () => {
      const {
        maliciousPattern,
        expectedPattern,
      } = helpers.makeMaliciousPattern();
      before("insert malicious pattern", () => {
        return helpers.seedMaliciousPattern(db, testUser, maliciousPattern);
      });

      it("removes XSS attack content", () => {
        return supertest(app)
          .get("/api/patterns/111")
          .set("Authorization", helpers.makeAuthHeader(testUser))
          .expect(200)
          .expect((res) => {
            expect(res.body.title).to.eql(expectedPattern.title);
          });
      });
    });
  });

  describe("DELETE /api/patterns/:pattern-id", () => {
    beforeEach(() => helpers.seedPatterns(db, testUsers, testPatterns));
    context("given improper authorization", () => {
      it("responds 401 not authorized", () => {
        return supertest(app)
          .delete("/api/patterns/1")
          .set("Authorization", helpers.makeAuthHeader(testUsers[2]))
          .expect(401, {
            error: "Unauthorized request",
          });
      });
    });

    context("given proper authorization", () => {
      it("responds 204, no content", () => {
        return supertest(app)
          .delete("/api/patterns/1")
          .set("Authorization", helpers.makeAuthHeader(testUser))
          .expect(204);
      });
    });
  });

  describe("PATCH /api/patterns/:patternid", () => {
    beforeEach(() => helpers.seedPatterns(db, testUsers, testPatterns));
    it("responds 400, req body must contain fields", () => {
      return supertest(app)
        .patch("/api/patterns/1")
        .set("Authorization", helpers.makeAuthHeader(testUser))
        .send({})
        .expect(400, {
          error: "Request body must contain either 'title' or 'pattern_data'",
        });
    });

    it("responds 204, no content", () => {
      const updatedPattern = { title: "updated title" };
      const expectedPattern = {
        ...testPattern[0],
        title: "updated title",
      };
      return supertest(app)
        .patch("/api/patterns/1")
        .set("Authorization", helpers.makeAuthHeader(testUser))
        .send(updatedPattern)
        .expect(204)
        .then((res) =>
          supertest(app)
            .get("/api/patterns/1")
            .set("Authorization", helpers.makeAuthHeader(testUser))
            .then((res) => {
              expect(res.body).to.have.property("id");
              expect(res.body.title).to.eql(expectedPattern.title);
              expect(res.body.pattern_data).to.eql(
                expectedPattern.pattern_data
              );
              expect(res.body.user_id).to.eql(expectedPattern.user_id);
            })
        );
    });
  });
});
