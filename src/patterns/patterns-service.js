const xss = require("xss");

const PatternsService = {
  getPatternsByUser(db, user_id) {
    return db.from("patterns").select("*").where({ user_id });
  },
  getAllPatterns(db) {
    return db.from("patterns").select("*");
  },
  getPatternById(db, id) {
    return db("patterns").select("*").where({ id }).first();
  },
  insertPattern(db, pattern) {
    return db
      .insert(pattern)
      .into("patterns")
      .returning("*")
      .then(([pattern]) => pattern);
  },
  removePattern(db, id) {
    return db.from("patterns").where({ id }).delete();
  },
  updatePattern(db, id, updatedPattern) {
    return db("patterns").where({ id }).update(updatedPattern);
  },

  // Protect against cross site scripting
  serializePattern(pattern) {
    return {
      id: pattern.id,
      title: xss(pattern.title),
      user_id: pattern.user_id,
      pattern_data: pattern.pattern_data,
    };
  },
  serializePatterns(patterns) {
    return patterns.map(this.serializePattern);
  },
};

module.exports = PatternsService;
