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
const mongoose = require('mongoose');
const Cab = mongoose.model('cab');
const Location = mongoose.model('location');
const LatLon = require("../utils/LatLon/latlon-spherical");
let ObjectID = require('mongodb').ObjectID;


const authenticate = require('../middleware/authentication');

router.post('/book', authenticate, (req, res) => {

    let {cabID, numberOfPassengers, pickupLocation, destination} = req.body;
    let pickUp = new Location({
        latitude: parseFloat(pickupLocation.latitude),
        longitude: parseFloat(pickupLocation.latitude)
    });

    let dest = new Location({
        latitude: parseFloat(destination.latitude),
        longitude: parseFloat(destination.latitude)
    })

    if (!pickUp.isValid() || !dest.isValid()) {
        res.status(STATUS_CODES.BAD_REQUEST)
            .send(STATUS_MESSAGES.BAD_REQUEST);
    }

    Cab.findOne({
        _id: cabID,
        numberOfSeats: {$gte: numberOfPassengers},
        status: CAB_STATUS.AVAILABLE
    })
        .then(cab => {
            if (!cab) {
                return res.status(STATUS_CODES.BAD_REQUEST)
                    .send(ERROR_MESSAGES.CABS.NO_CABS);
            }
            console.log(pickUp, dest)
            let pickupPoint = new LatLon(pickUp.toObject());
            let destinationPoint = new LatLon(dest.toObject());

            let distance = pickupPoint.distanceTo(destinationPoint);
            let fare = Math.ceil(distance * numberOfPassengers);
            cab.status = CAB_STATUS.BOOKED;
            let bookingID = new ObjectID();

            cab.save().then(() => {
                let booking = {
                    _id: bookingID,
                    pickupLocation: pickUp,
                    destination: dest,
                    fare: fare,
                    numberOfPassengers: numberOfPassengers,
                    cabID: cab._id,
                    status: BOOKING_STATUS.CONFIRMED,
                    commuteStatus: COMMUTE_STATUS.NOT_STARTED
                };

                req.user.update({
                    $push: {
                        bookings: booking
                    }
                }, {safe: true, upsert: true}, (err, data) => {
                    if (err) {
                        res.status(STATUS_CODES.BAD_REQUEST)
                            .send(STATUS_MESSAGES.BAD_REQUEST);
                    } else {
                        res.status(STATUS_CODES.OK).send({
                            message: SUCCESS_MESSAGES.BOOKING.CONFIRMED,
                            bookingID: bookingID,
                        })
                    }
                });
            }).catch(console.log)
        })
        .catch(err => {
            console.log(err)
            res.status(STATUS_CODES.BAD_REQUEST).send(STATUS_MESSAGES.BAD_REQUEST);
        })

});


module.exports = router;