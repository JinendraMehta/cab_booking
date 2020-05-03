const express = require('express');
const router = express.Router();
const {ERROR_MESSAGES, SUCCESS_MESSAGES, STATUS_CODES, STATUS_MESSAGES} = require('../utils/consts');

module.exports = (dbConnection) => {
  const Users = require('../db/models/3_users')(dbConnection);
  const authenticate = require('../middleware/authentication')(Users);

  router.post('/signup', (req, res, next) => {

    const {email, password, name, phone} = req.body;
    let user = new Users(email, password, name, phone);
    if (user.inValid) {
      let err = user;
      res.status(STATUS_CODES.BAD_REQUEST)
        .send(err ? err.message ? err.message : STATUS_MESSAGES.BAD_REQUEST : STATUS_MESSAGES.BAD_REQUEST);
    } else {
      user.saveNew().then(() => {
        res.status(STATUS_CODES.CREATED)
          .send(SUCCESS_MESSAGES.SIGN_UP.SUCCESS);
      }).catch(err => {
        res.status(STATUS_CODES.BAD_REQUEST)
          .send(err ? err.message ? err.message : STATUS_MESSAGES.BAD_REQUEST : STATUS_MESSAGES.BAD_REQUEST);
      })
    }
  });

  router.post('/login', (req, res) => {
    const {email, password} = req.body;

    Users.findByCredentials(email, password).then((user) => {
      return user.generateAuthToken().then((token) => {
        res.header('Authorization', token).status(STATUS_CODES.OK)
          .send(SUCCESS_MESSAGES.LOGIN.SUCCESS);
      });
    }).catch((err) => {
      console.log(err);
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

  router.post('/location/current', authenticate, (req, res) => {
    let {latitude, longitude} = req.body;

    if(isNaN(latitude) || isNaN(longitude)) {
      return res.status(STATUS_CODES.BAD_REQUEST)(ERROR_MESSAGES.LAT_LONG);
    }
    req.user.latitude = latitude;
    req.user.longitude = longitude;

    req.user.save(['latitude','longitude']).then(() => {
      res.status(STATUS_CODES.OK)
        .send(STATUS_MESSAGES.OK);
    }).catch(err => {
      console.log(err)
      res.status(STATUS_CODES.BAD_REQUEST)
        .send(STATUS_MESSAGES.BAD_REQUEST);
    })
  });

  router.get('/cabs/near-by', authenticate, (req, res) => {
    let {ignore_booked, number_of_seats} = req.query;
    let numberOfSeats = parseInt(number_of_seats);
    let ignoreBooked = ignore_booked === 'true';

    if (isNaN(numberOfSeats)) {
      return res.status(STATUS_CODES.BAD_REQUEST)
        .send(STATUS_MESSAGES.BAD_REQUEST);
    }

    if (!req.user.latitude || !req.user.longitude) {
      return res.status(STATUS_CODES.BAD_REQUEST)
        .send(ERROR_MESSAGES.CABS.NEARBY.NO_REFERENCE)
    }

    req.user.getNearbyCabs(ignoreBooked, numberOfSeats).then(cabs => {
      res.send(cabs);
    }).catch(err => {
      res.status(STATUS_CODES.BAD_REQUEST)
        .send(err.message || STATUS_MESSAGES.BAD_REQUEST);
    });
  });

  router.get('/bookings', authenticate, (req, res) => {
    req.user.getBookings().then(bookings => {
      res.status(STATUS_CODES.OK)
        .send(bookings)
    }).catch(e => {
      res.status(STATUS_CODES.BAD_REQUEST).send(e.message || STATUS_MESSAGES.BAD_REQUEST);
    });
  });

  router.delete('/logout', authenticate, (req, res) => {
    req.user.removeToken(req.token).then((doc) => {
      res.status(STATUS_CODES.OK).send(SUCCESS_MESSAGES.LOGOUT.SUCCESS);
    }).catch((e) => {
      res.status(STATUS_CODES.UNAUTHORIZED)
        .send(e.message || STATUS_MESSAGES.UNAUTHORIZED);
    });
  });

  return router;
};
