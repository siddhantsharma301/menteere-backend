const DB = require('../../database/db');
const { Model } = require('objection');
const tableNames = require('../../database/tableNames');
const jwt_decode = require('jwt-decode');

class UserVerification extends Model {
    static get tableName() {
      return tableNames.user_verification_meta;
    }
}

module.exports = UserVerification;