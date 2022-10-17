const DB = require('../../database/db');
const { Model } = require('objection');
const tableNames = require('../../database/tableNames');
const User = require('./User');

class Booking extends Model {
    static get tableName() {
      return tableNames.bookings;
    }
}

module.exports = Booking;