const express = require("express");
const path = require("path");
const PatternsService = require("./patterns-service");

const patternsRouter = express.Router();
const jsonParser = express.json();
const { requireAuth } = require("../jwt");

// ** Patterns Endpoints (Auth Required) **

//Post route for new patterns
patternsRouter.route("/").post(requireAuth, jsonParser, (req, res, next) => {
  //Knex instance
  let db = req.app.get("db");

  const { title, pattern_data } = req.body;
  const newPattern = { title, pattern_data };

  //Validate Request
  for (const field of ["title", "pattern_data"])
    if (!req.body[field])
      return res.status(400).json({
        error: `Missing '${field}' in request body`,
      });

  newPattern.user_id = req.user.id;

  //Insert NEW pattern into database
  PatternsService.insertPattern(db, newPattern)
    .then((pattern) => {
      res
        .status(201)
        .location(path.posix.join(req.originalUrl, `/${pattern.id}`))
        .json(PatternsService.serializePattern(pattern));
    })
    .catch(next);
});

//Routes for existing patterns
patternsRouter
  .route("/:pattern_id")
  .all(requireAuth)
  .all(checkPatternExists)
  .get((req, res) => {
    res.json(PatternsService.serializePattern(res.pattern));
  })
  .delete((req, res, next) => {
    //Knex instance
    let db = req.app.get("db");

    PatternsService.removePattern(db, req.params.pattern_id)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    //Knex instance
    let db = req.app.get("db");

    const { title, pattern_data } = req.body;
    const patternToUpdate = { title, pattern_data };

    const numberOfValues = Object.values(patternToUpdate).filter(Boolean)
      .length;
    if (numberOfValues === 0)
      return res.status(400).json({
        error: "Request body must contain either 'title' or 'pattern_data'",
      });

    PatternsService.updatePattern(db, req.params.pattern_id, patternToUpdate)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  });

//Routes for Dashboard by pattern id (foregin key reference in database, see migrations folder)
patternsRouter.route("/users/:user_id").get(requireAuth, (req, res, next) => {
  //Knex instance
  let db = req.app.get("db");
  const currentUserId = req.user.id;

  //Validate Request
  if (currentUserId != req.params.user_id) {
    return res.status(401).json({
      error: "Unauthorized request",
    });
  }

  //Search for all patterns that match foreign key reference to user_id
  PatternsService.getPatternsByUser(db, currentUserId)
    .then((patterns) => {
      res.json(PatternsService.serializePatterns(patterns));
    })
    .catch(next);
});

async function checkPatternExists(req, res, next) {
  //Knex instance
  let db = req.app.get("db");

  try {
    const pattern = await PatternsService.getPatternById(
      db,
      req.params.pattern_id
    );

    if (!pattern)
      return res.status(404).json({
        error: "Pattern doesn't exist",
      });

    if (req.user.id != pattern.user_id) {
      return res.status(401).json({
        error: "Unauthorized request",
      });
    }

    res.pattern = pattern;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = patternsRouter;
