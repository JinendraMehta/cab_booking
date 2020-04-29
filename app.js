/**
 * System and 3rd party libs
 */
let express = require('express');
let path = require('path');
const fs = require('fs');
let mongoose = require('mongoose');
const cors = require('cors');

/**
 * Required Services
 */
let logger = require('morgan');

/**
 * Global declarations
 */
let models = path.join(__dirname, 'db', 'models');
let seeds = path.join(__dirname,'db','seeders');

let dbURL = process.env.DB_URL || 'mongodb://127.0.0.1:27017/cab_booking';

/**
 * Bootstrap Models
 */
fs.readdirSync(models)
    .forEach(file => require(path.join(models, file)));

/**
 * Seed Models
 */

fs.readdirSync(seeds)
    .forEach(file => require(path.join(seeds,file)));

/**
 * Bootstrap App
 */
let app = express();

//CORS
app.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', ' X-Requested-With', ' Content-Type', ' Accept ', ' Authorization'],
    credentials: true
}));
app.use(logger('common'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

/**
 * Import and Register Routes
 */
let userRouter = require('./routes/user');
let cabRouter = require('./routes/cab');

app.use('/user', userRouter);
app.use('/cab',cabRouter);

/**
 * Catch 404 routes
 */
app.use(function (req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/**
 * Error Handler
 */
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);
    res.json(err);
});

/**
 * Mongoose Configuration
 */
mongoose.Promise = global.Promise;

mongoose.connection.on('connected', () => {
     console.info('DATABASE - Connected');
});

mongoose.connection.on('error', (err) => {
     console.error('DATABASE - Error:' + err);
});

mongoose.connection.on('disconnected', () => {
    console.warn('DATABASE - disconnected  Retrying....');
});

let connectDb = function () {
    const dbOptions = {
        poolSize: 5,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false,
        family: 4
    };
    mongoose.connect(dbURL, dbOptions)
        .catch(err => {
            console.error('DATABASE - Error:' + err);
        });
};

connectDb();
module.exports = app;
