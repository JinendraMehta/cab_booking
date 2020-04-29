const express = require('express');
const router = express.Router();
const {ERROR_MESSAGES, SUCCESS_MESSAGES, STATUS_CODES, STATUS_MESSAGES} = require('../utils/consts');
const mongoose = require('mongoose');
const User = mongoose.model('user');
const Location = mongoose.model('location');

const authenticate = require('../middleware/authentication');

router.post('/signup', (req, res, next) => {

    const {email, password, name, phone} = req.body;

    User.createUser(email, password, name, phone).then(user => {
        res.status(STATUS_CODES.CREATED)
            .send(SUCCESS_MESSAGES.SIGN_UP.SUCCESS);
    }).catch(err => {
        res.status(STATUS_CODES.BAD_REQUEST)
            .send(err || STATUS_MESSAGES.BAD_REQUEST);
    })
});

router.post('/login', (req, res) => {
    const {email, password} = req.body;

    User.findByCredentials(email, password).then((user) => {
        return user.generateAuthToken().then((token) => {
            res.header('Authorization', token).status(STATUS_CODES.OK)
                .send(SUCCESS_MESSAGES.LOGIN.SUCCESS);
        });
    }).catch((err) => {
        switch (err.message) {
            case ERROR_MESSAGES.LOGIN.INVALID_CREDENTIALS:
                res.status(STATUS_CODES.UNAUTHORIZED).send(ERROR_MESSAGES.LOGIN.INVALID_CREDENTIALS);
                break;
            case ERROR_MESSAGES.LOGIN.USER_NOT_EXISTS:
                res.status(STATUS_CODES.BAD_REQUEST).send(ERROR_MESSAGES.LOGIN.USER_NOT_EXISTS);
                break;
            default:
                res.sendStatus(STATUS_CODES.BAD_REQUEST);
        }
    });
});

router.post('/setCurrentLocation', authenticate, (req, res) => {
    let {latitude, longitude} = req.body;

    req.user.currentLocation = new Location({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
    });

    if(!req.user.currentLocation.isValid()){
       return res.status(STATUS_CODES.BAD_REQUEST)
            .send(STATUS_MESSAGES.BAD_REQUEST);
    }

    req.user.markModified('currentLocation');

    req.user.save().then(() => {
        res.status(STATUS_CODES.OK)
            .send(STATUS_MESSAGES.OK);
    }).catch(err => {
        res.status(STATUS_CODES.BAD_REQUEST)
            .send(STATUS_MESSAGES.BAD_REQUEST);
    })
});

router.get('/nearByCabs', authenticate, (req, res) => {
    let {ignoreBooked, numberOfSeats} = req.query;
    numberOfSeats = parseInt(numberOfSeats);
    ignoreBooked = ignoreBooked === 'true';

    if (isNaN(numberOfSeats)) {
       return res.status(STATUS_CODES.BAD_REQUEST)
            .send(STATUS_MESSAGES.BAD_REQUEST);
    }

    if (!req.user.currentLocation) {
       return res.status(STATUS_CODES.BAD_REQUEST)
            .send(ERROR_MESSAGES.CABS.NEARBY.NO_REFERENCE)
    }

    req.user.getNearbyCabs(ignoreBooked, numberOfSeats).then(cabs => {
        res.send(cabs);
    }).catch(err => {
        res.status(STATUS_CODES.BAD_REQUEST)
            .send(STATUS_MESSAGES.BAD_REQUEST);
    });
});

router.get('/bookings',authenticate,(req,res) => {
    res.status(STATUS_CODES.OK)
        .send(req.user.bookings);
});

router.delete('/logout', authenticate, (req, res) => {
    req.user.removeToken(req.token).then((doc) => {
        res.status(STATUS_CODES.OK).send(SUCCESS_MESSAGES.LOGOUT.SUCCESS);
    }).catch((e) => {
        res.status(STATUS_CODES.UNAUTHORIZED)
            .send(STATUS_MESSAGES.UNAUTHORIZED);
    });
});

module.exports = router;