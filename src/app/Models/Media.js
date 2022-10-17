const DB = require('../../database/db');
const { Model } = require('objection');
const tableNames = require('../../database/tableNames');

class Media extends Model {
    static get tableName() {
      return tableNames.media;
    }
}

module.exports = Media;