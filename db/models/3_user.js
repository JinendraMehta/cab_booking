/**
 * Model Definition File
 */
/**
 * System and 3rd Party libs
 */
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Schema = mongoose.Schema;
const Location = mongoose.model('location').schema;
const {ERROR_MESSAGES, STATUS_MESSAGES, NEARBY_LIMIT, CAB_STATUS} = require('../../utils/consts');
const {isEmail, isMobilePhone} = require('validator');
const Cab = mongoose.model('cab')
const LatLon = require('../../utils/LatLon/latlon-spherical');
/**
 * Schema Definition
 */

const bookingSchema = new Schema({
    pickupLocation: Location,
    destination: Location,
    fare: Schema.Types.Number,
    numberOfPassengers: Schema.Types.Number,
    status: Schema.Types.String,
    commuteStatus: Schema.Types.String,
    cabID: Schema.Types.ObjectID
}, {timestamps: true});


const userSchema = new Schema({
    name: {
        type: Schema.Types.String,
        trim: true,
        minlength: 3
    },
    phone: {
        type: Schema.Types.String,
        trim: true,
        required: true,
        unique: true,
        validate: {
            validator: isMobilePhone,
            message: () => ERROR_MESSAGES.SIGN_UP.INVALID_PHONE
        }
    },
    email: {
        type: Schema.Types.String,
        trim: true,
        required: true,
        unique: true,
        validate: {
            validator: isEmail,
            message: () => ERROR_MESSAGES.SIGN_UP.INVALID_EMAIL
        }
    },
    password: {
        type: Schema.Types.String,
        trim: true,
        required: true,
        validate: {
            validator: function (value) {
                return /^\S{10,}$/g.test(value)
            },
            message: () => ERROR_MESSAGES.SIGN_UP.INVALID_PASSWORD
        }
    },
    currentLocation: Location,
    bookings: [{
        type: bookingSchema
    }],
    tokens: [{
        type: Schema.Types.String,
    }]
}, {timestamps: true});

/**
 *
 * Static Methods
 *
 */
userSchema.options.toJSON = {
    transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
    }
};

bookingSchema.options.toJSON = {
    transform: function (doc, ret) {
        ret.bookingID = ret._id;
        delete ret._id;
        delete ret.__v;
    }
}

userSchema.statics.findByCredentials = function (email, password) {
    let User = this;

    return User.findOne({email}).then((user) => {
        if (!user) {
            return Promise.reject({message: ERROR_MESSAGES.LOGIN.USER_NOT_EXISTS});
        }
        return new Promise((resolve, reject) => {
            bcrypt.compare(password, user.password, (err, res) => {
                if (res) {
                    resolve(user);
                } else {
                    reject({message: ERROR_MESSAGES.LOGIN.INVALID_CREDENTIALS});
                }
            });
        });
    }, (err) =>  Promise.reject(err));
};


userSchema.statics.createUser = function (email, password, name, phone) {
    let User = this;

    return User.exists({$or: [{'email': email}, {'phone': phone}]}).then(function (result) {
        if (result) {
            return Promise.reject({message: ERROR_MESSAGES.SIGN_UP.USER_EXISTS})
        } else {
            let user = new User({
                name: name,
                email: email,
                password: password,
                phone: phone
            });

            return user.save().then((newUser) => {
                return Promise.resolve(newUser)
            }).catch(err => {
                return Promise.reject({message: STATUS_MESSAGES.BAD_REQUEST} )
            })
        }
    }).catch(e => {
        return Promise.reject(e.message)
    });
};

userSchema.statics.findByToken = function (token) {
    let User = this;
    let decoded;

    try {
        decoded = jwt.verify(token, "$ecret$Alt#@");
    } catch (e) {
        return Promise.reject();
    }

    return User.findOne({
        _id: decoded._id,
        tokens: token,
    }).then(user => {
        return Promise.resolve(user);
    }).catch(err => {
        return Promise.reject(STATUS_MESSAGES.UNAUTHORIZED)
    });
};

/**
 * Instance Methods
 */
userSchema.methods.generateAuthToken = function () {
    let user = this;
    let token = jwt.sign({_id: user._id.toHexString()}, "$ecret$Alt#@").toString();

    user.tokens.push(token);

    return user.save().then(() => {
        return token;
    });
};

userSchema.methods.removeToken = function (token) {
    let user = this;
    let index = user.tokens.indexOf(token);

    //ideally i would use $pull but was facing issues
    if (index === -1) {
        return Promise.reject(STATUS_MESSAGES.UNAUTHORIZED)
    }
    if (user.tokens.length === 1) {
        user.tokens.pop();
    } else {
        user.tokens = user.tokens.splice(index, 1);
    }
    user.markModified('tokens');
    return user.save();
};

userSchema.methods.getNearbyCabs = function (ignoreBooked, numberOfSeats) {

    let user = this;
    let nearbyCabs = [];

    let userPoint = new LatLon(user.currentLocation);
    let cabPoint;
    let distance;
    let findFilter = {};

    if (ignoreBooked) {
        findFilter.status = CAB_STATUS.AVAILABLE;
    }
    if (numberOfSeats) {
        findFilter.numberOfSeats = {$gte: numberOfSeats}
    }

    return Cab.find(findFilter).then(cabs => {
        cabs.forEach(cab => {
            cabPoint = new LatLon(cab.location);
            distance = userPoint.distanceTo(cabPoint);
            if (distance < NEARBY_LIMIT) {
                cab = cab.toObject();
                delete cab.driver;
                nearbyCabs.push({cab: cab, distance: distance});
            }
        });

        return Promise.resolve(nearbyCabs);
    }).catch(err => {
        return Promise.reject(err.message);
    })

};

/**
 * Middleware
 */
userSchema.pre('save', function (next) {
    let user = this;

    if (user.isModified('password')) {
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
                user.password = hash;
                next();
            });
        });
    } else {
        next();
    }
});

/**
 * Export Schema
 */
module.exports = mongoose.model('user', userSchema);
