const { response } = require('../Helpers/basics');
const Joi = require("joi");

module.exports.Validators = (method) => {
    var obj = {};
    switch (method) {
        case 'signinRequest':
            obj = {
                email: Joi.string().required(),
                password: Joi.string().required(),
            };
            break;
        case 'storeUser':
            obj = {
                name: Joi.string().required(),
                email: Joi.string().email().required(),
                password: Joi.string(),
                fee_per_hour: Joi.number().allow(null).allow(''),
                is_mentor: Joi.boolean().required(),
                verification_status: Joi.number().required(),
                rejection_reason: Joi.string().allow(null)
            };
            break;
        case 'updateUser':
            obj = {
                name: Joi.string().required(),
                email: Joi.string().email().required(),
                password: Joi.string().allow(null).allow(''),
                verification_status: Joi.number().required(),
                rejection_reason: Joi.string().allow(null),
                fee_per_hour: Joi.number().allow(null).allow(''),
                is_mentor: Joi.boolean().required(),
            };
            break;

        case 'storeNote':
            obj = {
                title: Joi.string().required(),
                desc: Joi.string().required(),
                status: Joi.number().required(),
                theme_id: Joi.number().required(),
                topic_id: Joi.number().required(),
                subject_id: Joi.number().required(),
                curriculum_id: Joi.string().required(),
                user_id: Joi.string().required()
            };
            break;

        case 'storeMetaInfo':
            obj = {
                title: Joi.string().required(),
                type: Joi.string().required(),
                is_active: Joi.boolean().required(),
                imageFile: Joi.string().allow(null).allow(''),
                filename: Joi.string().allow(null).allow(''),
                level: Joi.number().allow(null)
            };
            break;
        case 'storeSubject':
            obj = {
                title: Joi.string().required(),
                curriculum_id: Joi.number().required(),
            };
            break;
        case 'storeTheme':
            obj = {
                title: Joi.string().required(),
                subject_id: Joi.string().required()
            };
            break;
        case 'storeTopic':
            obj = {
                title: Joi.string().required(),
                theme_id: Joi.string().required()
            };
            break;
        case 'storeSubscription':
            obj = {
                plan_id: Joi.number().required(),
                user_id: Joi.number().required(),
            };
            break;
        case 'getNotesStats':
            obj = {
                from: Joi.string().required(),
                upto: Joi.string().required(),
            };
            break;
        case 'storeUserTransaction':
            obj = {
                user_id: Joi.number().required(),
                amount_paid: Joi.number().required(),
                transaction_id: Joi.string().allow('').allow(null),
                mode_of_payment: Joi.string().required(),
                description: Joi.string().allow('').allow(null),
                pay_status: Joi.number().required(),
            };
            break;
        case 'getMentorshipStats':
            obj = {
                user_id: Joi.number().required(),
            }
            break;
        case 'getEarningBreakup':
            obj = {
                startDate: Joi.string().required(),
                endDate: Joi.string().required(),
                user_id: Joi.number().required()
            }
            break;
        case 'storeCurriculum':
            obj = {
                title: Joi.string().required(),
                is_active: Joi.boolean().required(),
            };
            break;
        case 'storeUniversity':
            obj = {
                title: Joi.string().required(),
                level: Joi.number().allow(null).allow(''),
                is_active: Joi.boolean().required(),
                imageFile: Joi.string().allow('').allow(null),
                filename: Joi.string().allow('').allow(null),
            };
            break;
        case 'updateQuickBloxID':
            obj = {
                currentUserId: Joi.number().required(),
                quickbloxId: Joi.number().required(),
            };
            break;
    }
    return Joi.object(obj);
}