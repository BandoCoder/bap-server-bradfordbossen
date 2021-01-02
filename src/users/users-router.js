const express = require("express");
const path = require("path");
const UsersService = require("./users-service");

const usersRouter = express.Router();
const jsonParser = express.json();

// ** Users Routes for New Users **

usersRouter.post("/", jsonParser, (req, res, next) => {
  //Knex instance
  let db = req.app.get("db");

  const { user_name, email, password } = req.body;

  //Validate Request
  for (const field of ["user_name", "email", "password"])
    if (!req.body[field])
      return res.status(400).json({
        error: `Missing '${field}' in request body`,
      });

  //Validate password & email is correct format
  const passwordError = UsersService.validatePassword(password);
  if (passwordError) return res.status(400).json({ error: passwordError });

  const emailError = UsersService.validateEmail(email);
  if (emailError) return res.status(400).json({ error: emailError });

  //Check if User already exists
  UsersService.hasUserWithUserName(db, user_name)
    .then((hasUserWithUserName) => {
      if (hasUserWithUserName) {
        res.status(400).json({ error: "Username already taken" });
      } else {
        return true;
      }
    })
    .then(() => {
      //Check if email is already taken
      UsersService.hasUserWithEmail(db, email)
        .then((hasUserWithEmail) => {
          if (hasUserWithEmail) {
            res.status(400).json({ error: "Email is already being used" });
          } else {
            return true;
          }
        })
        .then(() => {
          //Hash password to protect information
          UsersService.hashPassword(password)
            .then((hashedPassword) => {
              const newUser = {
                user_name,
                password: hashedPassword,
                email,
              };
              //Send request to insert user
              UsersService.insertUser(db, newUser).then((user) => {
                res.status(201).json(UsersService.serializeUser(user));
              });
            })
            .catch(next);
        })
        .catch(next);
    })
    .catch(next);
});

module.exports = usersRouter;
