const moment = require('moment');
var cron = require("node-cron");
const { response, catchFailure } = require('../Helpers/basics');
const errorMessages = require('../Helpers/errorMessages');
const JWT = require('../Helpers/jwt');
const bcrypt = require('bcrypt');
const User = require('../Models/User');
const UserVerification = require('../Models/UserVerification');
const Media = require('../Models/Media');

exports.signupRequest = async (req, res, next) => {
    try {
        const { name, email, password, is_mentor } = req.body;
        let chkEmail = email.toLowerCase();

        const existingUser = await User.query().whereRaw("LOWER(email) = ?", chkEmail).first();
        if (existingUser) throw new Error(errorMessages.emailInUse);

        const hashedPassword = await bcrypt.hash(password, 12);
        const newuser = await User.query().insert({ name, email: chkEmail, password: hashedPassword, is_mentor, fee_per_hour: '19' });
        newuser.password = '';

        const token = await JWT.sign({
            id: newuser.id,
            name: newuser.name,
            email: newuser.email,
        });

        newuser.pro_pic = null;
        if (newuser.pro_pic_id != null) {
            let media = await Media.query().where({ id: newuser.pro_pic_id }).first();
            if (media != '') {
                newuser.pro_pic = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + media.path);
            }
        }

        const AWS = require("aws-sdk");

        AWS.config.update({
            accessKeyId: process.env.AWS_SES_KEY,
            secretAccessKey: process.env.AWS_SES_SECRET_KEY,
            region: process.env.AWS_SES_REIGON
        });

        const ses = new AWS.SES();

        const params = {
            "Source": process.env.AWS_SES_EMAIL,
            "Template": "RegistrationSuccessfullTemplate",
            "Destination": {
                "ToAddresses": [newuser.email]
            },
            "TemplateData": "{ \"name\":\"" + name + "\", \"email\": \"" + newuser.email + "\" }"
        }

        ses.sendTemplatedEmail(params, (err, data) => {
            if (err) {
                console.log(err, err.stack);
            } else {
                console.log(data);
            }
        });

        return response(200, res, {
            message: "success", data: {
                id: newuser.id,
                token: token,
                name: newuser.name,
                email: newuser.email,
                pro_pic_url: newuser.pro_pic,
                is_mentor: newuser.is_mentor,
            }
        });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.signinRequest = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        let chkEmail = email.toLowerCase();
        const user = await User.query().whereRaw("LOWER(email) = ?", chkEmail).first();
        if (!user) throw new Error(errorMessages.userDoNotExist);

        const validatePassword = await bcrypt.compare(password, user.password);
        if (!validatePassword) throw new Error(errorMessages.invalidPassword);

        const token = await JWT.sign({
            id: user.id,
            name: user.name,
            email: user.email,
        });

        let vinfo = await UserVerification.query().where({ user_id: user.id }).first();
        if (!vinfo) {
            await UserVerification.query().insert({ user_id: user.id })
        }

        user.pro_pic = null;
        if (user.pro_pic_id != null) {
            let media = await Media.query().where({ id: user.pro_pic_id }).first();
            if (media != '') {
                user.pro_pic = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + media.path);
            }
        }
        return response(200, res, {
            message: "success", data: {
                quickbloxId: user.quickblox_id,
                id: user.id,
                token: token,
                name: user.name,
                email: user.email,
                pro_pic_url: user.pro_pic,
                is_mentor: user.is_mentor,
            }
        });
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


exports.forgotPasswordRequest = async (req, res, next) => {
    try {
        const { email } = req.body;
        let chkEmail = email.toLowerCase();

        const existingUser = await User.query().whereRaw("LOWER(email) = ?", chkEmail).first();
        if (!existingUser) throw new Error(errorMessages.userDoNotExist);

        const otp = Math.floor(Math.random() * Math.floor(9999));
        await User.query().where({ id: existingUser.id }).update({
            forgot_pass_otp: otp
        });

        const AWS = require("aws-sdk");

        AWS.config.update({
            accessKeyId: process.env.AWS_SES_KEY,
            secretAccessKey: process.env.AWS_SES_SECRET_KEY,
            region: process.env.AWS_SES_REIGON
        });

        const ses = new AWS.SES();

        const params = {
            "Source": process.env.AWS_SES_EMAIL,
            "Template": "ForgotPasswordTemplate",
            "Destination": {
                "ToAddresses": [existingUser.email]
            },
            "TemplateData": "{ \"name\":\"" + existingUser.name + "\", \"otp\": \"" + otp + "\" }"
        }

        ses.sendTemplatedEmail(params, (err, data) => {
            if (err) {
                console.log(err, err.stack);
            } else {
                console.log(data);
            }
        });

        return response(200, res, { message: "success", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.updatePasswordRequest = async (req, res, next) => {
    try {
        const { email, password, confirmPassword, otp } = req.body;
        let chkEmail = email.toLowerCase();
        const existingUser = await User.query().where({ email: chkEmail }).first();
        if (!existingUser) throw new Error(errorMessages.userDoNotExist);

        if (existingUser.forgot_pass_otp != otp) throw new Error(errorMessages.invalidOTP);
        if (password != confirmPassword) throw new Error(errorMessages.passwordNotMatched);

        const hashedPassword = await bcrypt.hash(password, 12);
        await User.query().where({ id: existingUser.id }).update({ password: hashedPassword });

        return response(200, res, { message: "success", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}


cron.schedule("0 6 * * *", async () => {
    this.verifyEmailRequestReminder();
});


exports.verifyEmailRequestReminder = async (req, res, next) => {
    try {
        console.log("Verify Email Remider cron running")
        let emails = await User.query().where({ email_verified: false });

        let dest = [];
        for (let i = 0; i < emails.length; i++) {

            let createdOn = emails[i].created_at
            var endDate = new Date(); // Now        

            let diffTime = Math.abs(endDate - createdOn);
            let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays % 2 == 0) {
                console.log(emails[i].name + " " + emails[i].email)

                dest.push({
                    "Destination": {
                        "ToAddresses": [emails[i].email]
                    },
                    "ReplacementTemplateData": "{ \"name\": \"" + emails[i].name + "\" }"
                })
            }

        }

        if (dest.length > 0) {
            const AWS = require("aws-sdk");
            AWS.config.update({
                accessKeyId: process.env.AWS_SES_KEY,
                secretAccessKey: process.env.AWS_SES_SECRET_KEY,
                region: process.env.AWS_SES_REIGON
            });

            const ses = new AWS.SES();
            console.log("dest" + JSON.stringify(dest))
            const params = {
                "Source": process.env.AWS_SES_EMAIL,
                "Template": "VerifyEmailReminderTemplate",
                "Destinations": dest,
                "DefaultTemplateData": "{ \"name\":\"Menteere\" }"
            }
            console.log("params" + JSON.stringify(params))
            ses.sendBulkTemplatedEmail(params, (err, data) => {
                if (err) {
                    console.log(err, err.stack);
                } else {
                    console.log(data);
                }
            });

        }
    } catch (error) {
        console.log(error);
    }
}


exports.verifyemailrequest = async (req, res, next) => {
    try {
        const auth = await User.getUserByToken(req.headers.authorization);
        const otp = Math.floor(Math.random() * Math.floor(9999));
        await User.query().where({ id: auth.id }).update({
            verify_email_otp: otp
        });

        const UserDetail = await User.query().where({ id: auth.id }).first();

        const AWS = require("aws-sdk");

        AWS.config.update({
            accessKeyId: process.env.AWS_SES_KEY,
            secretAccessKey: process.env.AWS_SES_SECRET_KEY,
            region: process.env.AWS_SES_REIGON
        });

        const ses = new AWS.SES();

        const params = {
            "Source": process.env.AWS_SES_EMAIL,
            "Template": "VerifyEmailTemplate",
            "Destination": {
                "ToAddresses": [auth.email]
            },
            "TemplateData": "{ \"name\":\"" + UserDetail.name + "\",\"otp\": \"" + otp + "\" }"
        }

        ses.sendTemplatedEmail(params, (err, data) => {
            if (err) {
                console.log(err, err.stack);
            } else {
                console.log(data);
            }
        });


        return response(200, res, { message: "success", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.verifyemail = async (req, res, next) => {
    try {
        const { otp } = req.body;
        const auth = await User.getUserByToken(req.headers.authorization);
        const existingUser = await User.query().where({ id: auth.id }).first();
        if (!existingUser) throw new Error(errorMessages.userDoNotExist);

        if (existingUser.verify_email_otp != otp) throw new Error(errorMessages.invalidOTP);

        await User.query().where({ id: existingUser.id }).update({ email_verified: true });

        return response(200, res, { message: "success", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.changePassword = async (req, res, next) => {
    try {
        const { oldPassword, newPassword, confirmPassword } = req.body;
        const auth = await User.getUserByToken(req.headers.authorization);
        const currentUser = await User.query().where({ id: auth.id }).first();

        const validatePassword = await bcrypt.compare(oldPassword, currentUser.password);
        if (!validatePassword) throw new Error(errorMessages.invalidPassword);

        if (newPassword != confirmPassword) throw new Error(errorMessages.passwordNotMatched);

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await User.query().where({ id: auth.id }).update({ password: hashedPassword });

        return response(200, res, { message: "success", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.updateQuickBloxID = async (req, res, next) => {
    try {
        const { currentUserId, quickbloxId } = req.body;
        await User.query().where({ id: currentUserId }).update({
            quickblox_id: quickbloxId
        });
        return response(200, res, { message: "", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}