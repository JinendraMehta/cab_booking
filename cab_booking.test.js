/**
 * Integration Test Suite
 */

const axios = require('axios/index');
const CONSTS = require('./utils/consts');
const {ONE_USER_DATA} = require('./utils/testUtils/data');
const {pick} = require('lodash');
const {server, dbConnection} = require('./bin/www');
const cache = require('./utils/cache');
const line = '\n' + '-'.repeat(40) + '\n';
const URL = require('url-parse');

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
  let url = `${BASE_URL}/cabs/near-by`;
  it(`returns ${CONSTS.ERROR_MESSAGES.AUTH}`, () => {
    return axios.get(url).catch(({response}) => {
      expect(response.data).toBe(CONSTS.ERROR_MESSAGES.AUTH);
    })
  });

  it(`returns ${CONSTS.ERROR_MESSAGES.CABS.NEARBY.NO_REFERENCE}`, (done) => {
    cache.getAsync('auth_token').then(token => {
      axios.get(url, {
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
  let url = `${BASE_URL}/users/current/location`;
  let token;
  it(`returns ${CONSTS.ERROR_MESSAGES.AUTH}`, () => {
    return axios.post(url).catch(({response}) => {
      expect(response.data).toBe(CONSTS.ERROR_MESSAGES.AUTH);
    })
  });

  it(`returns ${CONSTS.ERROR_MESSAGES.LAT_LONG}`, () => {
    return cache.getAsync('auth_token').then(_token => {
      token = _token;
      return axios.post(url, {latitude: 40.7271}, {
        headers: {
          'Authorization': token
        }
      }).catch(({response}) => {
        expect(response.data).toBe(CONSTS.ERROR_MESSAGES.LAT_LONG);
      })
    })
  })

  it(`returns ${CONSTS.STATUS_MESSAGES.OK}`, () => {
    return axios.post(url, {
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


describe(line + 'Nearby cabs after current location' + line, () => {
  let url = `${BASE_URL}/cabs/near-by`;
  let token;
  let lastPage;
  let totalResults;

  it(`returns first page`, () => {
    return cache.getAsync('auth_token').then(_token => {
      token = _token;
      return axios.get(url, {
        headers: {
          "Authorization": token
        }
      }).then(({data}) => {
        expect(data.data.length).toBeTruthy();
        expect(data.pagination).toBeDefined();
        expect(data.pagination.current).toBeDefined();
        expect(data.pagination.last).toBeDefined();
        expect(data.pagination.previous).toBeUndefined();
        expect(data.pagination.totalResults).toBeDefined();
        totalResults = data.pagination.totalResults;

        let pageNumber = parseInt(new URL(data.pagination.current, true).query['page']);
        expect(pageNumber).toBe(1);
        lastPage = data.pagination.last;
      })
    });
  });

  it('returns Bad Request',() => {
    return axios.get(url, {
      headers: {
        "Authorization": token
      },
      params: {
        page: 'random'
      }
    }).catch(({response}) => {
      expect(response.data).toBe(CONSTS.STATUS_MESSAGES.BAD_REQUEST);
    })
  })

  it(`returns last page`, () => {
    return axios.get(lastPage, {
      headers: {
        "Authorization": token
      }
    }).then(({data}) => {
      let expectedCount = totalResults % 10 || 10;
      expect(data.data.length).toBe(expectedCount);
      expect(data.pagination.next).toBeUndefined();
      expect(data.pagination.current).toBe(lastPage);
    })
  });

  it(`returns Available cabs`, () => {
    return axios.get(url, {
      headers: {
        "Authorization": token
      },
      params: {
        ignore_booked: true
      }
    }).then(({data: {data}}) => {
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
        expect(data.pagination).toBeDefined();
        expect(data.data.length).toBe(0)
      })
    });
  });
});

describe(line + 'Creating Booking' + line, () => {
  let token;
  let url = `${BASE_URL}/cabs/book`;
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
      }).then(({data: {data}}) => {
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

        return axios.post(url, bookingData, {
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
    return axios.post(url, bookingData, {
      headers: {
        Authorization: token
      }
    }).then(({data}) => {
      expect(data.message).toBe(CONSTS.SUCCESS_MESSAGES.BOOKING.CONFIRMED)
    })
  })

})

describe(line + 'Bookings after creating one' + line, () => {
  it(`returns Single booking`, () => {
    return cache.getAsync('auth_token').then(token => {
      return axios.get(`${BASE_URL}/users/current/bookings`, {
        headers: {
          "Authorization": token
        }
      }).then(({data: {data}}) => {
        expect(data.length).toBe(1)
      })
    });
  });
});


afterAll((done) => {
  cache.keysAsync(`${cache.prefix}*`).then(keys => {
    if (keys.length) {
      let unprefixedKeys = keys.map(key => key.replace(new RegExp(`^${cache.prefix}`), ''))
      return cache.delAsync(unprefixedKeys);
    }
  }).then((res) => {
    server.close(dbConnection.end(cache.quit(done)));
  })
});
