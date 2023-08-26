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

//create Listing link
const addProperty = function (property) {
  const queryParams = [
    property.owner_id,
    property.title,
    property.description,
    property.thumbnail_photo_url,
    property.cover_photo_url,
    property.cost_per_night,
    property.street,
    property.city,
    property.province,
    property.post_code,
    property.country,
    property.parking_spaces,
    property.number_of_bathrooms,
    property.number_of_bedrooms
  ];

  const queryString = `
    INSERT INTO properties (
      owner_id, title, description, thumbnail_photo_url, cover_photo_url,
      cost_per_night, street, city, province, post_code, country,
      parking_spaces, number_of_bathrooms, number_of_bedrooms
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
    )
    RETURNING *;
  `;

  return pool.query(queryString, queryParams)
    .then((res) => res.rows[0]);
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
  console.log(req.body, "This is an error fro user routes");
  database.getUserWithEmail(email).then((user) => {
    if (!user) {
      return res.send({ error: "no user with that id" });
    }
    console.log("This is the pass", user)
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