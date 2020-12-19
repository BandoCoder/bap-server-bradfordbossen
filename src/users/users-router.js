const express = require("express");
const path = require("path");
const UsersService = require("./users-service");

const usersRouter = express.Router();
const jsonParser = express.json();

usersRouter.post("/", jsonParser, (req, res, next) => {
  const { user_name, email, password } = req.body;
  for (const field of ["user_name", "email", "password"])
    if (!req.body[field])
      return res.status(400).json({
        error: `Missing '${field}' in request body`,
      });

  const passwordError = UsersService.validatePassword(password);
  if (passwordError) return res.status(400).json({ error: passwordError });

  const emailError = UsersService.validateEmail(email);
  if (emailError) return res.status(400).json({ error: emailError });

  UsersService.hasUserWithUserName(req.app.get("db"), user_name)
    .then((hasUserWithUserName) => {
      if (hasUserWithUserName) {
        res.status(400).json({ error: "Username already taken" });
      } else {
        return true;
      }
    })
    .then(() => {
      UsersService.hasUserWithEmail(req.app.get("db"), email)
        .then((hasUserWithEmail) => {
          if (hasUserWithEmail) {
            res.status(400).json({ error: "Email is already being used" });
          } else {
            return true;
          }
        })
        .then(() => {
          UsersService.hashPassword(password)
            .then((hashedPassword) => {
              const newUser = {
                user_name,
                password: hashedPassword,
                email,
              };

              UsersService.insertUser(req.app.get("db"), newUser).then(
                (user) => {
                  res.status(201).json(UsersService.serializeUser(user));
                }
              );
            })
            .catch(next);
        })
        .catch(next);
    })
    .catch(next);
});

module.exports = usersRouter;
