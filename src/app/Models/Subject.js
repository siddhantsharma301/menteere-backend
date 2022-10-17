const DB = require('../../database/db');
const { Model } = require('objection');
const tableNames = require('../../database/tableNames');

class Subject extends Model {
    static get tableName() {
      return tableNames.subject;
    }
}

module.exports = Subject;