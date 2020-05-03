let userSeeds = require('./users.seed');

module.exports = (conn) => {
  let Users = require('../models/3_users')(conn);
  let saveRecordPromises = [];

  let getCountPromise = Users.getCount().then(count => {
    if (count === 0) {
      console.log("Users Seeding");
      userSeeds.forEach(userSeed => {
        let user
        try {
          user = new Users(userSeed.email, userSeed.password, userSeed.name, userSeed.phone);
          saveRecordPromises.push(user.saveNew());
        } catch (e) {
          console.log(e.message, user);
        };
      })
    }
  })


  getCountPromise.then(() => {
    Promise.all(saveRecordPromises).then(() => {
      if(saveRecordPromises.length) console.log("Users Seeded")
    })
  }).catch(e => {
    console.log(e)
  })
};
