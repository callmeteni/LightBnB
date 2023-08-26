const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

pool.query(`SELECT title FROM properties LIMIT 10;`)
.then(response => {console.log(response)})

const properties = require("./json/properties.json");
const users = require("./json/users.json");

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  const query = `
  SELECT * FROM users
  WHERE email = $1;
  `

  return pool.query(query,[email.toLowerCase()])
  .then((res) => res.rows[0])
  .catch((err) =>console.log(err));
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
const query = `
SELECT * FROM users
WHERE id = $1;
`
return pool.query(query,[id])
.then((res) => res.rows[0])
.catch((err) => console.log(err));
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  const query = `
  INSERT  INTO users (name, password, email) VALUES 
  ($1, $2, $3);
  `
  console.log(user);
  return pool.query(query, [user.name,user.password,user.email])
    .then((res) => res.rows[0])
    .catch(error => console.error(error));
};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  const query = `
    SELECT reservations.*, properties.*, AVG(rating) AS average_rating
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    LEFT JOIN property_reviews ON properties.id = property_reviews.property_id
    WHERE reservations.guest_id = $1
    GROUP BY reservations.id, properties.id
    ORDER BY reservations.start_date
    LIMIT $2;
  `;

  const values = [guest_id, limit];

  return pool.query(query, values)
    .then((result) => result.rows)
    .catch((error) => {
      console.error(error.message);
      throw error;
    });
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {
    // 1
    const queryParams = [];
    // 2
    let queryString = `
    SELECT properties.*, avg(property_reviews.rating) as average_rating
    FROM properties
    JOIN property_reviews ON properties.id = property_id
    `;

    const filterConditions = [];

    if (options.owner_id) {
      queryParams.push(options.owner_id);
      filterConditions.push(`owner_id = $${queryParams.length}`);
    }
  
    if (options.minimum_price_per_night && options.maximum_price_per_night) {
      queryParams.push(options.minimum_price_per_night * 100); // Convert to cents
      queryParams.push(options.maximum_price_per_night * 100);
      filterConditions.push(`cost_per_night >= $${queryParams.length - 1} AND cost_per_night <= $${queryParams.length}`);
    }
  
    if (options.minimum_rating) {
      queryParams.push(options.minimum_rating);
      filterConditions.push(`avg(property_reviews.rating) >= $${queryParams.length}`);
    }
  
    if (filterConditions.length > 0) {
      queryString += `WHERE ${filterConditions.join(' AND ')} `;
    }
  
    // 3
    if (options.city) {
      queryParams.push(`%${options.city}%`);
      if (filterConditions.lenngth>0){
        queryString += ' AND ';
      } else{
        queryString += 'WHERE ';
      }
      queryString += ` city LIKE $${queryParams.length} `;
    }
  
    // 4
    queryParams.push(limit);
    queryString += `
    GROUP BY properties.id
    ORDER BY cost_per_night
    LIMIT $${queryParams.length};
    `;
  
    // 5
    console.log(queryString, queryParams);
  
    // 6
    return pool.query(queryString, queryParams).then((res) => res.rows);
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const query = `
  INSERT INTO properties (owner_id,
    title,
    description,
    thumbnail_photo_url,
    cover_photo_url,
    cost_per_night,
    parking_spaces,
    number_of_bathrooms,
    number_of_bedrooms,
    country,
    street,
    city,
    province,
    post_code,
    active
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
  `
  return pool.query(query,[
  property.owner_id,
  property.title,
  property.description,
  property.thumbnail_photo_url,
  property.cover_photo_url,
  property.cost_per_night,
  property.parking_spaces,
  property.number_of_bathrooms,
  property.number_of_bedrooms,
  property.country,
  property.street,
  property.city,
  property.province,
  property.post_code,
  property.active])

  .then((res) => res.rows[0])
  .catch((err) =>console.log(err));
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
