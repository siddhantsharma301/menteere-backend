const DB = require('../../database/db');
const { Model } = require('objection');
const tableNames = require('../../database/tableNames');
const User = require('./User');

class BookingSlots extends Model {
    static get tableName() {
      return tableNames.bookingSlots;
    }
}

module.exports = BookingSlots;