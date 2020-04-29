/**
 * Model Definition File
 */

/**
 * System and 3rd Party libs
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schema Definition
 */

const locationSchema = new Schema({
    latitude: Schema.Types.Number,
    longitude: Schema.Types.Number
},{timestamps: true});

/**
 * Static Methods
 */

locationSchema.options.toJSON = {
    transform: function (doc, ret) {
        delete ret._id;
    },
    versionKey: false
};

/**
 * Instance Methods
 */
locationSchema.methods.isValid = function() {
    let location = this;
    return !(isNaN(location.latitude) || isNaN(location.latitude));

}
/**
 * Export Schema
 */
module.exports = mongoose.model('location', locationSchema);