const express = require("express");
const bcrypt = require("bcryptjs");
const database = require("../db/database");

const router = express.Router();

const getUserWithEmail = (email) => {
  return database.getUserWithEmail(email);
};

// Return a user with a given id
const getUserWithId = (id) => {
  return database.getUserWithId(id);
};

// add User
const addUser = (user) => {
  user.password = bcrypt.hashSync(user.password, 12);
  return database.addUser(user);
};



// Create a new user
router.post("/", (req, res) => {
  const user = req.body;
  addUser(user)
    .then((newUser) => {
      if (!newUser) {
        return res.send({ error: "error" });
      }

      req.session.userId = newUser.id;
      res.send("🤗");
    })
    .catch((e) => res.send(e));
});

// Log a user in
router.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  database.getUserWithEmail(email).then((user) => {
    if (!user) {
      return res.send({ error: "no user with that id" });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.send({ error: "error" });
    }

    req.session.userId = user.id;
    res.send({
      user: {
        name: user.name,
        email: user.email,
        id: user.id,
      },
    });
  });
});

// Log a user out
router.post("/logout", (req, res) => {
  req.session.userId = null;
  res.send({});
});
// Return information about the current user (based on cookie value)
router.get("/me", (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.send({ message: "not logged in" });
  }

  database
    .getUserWithId(userId)
    .then((user) => {
      if (!user) {
        return res.send({ error: "no user with that id" });
      }

      res.send({
        user: {
          name: user.name,
          email: user.email,
          id: userId,
        },
      });
    })
    .catch((e) => res.send(e));
});

module.exports = router;