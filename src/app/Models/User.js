const DB = require('../../database/db');
const { Model } = require('objection');
const tableNames = require('../../database/tableNames');
const jwt_decode = require('jwt-decode');

class User extends Model {
    static get tableName() {
      return tableNames.user;
    }

    static getUserByToken(token) {
      return jwt_decode(token);
    }
}

module.exports = User;