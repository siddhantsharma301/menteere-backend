const DB = require('../../database/db');
const { Model } = require('objection');
const tableNames = require('../../database/tableNames');

class Playlist extends Model {
    static get tableName() {
      return tableNames.playlist;
    }
}

module.exports = Playlist;