const express = require('express');
const router = express.Router();
const {ERROR_MESSAGES, SUCCESS_MESSAGES, STATUS_CODES, STATUS_MESSAGES} = require('../utils/consts');
const rateLimitLogin = require('../middleware/rateLimiter')('login');
const rateLimitSignUp = require('../middleware/rateLimiter')('sign up');

module.exports = (dbConnection) => {
  const Users = require('../db/models/3_users')(dbConnection);
  const authenticate = require('../middleware/authentication')(Users);

  router.post('/sign-up', rateLimitSignUp, (req, res, next) => {

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

  router.post('/login', rateLimitLogin, (req, res) => {
    const {email, password} = req.body;

    Users.findByCredentials(email, password).then((user) => {
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
          res.status(STATUS_CODES.BAD_REQUEST).send(err.message || STATUS_MESSAGES.BAD_REQUEST);
      }
    });
  });

  router.post('/current/location', authenticate, (req, res) => {
    let {latitude, longitude} = req.body;

    if(isNaN(latitude) || isNaN(longitude)) {
      return res.status(STATUS_CODES.BAD_REQUEST).send(ERROR_MESSAGES.LAT_LONG);
    }
    req.user.latitude = latitude;
    req.user.longitude = longitude;

    req.user.save(['latitude','longitude']).then(() => {
      res.status(STATUS_CODES.OK)
        .send(STATUS_MESSAGES.OK);
    }).catch(err => {
      res.status(STATUS_CODES.BAD_REQUEST)
        .send(STATUS_MESSAGES.BAD_REQUEST);
    })
  });

  router.get('/current/bookings', authenticate, (req, res) => {
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
