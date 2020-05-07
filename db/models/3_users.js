const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {ERROR_MESSAGES, STATUS_MESSAGES, NEARBY_LIMIT, CAB_STATUS} = require('../../utils/consts');
const {isEmail, isMobilePhone} = require('validator');
const LatLon = require('../../utils/LatLon/latlon-spherical');

module.exports = (dbConnection) => {
  const Cabs = require('./2_cabs')(dbConnection);

  return class Users {
    constructor(email, password, name, phone, id, latitude, longitude) {

      let validation = Users.validate(email, password, name, phone);

      if (!id && !validation.isValid) {
        return {inValid: true, message: validation.message};
      } else {
        this.id = id;
      }

      if (!isNaN(latitude) && !isNaN(longitude)) {
        this.latitude = latitude;
        this.longitude = longitude;
      }

      this.email = email;
      this.password = password;
      this.name = name;
      this.phone = phone;
    }

    static tableName = 'users';

    static validate(email, password, name, phone) {
      let validationError = '';

      if (!email)
        validationError += ERROR_MESSAGES.SIGN_UP.EMAIL_MISSING + '\n';
      else if (!isEmail(email))
        validationError += ERROR_MESSAGES.SIGN_UP.INVALID_EMAIL + '\n'

      if (!phone)
        validationError += ERROR_MESSAGES.SIGN_UP.PHONE_MISSING + '\n';
      else if (!isEmail(email))
        validationError += ERROR_MESSAGES.SIGN_UP.INVALID_PHONE + '\n';

      if (!name)
        validationError += ERROR_MESSAGES.SIGN_UP.NAME_MISSING + '\n';
      else if (name.length < 3)
        validationError += ERROR_MESSAGES.SIGN_UP.INVALID_NAME + '\n';

      if (!password)
        validationError += ERROR_MESSAGES.SIGN_UP.PASSWORD_MISSING + '\n';
      else if (!/^\S{10,}$/g.test(password))
        validationError += ERROR_MESSAGES.SIGN_UP.INVALID_PASSWORD + '\n';

      if (validationError.length)
        return {isValid: false, message: validationError};
      else
        return {isValid: true}
    }

    static findByEmailOrPhone(email, phone) {
      let useEmail = email != undefined && isEmail(email);
      let usePhone = phone != undefined && isMobilePhone(phone);
      let queryStatement = '';

      if (useEmail && usePhone)
        queryStatement = `select * from ${Users.tableName} where phone = "${phone}" or email = "${email}"`;

      else if (useEmail)
        queryStatement = `select * from ${Users.tableName} where email = "${email}"`;

      else if (usePhone)
        queryStatement = `select * from ${Users.tableName} where phone = "${phone}"`;


      if (queryStatement) {
        return dbConnection.query(queryStatement)
          .then(([rows]) => {
            return rows;
          })
      } else {
        return Promise.resolve(0);
      }
    }

    static findByCredentials(email, password) {
      let errorMessage = '';
      if (!email)
        errorMessage += ERROR_MESSAGES.SIGN_UP.EMAIL_MISSING + '\n';
      else if (!isEmail(email))
        errorMessage += ERROR_MESSAGES.SIGN_UP.INVALID_EMAIL + '\n';

      if(!password)
        errorMessage += ERROR_MESSAGES.SIGN_UP.PASSWORD_MISSING

      if (errorMessage) {
        return Promise.reject({message: errorMessage});
      }

      return dbConnection.query(`select * from users where email = "${email}"`).then(([rows]) => {
        let userRaw = rows[0];

        if (!userRaw) {
          return Promise.reject({message: ERROR_MESSAGES.LOGIN.USER_NOT_EXISTS});
        }
        return new Promise((resolve, reject) => {
          bcrypt.compare(password, userRaw.password, (err, res) => {
            if (res) {
              resolve(new Users(userRaw.email, password, userRaw.name, userRaw.phone, userRaw.id));
            } else {
              reject({message: ERROR_MESSAGES.LOGIN.INVALID_CREDENTIALS});
            }
          });
        });
      }, (err) => Promise.reject(err))

    };

    static findByToken(token) {
      let decoded;

      try {
        decoded = jwt.verify(token, "$ecret$Alt#@");
      } catch (e) {
        console.log(e)
        return Promise.reject({message: ERROR_MESSAGES.AUTH});
      }

      return dbConnection.query(`select count(*) from auth_tokens where token="${token}"`).then(([rows]) => {
        if (rows[0]['count(*)'] == 0) {
          return Promise.reject({message: ERROR_MESSAGES.AUTH});
        }

        return Users.findByEmailOrPhone(decoded.email, decoded.phone).then(results => {
          let userRaw = results[0];
          if (!userRaw) {
            return Promise.reject();
          } else {
            return new Users(userRaw.email, userRaw.password, userRaw.name, userRaw.phone, userRaw.id, userRaw.latitude, userRaw.longitude)
          }
        }).catch(e => {
          console.log(e)
          return Promise.reject({message: ERROR_MESSAGES.AUTH});
        });
      })


    }

    static getCount() {
      return dbConnection.query(`select count(*) from ${Users.tableName}`).then(([rows]) => {
        return rows[0]['count(*)'];
      })
    }

    saveNew() {
      return Users.findByEmailOrPhone(this.email, this.phone).then(existingUsers => {
        if (existingUsers.length > 0) {
          return Promise.reject({message: ERROR_MESSAGES.SIGN_UP.USER_EXISTS});
        } else {
          return this.generateHashedPassword().then(() => {
            return dbConnection.execute(`insert into ${Users.tableName} (name,email,phone,password) values(?,?,?,?)`,
              [this.name, this.email, this.phone, this.hashedPassword]);
          });
        }
      })
    }

    save(fields) {
      if (this.id && fields.length) {
        let updateStatement = `update ${Users.tableName} set`;
        fields.forEach(field => {
          updateStatement += ' ' + field + '="' + this[field] + '", ';
        });

        updateStatement = updateStatement.substring(0, updateStatement.length - 2);

        updateStatement += ' where id=' + this.id;

        return dbConnection.query(updateStatement);
      } else {
        return Promise.reject({message: 'User ID not set or no fields provided to save'});
      }
    }

    generateHashedPassword() {
      return bcrypt.genSalt(10).then((salt) => {
        return bcrypt.hash(this.password, salt).then((hash) => {
          this.hashedPassword = hash;
        });
      });
    }

    generateAuthToken() {
      let token = jwt.sign({email: this.email, phone: this.phone}, "$ecret$Alt#@").toString();

      return dbConnection.execute('insert into auth_tokens (token,user_id) values (?,?)', [token, this.id])
        .then(() => {
          return token;
        });
    };

    getNearbyCabs(ignoreBooked, numberOfSeats) {

      let nearbyCabs = [];
      let userPoint = new LatLon(parseFloat(this.latitude), parseFloat(this.longitude));
      let cabPoint;
      let distance;

      return Cabs.findByAvailabilityOrSeatsOrID(ignoreBooked, numberOfSeats).then(cabs => {
        cabs.forEach(cab => {
          cabPoint = new LatLon(parseFloat(cab.latitude), parseFloat(cab.longitude));
          distance = userPoint.distanceTo(cabPoint);
          if (distance < NEARBY_LIMIT) {
            nearbyCabs.push({cab: cab, distance: distance});
          }
        });

        return Promise.resolve(nearbyCabs);
      }).catch(err => {
        return Promise.reject(err.message);
      })
    };

    getBookings() {
      if (!this.id) {
        return Promise.reject({message: "User not stored in DB"});
      } else {
        return dbConnection.query(`select * from bookings where user_id=${this.id}`).then(([bookings]) => {
          return bookings;
        })
      }
    }

    createBooking(bookingDetails) {
      let {
        user_id,
        cab_id,
        pickup_latitude,
        pickup_longitude,
        destination_latitude,
        destination_longitude,
        fare,
        number_of_passengers,
        status,
        commute_status
      } = bookingDetails;

      return dbConnection.execute('insert into bookings (user_id,cab_id,pickup_latitude,pickup_longitude,destination_latitude,destination_longitude,fare,number_of_passengers,status,commute_status) values(?,?,?,?,?,?,?,?,?,?)',
        [
          user_id,
          cab_id,
          pickup_latitude,
          pickup_longitude,
          destination_latitude,
          destination_longitude,
          fare,
          number_of_passengers,
          status,
          commute_status,
        ]).then(([details]) => {
          return details.insertId;
      })
    };

    removeToken(token) {
      return dbConnection.query(`delete from auth_tokens where token="${token}" and user_id=${this.id}`)
    }
  };
};
