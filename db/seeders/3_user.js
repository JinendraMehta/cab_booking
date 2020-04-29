let mongoose = require('mongoose');
let User = mongoose.model('user');
let users = require('./user.seed');

User.countDocuments({}).then(count => {
    if(count === 0){
        User.insertMany(users).then(() => {
            console.log('USERS SEEDED');
        }).catch(err => {
            console.log(err);
        })
    }
}).catch(err => {
    console.error(err.message)
});