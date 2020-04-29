let mongoose = require('mongoose');
let Cab = mongoose.model('cab');
let cabs = require('./cab.seed');

Cab.countDocuments({}).then(count => {
    if(count === 0){
        Cab.insertMany(cabs).then(() => {
            console.log('CABS SEEDED');
        }).catch(err => {
            console.log(err);
        })
    }
}).catch(err => {
    console.error(err.message)
});