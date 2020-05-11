const express = require('express');
const router = express.Router();
const {ERROR_MESSAGES, SUCCESS_MESSAGES, STATUS_CODES, STATUS_MESSAGES} = require('../utils/consts');
const rateLimitLogin = require('../middleware/rateLimiter')('login');
const rateLimitSignUp = require('../middleware/rateLimiter')('sign up');
const paginate = require('../middleware/paginate');

module.exports = (dbConnection) => {
  const Users = require('../db/models/3_users')(dbConnection);
  const authenticate = require('../middleware/authentication')(Users);

  router.post('/sign-up', rateLimitSignUp, (req, res, next) => {

    const {email, password, name, phone} = req.body;
    let user = new Users(email, password, name, phone);
    if (user.inValid) {
      let err = user;
      return res.status(STATUS_CODES.BAD_REQUEST)
        .send(err ? err.message ? err.message : STATUS_MESSAGES.BAD_REQUEST : STATUS_MESSAGES.BAD_REQUEST);
    } else {
      user.saveNew().then(() => {
        return res.status(STATUS_CODES.CREATED)
          .send(SUCCESS_MESSAGES.SIGN_UP.SUCCESS);
      }).catch(err => {
        return res.status(STATUS_CODES.BAD_REQUEST)
          .send(err ? err.message ? err.message : STATUS_MESSAGES.BAD_REQUEST : STATUS_MESSAGES.BAD_REQUEST);
      })
    }
  });

  router.post('/login', rateLimitLogin, (req, res) => {
    const {email, password} = req.body;

    Users.findByCredentials(email, password).then((user) => {
      return user.generateAuthToken().then((token) => {
        return res.header('Authorization', token).status(STATUS_CODES.OK)
          .send(SUCCESS_MESSAGES.LOGIN.SUCCESS);
      });
    }).catch((err) => {
      switch (err.message) {
        case ERROR_MESSAGES.LOGIN.INVALID_CREDENTIALS:
          return res.status(STATUS_CODES.UNAUTHORIZED).send(ERROR_MESSAGES.LOGIN.INVALID_CREDENTIALS);
        case ERROR_MESSAGES.LOGIN.USER_NOT_EXISTS:
          return res.status(STATUS_CODES.BAD_REQUEST).send(ERROR_MESSAGES.LOGIN.USER_NOT_EXISTS);
        default:
          return res.status(STATUS_CODES.BAD_REQUEST).send(err.message || STATUS_MESSAGES.BAD_REQUEST);
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
      return res.status(STATUS_CODES.OK)
        .send(STATUS_MESSAGES.OK);
    }).catch(err => {
      return res.status(STATUS_CODES.BAD_REQUEST)
        .send(STATUS_MESSAGES.BAD_REQUEST);
    })
  });

  router.get('/current/bookings', authenticate, (req, res, next) => {
    req.user.getBookings().then(bookings => {
      req.rawResults = bookings;
      next();
    }).catch(e => {
     return res.status(STATUS_CODES.BAD_REQUEST).send(e.message || STATUS_MESSAGES.BAD_REQUEST);
    });
  },paginate);

  router.delete('/logout', authenticate, (req, res) => {
    req.user.removeToken(req.token).then((doc) => {
      res.status(STATUS_CODES.OK).send(SUCCESS_MESSAGES.LOGOUT.SUCCESS);
    }).catch((e) => {
      return res.status(STATUS_CODES.UNAUTHORIZED)
        .send(e.message || STATUS_MESSAGES.UNAUTHORIZED);
    });
  });

  return router;
};
