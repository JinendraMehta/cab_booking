/**
 * Integration Test Suite
 */

const axios = require('axios/index');
const CONSTS = require('./utils/consts');
const {ONE_USER_DATA} = require('./utils/testUtils/data');
const {pick} = require('lodash');
const {server, dbConnection} = require('./bin/www');

global.cache = require('./utils/cache');
global.line = '\n' + '-'.repeat(40) + '\n';
global.server = server;
global.dbConnection = dbConnection;

let BASE_URL = 'http://localhost:' + process.env.port || 3000;

beforeAll(() => {
  return new Promise((resolve) => {
    server.on('listening', () => {
      cache.on('connect', () => {
        dbConnection.on('release', () => {
          resolve();
        })
      })
    })
  })
});

describe.each([
  [
    {}, CONSTS.ERROR_MESSAGES.SIGN_UP.EMAIL_MISSING + '\n'
  + CONSTS.ERROR_MESSAGES.SIGN_UP.PHONE_MISSING + '\n'
  + CONSTS.ERROR_MESSAGES.SIGN_UP.NAME_MISSING + '\n'
  + CONSTS.ERROR_MESSAGES.SIGN_UP.PASSWORD_MISSING + '\n'
  ],
  [
    ONE_USER_DATA, CONSTS.SUCCESS_MESSAGES.SIGN_UP.SUCCESS
  ],
  [
    ONE_USER_DATA, CONSTS.ERROR_MESSAGES.SIGN_UP.USER_EXISTS
  ]
])(line + 'Sign up' + line, (data, expected) => {
  it(`returns ${expected}`, (done) => {

    axios.post(`${BASE_URL}/users/sign-up`, data).then(({data}) => {
      expect(data).toBe(expected);
      done();

    }).catch(({response}) => {
      expect(response.data).toBe(expected);
      done();
    })
  })
});

describe.each([
  [
    {}, CONSTS.ERROR_MESSAGES.SIGN_UP.EMAIL_MISSING + '\n'
  + CONSTS.ERROR_MESSAGES.SIGN_UP.PASSWORD_MISSING
  ],
  [
    {email: 'random@mail.com', password: 'randomPassword'}, CONSTS.ERROR_MESSAGES.LOGIN.USER_NOT_EXISTS
  ],
  [
    pick(ONE_USER_DATA, ['email']), CONSTS.ERROR_MESSAGES.SIGN_UP.PASSWORD_MISSING
  ],
  [
    pick(ONE_USER_DATA, ['email', 'password']), CONSTS.SUCCESS_MESSAGES.LOGIN.SUCCESS,
  ]
])(line + 'Login' + line, (data, expected) => {
  it(`returns ${expected}`, (done) => {

    axios.post(`${BASE_URL}/users/login`, data).then(({data, headers}) => {
      expect(data).toBe(expected);

      if (data === CONSTS.SUCCESS_MESSAGES.LOGIN.SUCCESS) {
        let token = headers['authorization'];
        expect(token).toBeDefined();
        cache.setAsync('auth_token', token).then(() => {
          done();
        }).catch(e => {
          console.log(e)
        })
      } else
        done();

    }).catch((error) => {
      expect(error.response.data).toBe(expected);
      done();
    });

  }, 6000)
});

describe(line + 'Cabs before current location' + line, () => {
  let URL = `${BASE_URL}/cabs/near-by`;
  it(`returns ${CONSTS.ERROR_MESSAGES.AUTH}`, () => {
    return axios.get(URL).catch(({response}) => {
      expect(response.data).toBe(CONSTS.ERROR_MESSAGES.AUTH);
    })
  });

  it(`returns ${CONSTS.ERROR_MESSAGES.CABS.NEARBY.NO_REFERENCE}`, (done) => {
    cache.getAsync('auth_token').then(token => {
      axios.get(URL, {
        headers: {
          "Authorization": token
        }
      }).catch(({response, request}) => {
        expect(response.data).toBe(CONSTS.ERROR_MESSAGES.CABS.NEARBY.NO_REFERENCE);
        done();
      })
    });
  });
});

describe(line + 'Current Location' + line, () => {
  let URL = `${BASE_URL}/users/current/location`;
  let token;
  it(`returns ${CONSTS.ERROR_MESSAGES.AUTH}`, () => {
    return axios.post(URL).catch(({response}) => {
      expect(response.data).toBe(CONSTS.ERROR_MESSAGES.AUTH);
    })
  });

  it(`returns ${CONSTS.ERROR_MESSAGES.LAT_LONG}`, () => {
    return cache.getAsync('auth_token').then(_token => {
      token = _token;
      return axios.post(URL, {latitude: 40.7271}, {
        headers: {
          'Authorization': token
        }
      }).catch(({response}) => {
        expect(response.data).toBe(CONSTS.ERROR_MESSAGES.LAT_LONG);
      })
    })
  })

  it(`returns ${CONSTS.STATUS_MESSAGES.OK}`, () => {
    return axios.post(URL, {
      "latitude": 40.7271,
      "longitude": -74.0054
    }, {
      headers: {
        'Authorization': token
      }
    }).catch(({response}) => {
      expect(response.data).toBe(CONSTS.ERROR_MESSAGES.LAT_LONG);
    })

  })
});


describe(line + 'Cabs after current location' + line, () => {
  let URL = `${BASE_URL}/cabs/near-by`;
  let token;

  it(`returns Near by cabs`, () => {
    return cache.getAsync('auth_token').then(_token => {
      token = _token;
      return axios.get(URL, {
        headers: {
          "Authorization": token
        }
      }).then(({data}) => {
        expect(data.length).toBeTruthy()
      })
    });
  });

  it(`returns Near by available cabs`, () => {
    return axios.get(URL, {
      headers: {
        "Authorization": token
      },
      params: {
        ignore_booked: true
      }
    }).then(({data}) => {
      expect(data.every(({cab}) => cab.status === CONSTS.CAB_STATUS.AVAILABLE)).toBe(true)
    })
  });
});

describe(line + 'Bookings before creating one' + line, () => {
  it(`returns Empty array`, () => {
    return cache.getAsync('auth_token').then(token => {
      return axios.get(`${BASE_URL}/users/current/bookings`, {
        headers: {
          "Authorization": token
        }
      }).then(({data}) => {
        expect(data.length).toBe(0)
      })
    });
  });
});

describe(line + 'Creating Booking' + line, () => {
  let token;
  let URL = `${BASE_URL}/cabs/book`;
  let bookingData;

  it(`returns ${CONSTS.ERROR_MESSAGES.CABS.NO_CABS}`, () => {
    return cache.getAsync('auth_token').then(_token => {
      token = _token;
      return axios.get(`${BASE_URL}/cabs/near-by`, {
        headers: {
          "Authorization": token
        },
        params: {
          ignore_booked: true
        }
      }).then(({data}) => {
        let cab = data[0].cab;
        let numberOfPassengers = cab['number_of_seats'] + 1;
        bookingData = {
          "cabID": cab.id,
          "pickupLocation": {
            "latitude": 40.7271,
            "longitude": -74.0054
          },
          "destination": {
            "latitude": 40.7271,
            "longitude": -72.0054
          },
          "numberOfPassengers": numberOfPassengers
        }

        return axios.post(URL, bookingData, {
          headers: {
            Authorization: token
          }
        }).catch(({response}) => {
          expect(response.data).toBe(CONSTS.ERROR_MESSAGES.CABS.NO_CABS)
        })
      })
    });
  });
  it(`returns ${CONSTS.SUCCESS_MESSAGES.BOOKING.CONFIRMED}`, () => {
    bookingData.numberOfPassengers--;
    return axios.post(URL, bookingData, {
      headers: {
        Authorization: token
      }
    }).then(({data}) => {
      expect(data.message).toBe(CONSTS.SUCCESS_MESSAGES.BOOKING.CONFIRMED)
    })
  })

})

describe(line + 'Bookings before after one' + line, () => {
  it(`returns Single booking`, () => {
    return cache.getAsync('auth_token').then(token => {
      return axios.get(`${BASE_URL}/users/current/bookings`, {
        headers: {
          "Authorization": token
        }
      }).then(({data}) => {
        expect(data.length).toBe(1)
      })
    });
  });
});


afterAll((done) => {
  cache.keysAsync(`${cache.prefix}*`).then(keys => {
    if (keys.length) {
      let unprefixedKeys = keys.map(key => key.replace(new RegExp(`^${cache.prefix}`),''))
      return cache.delAsync(unprefixedKeys);
    }
  }).then((res) => {
    server.close(dbConnection.end(cache.quit(done)));
  })
});
