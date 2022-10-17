const { response, catchFailure } = require('../Helpers/basics');
const errorMessages = require('../Helpers/errorMessages');

const User = require('../Models/User');
const Notification = require('../Models/Notification');
const tableNames = require('../../database/tableNames');

exports.getMyNotifications = async (req, res, next) => {
    try {
        const auth = await User.getUserByToken(req.headers.authorization);

        const data = await Notification.query().where(
            `${tableNames.Notifications}.user_ids`, 'LIKE', `::${auth.id}::`
        );

        return response(200, res, { message: "success", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}
