const DB = require('../../database/db');
const { Model } = require('objection');
const tableNames = require('../../database/tableNames');
const User = require('./User');

class LastReadNotes extends Model {
    static get tableName() {
      return tableNames.lastReadNotes;
    }
}

module.exports = LastReadNotes;