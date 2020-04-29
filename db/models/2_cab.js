/**
 * Model Definition File
 */

/**
 * System and 3rd Party libs
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const {isMobilePhone} = require('validator');
const {ERROR_MESSAGES} = require('../../utils/consts');
const Location = mongoose.model('location').schema;
/**
 * Schema Definition
 */

const driverSchema = new Schema({
    name: Schema.Types.String,
    phone: {
        type: Schema.Types.String,
        trim: true,
        required: true,
        unique: true,
        validate: {
            validator: isMobilePhone,
            message: ERROR_MESSAGES.SIGN_UP.INVALID_PHONE
        }
    },
}, {timestamps: true});

const cabSchema = new Schema({
    numberPlate: {
        type: Schema.Types.String,
        unique: true,
        required: true
    },
    numberOfSeats: {
        type: Schema.Types.Number,
        required: true,
    },
    location: {
        type: Location,
        required: true,
    },
    driver: {
        type: driverSchema,
        required: true
    },
    status: {
        type: Schema.Types.String,
        required: true
    }
}, {timestamps: true});

/**
 * Static Methods
 */


/**
 * Export Schema
 */
module.exports = mongoose.model('cab', cabSchema);