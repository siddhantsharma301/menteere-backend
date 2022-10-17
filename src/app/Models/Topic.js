const DB = require('../../database/db');
const { Model } = require('objection');
const tableNames = require('../../database/tableNames');

class Topic extends Model {
    static get tableName() {
      return tableNames.topic;
    }
}

module.exports = Topic;