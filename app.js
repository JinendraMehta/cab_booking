/**
 * System and 3rd party libs
 */
let express = require('express');
let path = require('path');
const fs = require('fs');
let mysql = require('mysql2');
const cors = require('cors');

/**
 * Required Services
 */
let logger = require('morgan');

/**
 * Global declarations
 */
let seeds = path.join(__dirname, 'db', 'seeders');

/**
 * Bootstrap App
 */
let app = express();

//CORS
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true
}));
app.use(logger('common'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

/**
 * Import and Register Routes
 */

/**
 * Create database connection
 */

let dbConnection = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  connectionLimit: 10,
});

/**
 * Seeding
 */
fs.readdirSync(seeds)
  .forEach(file => {
    if (file.split('.').pop() === 'js') require(path.join(seeds, file))(dbConnection.promise())
  });

let userRouter = require('./routes/user')(dbConnection.promise());
let cabRouter = require('./routes/cab')(dbConnection.promise());

app.use('/users', userRouter);
app.use('/cabs', cabRouter);

/**
 * Catch 404 routes
 */
app.use(function (req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

process.on('unhandledRejection', error => {
  console.log('unhandledRejection', error);
});

module.exports = app;
