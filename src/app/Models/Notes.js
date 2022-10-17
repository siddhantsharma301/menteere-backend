const DB = require('../../database/db');
const { Model } = require('objection');
const tableNames = require('../../database/tableNames');
const User = require('./User');

class Notes extends Model {
    static get tableName() {
      return tableNames.notes;
    }
}

module.exports = Notes;