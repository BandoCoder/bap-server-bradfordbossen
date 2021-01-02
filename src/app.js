require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const { NODE_ENV, CLIENT_ORIGIN } = require("./config");

//Import Routers
const authRouter = require("./auth/auth-router");
const usersRouter = require("./users/users-router");
const patternsRouter = require("./patterns/patterns-router");

const app = express();

//Morgan options, changes depending on mode
const morganOption = NODE_ENV === "production" ? "tiny" : "common";

// ** Middleware **

//Morgan used for logging server activity in development enviornment
app.use(morgan(morganOption));
//Helmet for everything
app.use(helmet());
//Enable cors for all browsers
app.use(cors());

// ** Main App **

//Initialize Routers
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/patterns", patternsRouter);

//Error Handling
app.use(function errorHandler(error, req, res, next) {
  let response;
  if (NODE_ENV === "production") {
    response = { error: { message: "server error" } };
  } else {
    console.error(error);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
});

module.exports = app;
