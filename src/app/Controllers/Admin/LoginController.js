const { response, catchFailure } = require('../../Helpers/basics');
const errorMessages = require('../../Helpers/adminErrorMessages');
const JWT = require('../../Helpers/jwt');
const bcrypt = require('bcrypt');

const User = require('../../Models/User');

exports.signinRequest = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        let chkEmail = email.toLowerCase();
        const user = await User.query()
            .where({ email: chkEmail })
            .where('is_deleted', false)
            .where('is_superadmin', true)
            .first();
        if (!user) throw new Error(errorMessages.userDoNotExist);

        const validatePassword = await bcrypt.compare(password, user.password);
        if (!validatePassword) throw new Error(errorMessages.invalidPassword);

        const token = await JWT.sign({
            id: user.id,
            name: user.name,
            email: user.email,
        });

        return response(200, res, { message: "success", data: token });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.signOutRequest = async (req, res, next) => {
    try {
        return response(200, res, { message: "success", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}
