const express = require("express");
const path = require("path");
const PatternsService = require("./patterns-service");

const patternsRouter = express.Router();
const jsonParser = express.json();
const { requireAuth } = require("../jwt");

patternsRouter.route("/").post(requireAuth, jsonParser, (req, res, next) => {
  const { title, pattern_data } = req.body;
  const newPattern = { title, pattern_data };

  for (const field of ["title", "pattern_data"])
    if (!req.body[field])
      return res.status(400).json({
        error: `Missing '${field}' in request body`,
      });

  newPattern.user_id = req.user.id;

  PatternsService.insertPattern(req.app.get("db"), newPattern)
    .then((pattern) => {
      res
        .status(201)
        .location(path.posix.join(req.originalUrl, `/${pattern.id}`))
        .json(PatternsService.serializePattern(pattern));
    })
    .catch(next);
});

patternsRouter
  .route("/:pattern_id")
  .all(requireAuth)
  .all(checkPatternExists)
  .get((req, res) => {
    res.json(PatternsService.serializePattern(res.pattern));
  })
  .delete((req, res, next) => {
    PatternsService.removePattern(req.app.get("db"), req.params.pattern_id)
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const { title, pattern_data } = req.body;
    const patternToUpdate = { title, pattern_data };

    const numberOfValues = Object.values(patternToUpdate).filter(Boolean)
      .length;
    if (numberOfValues === 0)
      return res.status(400).json({
        error: "Request body must contain either 'title' or 'pattern_data'",
      });

    PatternsService.updatePattern(
      req.app.get("db"),
      req.params.pattern_id,
      patternToUpdate
    )
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  });

patternsRouter.route("/users/:user_id").get(requireAuth, (req, res, next) => {
  const currentUserId = req.user.id;

  // if id of current user doesn't match request id
  // send 401 unauthorized
  if (currentUserId != req.params.user_id) {
    return res.status(401).json({
      error: "Unauthorized request",
    });
  }

  PatternsService.getPatternsByUser(req.app.get("db"), currentUserId)
    .then((patterns) => {
      res.json(PatternsService.serializePatterns(patterns));
    })
    .catch(next);
});

async function checkPatternExists(req, res, next) {
  try {
    const pattern = await PatternsService.getPatternById(
      req.app.get("db"),
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
