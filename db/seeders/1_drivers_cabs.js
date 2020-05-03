let driverSeeds = require('./drivers.seed');

module.exports = (conn) => {
  let Drivers = require('../models/1_drivers')(conn);
  let saveRecordPromises = [];
  let getCountPromise = Drivers.getCount().then(count => {
    if (count === 0) {
      console.log("Drivers Seeding")
      driverSeeds.forEach(driverSeed => {
        let driver;
        try {
          driver = new Drivers(driverSeed.name, driverSeed.phone);
          saveRecordPromises.push(driver.save());
        } catch (e) {
          console.log(e.message, driver);
        }
        ;
      })
    }
  });
  getCountPromise.then(() => {
    Promise.all(saveRecordPromises).then(() => {
      if (saveRecordPromises.length) console.log("Drivers Seeded");

      let cabSeeds = require('./cabs.seed');

      let Cabs = require('../models/2_cabs')(conn);
      let saveRecordPromisesCabs = []
      let getCountPromise = Cabs.getCount().then(count => {
        if (count === 0) {
          console.log("Cabs Seeding")
          cabSeeds.forEach(cabSeed => {
            let cab;
            try {
              cab = new Cabs(cabSeed.status, cabSeed.driver_id, cabSeed.number_of_seats, cabSeed.number_plate,
                cabSeed.longitude, cabSeed.latitude);
              saveRecordPromisesCabs.push(cab.saveNew())
            } catch (e) {
              console.log(e.message, cab);
            };
          })
        }
      });

      getCountPromise.then(() => {
        Promise.all(saveRecordPromisesCabs).then(() => {
          if (saveRecordPromisesCabs.length) console.log("Cabs Seeded")
        })
      })


    })
  })

};
