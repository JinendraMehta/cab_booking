const express = require('express');
const router = express.Router();
const {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  STATUS_CODES,
  STATUS_MESSAGES,
  BOOKING_STATUS,
  CAB_STATUS,
  COMMUTE_STATUS
} = require('../utils/consts');
const LatLon = require("../utils/LatLon/latlon-spherical");

module.exports = (dbConnection) => {
  const Users = require('../db/models/3_users')(dbConnection);
  const authenticate = require('../middleware/authentication')(Users);
  const Cabs = require('../db/models/2_cabs')(dbConnection);

  router.post('/book', authenticate, (req, res) => {

    let {cabID, numberOfPassengers, pickupLocation, destination} = req.body;

    if (
      isNaN(parseFloat(pickupLocation.latitude)) ||
      isNaN(parseFloat(pickupLocation.longitude)) ||
      isNaN(parseFloat(destination.latitude)) ||
      isNaN(parseFloat(destination.longitude))
    ) {

      res.status(STATUS_CODES.BAD_REQUEST)
        .send(ERROR_MESSAGES.LAT_LONG);
    } else {
      Cabs.findByAvailabilityOrSeatsOrID(true, numberOfPassengers, cabID)
        .then(cabs => {
          let cab = cabs[0];

          if (!cab) {
            return res.status(STATUS_CODES.BAD_REQUEST)
              .send(ERROR_MESSAGES.CABS.NO_CABS);
          }
          let pickupPoint = new LatLon(pickupLocation.latitude,pickupLocation.longitude);
          let destinationPoint = new LatLon(destination.latitude,destination.longitude);

          let distance = pickupPoint.distanceTo(destinationPoint);
          let fare = Math.ceil(distance * numberOfPassengers);
          cab.status = CAB_STATUS.BOOKED;

          cab.save(['status']).then(() => {

            req.user.createBooking(
              {
                pickup_latitude: pickupLocation.latitude,
                pickup_longitude: pickupPoint.longitude,
                destination_latitude: destinationPoint.latitude,
                destination_longitude: destinationPoint.longitude,
                user_id: req.user.id,
                fare: fare,
                status: BOOKING_STATUS.CONFIRMED,
                number_of_passengers: numberOfPassengers,
                commute_status: COMMUTE_STATUS.NOT_STARTED,
                cab_id: cabID
              }
            ).then(bookingID => {
              res.status(STATUS_CODES.OK).send({
                message: SUCCESS_MESSAGES.BOOKING.CONFIRMED,
                bookingID: bookingID,
              })
            });

          })
        })
        .catch(err => {
          console.log(err);
          res.status(STATUS_CODES.BAD_REQUEST).send(err.message || STATUS_MESSAGES.BAD_REQUEST);
        })
    }


  });

  return router
};
