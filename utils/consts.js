module.exports = {
    COMMUTE_STATUS: {
        NOT_STARTED: 'NOT_STARTED',
        STARTED: 'STARTED',
        FINISHED: 'FINISHED'
    },
    BOOKING_STATUS: {
        CONFIRMED: 'CONFIRMED',
        CANCELED: 'CANCELED',
    },
    ERROR_MESSAGES: {
        AUTH: "Invalid auth token",
        LAT_LONG: 'latitude and longitude must be numeric.',
        SIGN_UP: {
            PHONE_MISSING: 'Phone number not provided.',
            NAME_MISSING: 'Name not provided',
            EMAIL_MISSING: 'Email not provided',
            PASSWORD_MISSING: 'Password not provided',
            INVALID_EMAIL: 'Invalid email',
            INVALID_PASSWORD: 'Minimum password length is 10 characters and no spaces allowed.',
            INVALID_PHONE: 'Invalid phone number',
            INVALID_NAME: 'Name must contain at least 3 character',
            USER_EXISTS: 'User already exists.'
        },
        LOGIN: {
            USER_NOT_EXISTS: 'User doesn\'t exist',
            INVALID_CREDENTIALS: 'Invalid credentials',
        },
        CABS: {
            NEARBY: {
                NO_REFERENCE: 'Current location not set'
            },
            NO_CABS: 'No matching cabs'
        }
    },
    SUCCESS_MESSAGES: {
        SIGN_UP: {
            SUCCESS: 'Sign up success',
        },
        LOGIN: {
            SUCCESS: 'Login success'
        },
        LOGOUT: {
            SUCCESS: 'Logout success'
        },
        BOOKING: {
            CONFIRMED: 'Booking confirmed'
        }
    },
    STATUS_CODES: {
        OK: 200,
        CREATED: 201,
        ACCEPTED: 202,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
    },
    STATUS_MESSAGES: {
        OK: 'OK',
        CREATED: 'CREATED',
        ACCEPTED: 'ACCEPTED',
        BAD_REQUEST: 'BAD_REQUEST',
        UNAUTHORIZED: 'UNAUTHORIZED',
    },
    CAB_STATUS: {
        BOOKED: 'BOOKED',
        AVAILABLE: 'AVAILABLE',
    },
    NEARBY_LIMIT: 2000
};
