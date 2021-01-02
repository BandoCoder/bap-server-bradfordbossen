const express = require("express");
const AuthService = require("./auth-service");
const { requireAuth } = require("../jwt");

const authRouter = express.Router();
const jsonParser = express.json();

//Auth endpoint with router, all post endpoints gather values from a form

authRouter.post("/login", jsonParser, (req, res, next) => {
  //Knex instance
  let db = req.app.get("db");

  const { user_name, password } = req.body;
  const loginUser = { user_name, password };

  // Validate Request
  for (const [key, value] of Object.entries(loginUser))
    if (value == null)
      return res.status(400).json({
        error: `Missing '${key}' in request body`,
      });

  //Make Request
  AuthService.getUserWithUserName(db, loginUser.user_name)
    .then((dbUser) => {
      //Compare Credentials
      if (!dbUser)
        return res.status(400).json({
          error: "Incorrect user_name or password",
        });
      return AuthService.comparePasswords(
        loginUser.password,
        dbUser.password
      ).then((compareMatch) => {
        if (!compareMatch)
          return res.status(400).json({
            error: "Incorrect user_name or password",
          });
        //Return JWT
        const sub = dbUser.user_name;
        const payload = { user_id: dbUser.id };
        res.send({
          authToken: AuthService.createJwt(sub, payload),
        });
      });
    })
    .catch(next);
});

//Refresh JWT
authRouter.post("/refresh", requireAuth, (req, res) => {
  const sub = req.user.user_name;
  const payload = { user_id: req.user.id };
  res.send({
    authToken: AuthService.createJwt(sub, payload),
  });
});

module.exports = authRouter;
