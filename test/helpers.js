const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function makeUsersArray() {
  return [
    {
      id: 1,
      user_name: "test-user-1",
      email: "test-user1@email.com",
      password: "Password123!",
    },
    {
      id: 2,
      user_name: "test-user-2",
      email: "test-user2@email.com",
      password: "Password123!",
    },
    {
      id: 3,
      user_name: "test-user-3",
      email: "test-user3@email.com",
      password: "Password123!",
    },
  ];
}

function makePatternsArray() {
  return [
    {
      id: 1,
      title: "pattern one",
      pattern_data: {
        bpm: 130,
        notes: [
          ["0:0:3", "C4"],
          ["0:1:3", "D4"],
          ["0:2:3", "E4"],
        ],
      },
      user_id: 1,
    },
    {
      id: 2,
      title: "pattern two",
      pattern_data: {
        bpm: 150,
        notes: [
          ["0:0:3", "C4"],
          ["0:1:3", "D4"],
          ["0:2:3", "E4"],
        ],
      },
      user_id: 2,
    },
    {
      id: 3,
      title: "pattern three",
      pattern_data: {
        bpm: 140,
        notes: [
          ["0:0:3", "C4"],
          ["0:1:3", "D4"],
          ["0:2:3", "E4"],
        ],
      },
      user_id: 2,
    },
  ];
}

function makeExpectedPattern(pattern) {
  return {
    id: pattern.id,
    title: pattern.title,
    user_id: pattern.user_id,
    pattern_data: pattern.pattern_data,
  };
}

function makeSequencerFixtures() {
  const testUsers = makeUsersArray();
  const testPatterns = makePatternsArray();
  return { testUsers, testPatterns };
}

function cleanTables(db) {
  return db.transaction((trx) =>
    trx
      .raw(
        `TRUNCATE
        users,
        patterns
      `
      )
      .then(() =>
        Promise.all([
          trx.raw(`ALTER SEQUENCE users_id_seq minvalue 0 START WITH 1`),
          trx.raw(`ALTER SEQUENCE patterns_id_seq minvalue 0 START WITH 1`),
          trx.raw(`SELECT setval('users_id_seq', 0)`),
          trx.raw(`SELECT setval('patterns_id_seq', 0)`),
        ])
      )
  );
}

function seedUsers(db, users) {
  const preppedUsers = users.map((user) => ({
    ...user,
    password: bcrypt.hashSync(user.password, 1),
  }));
  return db
    .into("users")
    .insert(preppedUsers)
    .then(() =>
      db.raw(`SELECT setval('users_id_seq', ?)`, [users[users.length - 1].id])
    );
}

function seedPatterns(db, users, projects) {
  return db.transaction(async (trx) => {
    await seedUsers(trx, users);
    await trx.into("patterns").insert(projects);

    await trx.raw(`SELECT setval('patterns_id_seq', ?)`, [
      projects[projects.length - 1].id,
    ]);
  });
}

function makeMaliciousPattern() {
  const maliciousProject = {
    id: 111,
    title: 'malicious pattern title <script>alert("xss");</script>',
    pattern_data: {
      bpm: 110,
      notes: [
        ["0:0:3", "C4"],
        ["0:1:3", "D4"],
        ["0:2:3", "E4"],
      ],
    },
    user_id: 1,
  };

  const expectedPattern = {
    ...maliciousPattern,
    title: 'malicious Pattern title &lt;script&gt;alert("xss");&lt;/script&gt;',
  };

  return {
    maliciousPattern,
    expectedPattern,
  };
}

function seedMaliciousPattern(db, user, pattern) {
  return seedUsers(db, [user]).then(() =>
    db.into("patterns").insert([pattern])
  );
}

function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
  const token = jwt.sign({ user_id: user.id }, secret, {
    subject: user.user_name,
    algorithm: "HS256",
  });
  return `Bearer ${token}`;
}

module.exports = {
  makeUsersArray,
  makeSequencerFixtures,
  makeExpectedPattern,
  cleanTables,
  seedUsers,
  seedPatterns,
  makeAuthHeader,
  makeMaliciousPattern,
  seedMaliciousPattern,
};
