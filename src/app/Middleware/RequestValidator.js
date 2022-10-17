const { response } = require('../Helpers/basics');
const Joi = require("joi");

module.exports.Validators = (method) => {
    var obj = {};
    switch (method) {
        case 'signupRequest':
            obj = {
                name: Joi.string().required(),
                email: Joi.string().email().required(),
                password: Joi.string().required(),
                is_mentor: Joi.boolean().required()
            };
            break;
        case 'forgotPasswordRequest':
            obj = {
                email: Joi.string().email().required(),
            };
            break;
        case 'updatePasswordRequest':
            obj = {
                email: Joi.string().email().required(),
                password: Joi.string().required(),
                confirmPassword: Joi.string().required(),
                otp: Joi.string().required(),
            };
            break;
        case 'signinRequest':
            obj = {
                email: Joi.string().email().required(),
                password: Joi.string().required(),
            };
            break;
        case 'changePassword':
            obj = {
                oldPassword: Joi.string().required(),
                newPassword: Joi.string().required(),
                confirmPassword: Joi.string().required(),
            };
            break;
        case 'storeMyNotes':
            obj = {
                title: Joi.string().required(),
                desc: Joi.string().required(),
                curriculum_id: Joi.number().required(),
                subject_id: Joi.number().allow(null),
                theme: Joi.string().allow(''),
                topic: Joi.string().allow(''),
                note_type: Joi.number().required(),
            };
            break;
        case 'updateMyNotes':
            obj = {
                title: Joi.string().required(),
                desc: Joi.string().required(),
                curriculum_id: Joi.number().required(),
                subject_id: Joi.number().required(),
                theme_id: Joi.string().allow(null).allow(''),
                topic_id: Joi.string().allow(null).allow(''),
            };
            break;
        case 'VerifyUserStep1':
            obj = {
                personal_doc_type: Joi.string().required(),
                personal_doc_ids: Joi.string(),
                linkedin_url: Joi.string().required(),
            };
            break;
        case 'uploadVerificationDocs':
            obj = {
                field: Joi.string().required(),
            };
            break;
        case 'uploadVerificationJSONDocs':
            obj = {
                field: Joi.string().required(),
                index: Joi.string().required(),
            };
            break;
        case 'removeVerificationDocs':
            obj = {
                field: Joi.string().required(),
                doc_id: Joi.number().required(),
            };
            break;
        case 'BookNewSlot':
            obj = {
                from_time: Joi.string().required(),
                to_time: Joi.string().required(),
                from_date: Joi.string().required(),
                to_date: Joi.string().required(),
                repeat: Joi.boolean().required(),
                selectedDays: Joi.array(),
            };
            break;
        case 'getSlots':
            obj = {
                date: Joi.string().required()
            };
            break;
        case 'getSlotsDate':
            obj = {
                date: Joi.string().required()
            };
            break;
        case 'addNoteToPlaylist':
            obj = {
                note_id: Joi.number().required(),
                title: Joi.string().allow(''),
                playlist_id: Joi.number().allow(null),
            };
            break;
        case 'addVideoToPlaylist':
            obj = {
                video_id: Joi.array().required(),
                title: Joi.string().allow(''),
                playlist_id: Joi.number().allow(null),
            };
            break;
        case 'recordLastReadNote':
            obj = {
                id: Joi.number().required(),

            };
            break;
        case 'submitBookingRequest':
            obj = {
                description: Joi.string().required(),
                selected_curriculum: Joi.string().required(),
                selected_subject: Joi.string().required(),
                selectedSlotIDs: Joi.string().required(),
            };
            break;
        case 'completeBookingPayment':
            obj = {
                amount: Joi.number().required(),
                txn_id: Joi.string().required(),
                gateway_response: Joi.string().required(),
                is_paid: Joi.boolean().required(),
            };
            break;
        case 'verifyemail':
            obj = {
                otp: Joi.string().required(),
            };
            break;
        case 'updateQuickBloxID':
            obj = {
                currentUserId: Joi.number().required(),
                quickbloxId: Joi.number().required(),
            };
            break;
        case 'updateClickCount':
            obj = {
                noteId: Joi.number().required(),
            }
            break;
        case 'getMyEarnings':
            obj = {
                from: Joi.string().required(),
                upto: Joi.string().required(),
            }
            break;
        case 'getMyMentorshipEarnings':
            obj = {
                from: Joi.string().required(),
                upto: Joi.string().required(),
            }
            break;
        case 'getMentorshipStats':
            obj = {
                from: Joi.string().required(),
                upto: Joi.string().required(),
            }
            break;
        case 'getEarningBreakup':
            obj = {
                startDate: Joi.string().required(),
                endDate: Joi.string().required(),
            }
            break;

    }
    return Joi.object(obj);
}