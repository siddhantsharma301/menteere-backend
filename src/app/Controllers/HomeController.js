const moment = require('moment');
const CC = require('currency-converter-lt')
var sha512 = require('js-sha512');
const { response, catchFailure, CONSTANTS } = require('../Helpers/basics');
const errorMessages = require('../Helpers/errorMessages');

const User = require('../Models/User');
const Notes = require('../Models/Notes');
const Slots = require('../Models/Slots');
const UserVerification = require('../Models/UserVerification');

const Curriculums = require('../Models/Curriculums')
const Universitites = require('../Models/Universities')
const MetaInfo = require('../Models/MetaInfo');
const Subject = require('../Models/Subject');
const Theme = require('../Models/Theme');
const Topic = require('../Models/Topic');
const Media = require('../Models/Media');
const Subscriptions = require('../Models/Subscriptions');
const SubscriptionPlans = require('../Models/SubscriptionPlans');
const Transaction = require('../Models/Transaction');
const Universities = require('../Models/Universities')
const tableNames = require('../../database/tableNames');
const Booking = require('../Models/Booking');
const LastReadNotes = require('../Models/LastReadNotes');
const NumberOfClicks = require('../Models/NumberOfClicks')
const FreeSubscribedUser = require('../Models/FreeSubscribedUser')


exports.BookNewSlot = async (req, res, next) => {
    try {
        const { from_date, to_date, from_time, to_time, from_time_full, to_time_full, repeat, selectedDays } = req.body;

        const auth = await User.getUserByToken(req.headers.authorization);
        if (repeat == true) {
            if (Date.parse(from_time_full) > Date.parse(to_time_full)) {
                throw new Error(errorMessages.biggerDate);
            }
            if (from_time_full == to_time_full) {
                throw new Error(errorMessages.equalTime);
            }
            let fcheck = from_time.split(':');
            let tcheck = to_time.split(':');
            if (fcheck[0] > tcheck[0]) {
                throw new Error(errorMessages.biggerTime);
            }

            var daysCount = 0;
            for (var d = new Date(from_date); d <= new Date(to_date); d.setDate(d.getDate() + 1)) {
                daysCount = daysCount + 1;
            }

            for (var i = 0; i < daysCount; i++) {
                let fromTimeFull = new Date(from_time_full);
                let toTimeFull = new Date(to_time_full);

                if (i > 0) {
                    fromTimeFull.setDate(fromTimeFull.getDate() + i);
                    toTimeFull.setDate(toTimeFull.getDate() + i);
                }

                let date = new Date(fromTimeFull);
                let day = date.getDay();
                if (selectedDays.includes(day)) {
                    await Slots.query().insert({
                        slot_date: fromTimeFull,
                        start_time: fromTimeFull,
                        end_time: toTimeFull,
                        user_id: auth.id
                    });
                }
            }
        } else {
            let check = await Slots.query().select(
                `${tableNames.slots}.slot_date`,
                `${tableNames.slots}.start_time`,
                `${tableNames.slots}.end_time`,
            )
                .where(`${tableNames.slots}.user_id`, '=', auth.id)
                .where(`${tableNames.slots}.start_time`, '<=', from_time_full)
                .where(`${tableNames.slots}.end_time`, '>=', to_time_full)
                .first();

            let check1 = await Slots.query().select(
                `${tableNames.slots}.slot_date`,
                `${tableNames.slots}.start_time`,
                `${tableNames.slots}.end_time`,
            )
                .where(`${tableNames.slots}.user_id`, '=', auth.id)
                .where(`${tableNames.slots}.start_time`, '=', from_time_full)
                .first();

            let check2 = await Slots.query().select(
                `${tableNames.slots}.slot_date`,
                `${tableNames.slots}.start_time`,
                `${tableNames.slots}.end_time`,
            )
                .where(`${tableNames.slots}.user_id`, '=', auth.id)
                .where(`${tableNames.slots}.end_time`, '=', to_time_full)
                .first();

            let today = new Date().getTime();
            var fromTime = new Date(from_time_full).getTime();

            if (!check && !check1 && !check2 && fromTime > today) {
                await Slots.query().insert({
                    slot_date: from_time_full,
                    start_time: from_time_full,
                    end_time: to_time_full,
                    user_id: auth.id
                });
            } else if (!check && fromTime < today) {
                return response(200, res, { message: "Slected time is over", data: 'Slot already booked' });
            } else {
                return response(200, res, { message: "Slot Booked already", data: 'Slot already booked' });
            }
        }
        return response(200, res, { message: "You are on slot page", data: 'success' });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.getSlots = async (req, res, next) => {
    try {
        const { date } = req.body;
        const auth = await User.getUserByToken(req.headers.authorization);
        var startdateTime = new Date(date);
        var enddateTime = new Date(date);
        enddateTime.setHours(enddateTime.getHours() + 24);

        const data = await Slots.query()
            .where('start_time', '>=', startdateTime)
            .where('start_time', '<=', enddateTime)
            .where('user_id', '=', auth.id);

        for (var i in data) {
            if (data[i].is_booked) {
                data[i].bookingInfo = await Booking.query()
                    .select(
                        `${tableNames.bookings}.description as ShortDescription`,
                        `${tableNames.bookings}.selected_curriculum as Curriculum`,
                        `${tableNames.bookings}.selected_subject as Subject`,
                        `${tableNames.user}.name as UserName`,
                    )
                    .leftJoin(`${tableNames.user}`, `${tableNames.bookings}.user_id`, `${tableNames.user}.id`)
                    .where(`${tableNames.bookings}.id`, `=`, data[i].booking_id).first();
            }
        }

        return response(200, res, { message: "You are on slot page", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.getSlotsDate = async (req, res, next) => {
    try {
        const { date } = req.body;
        const { id } = req.params;
        const auth = await User.getUserByToken(req.headers.authorization);
        var startdateTime = new Date(date);

        const data = await Slots.query().select(
            `${tableNames.slots}.slot_date as SlotDate`,
        )
            .where('start_time', '>=', startdateTime)
            .where('user_id', '=', id);
        let slotsDate = [];
        for (let i = 0; i < data.length; i++) {
            let ValidFrom = data[i].SlotDate.toLocaleDateString('en-GB');
            // data[i].SlotDate = ValidFrom;
            slotsDate.push(moment(ValidFrom).format('DD-MM-YYYY'))

        }
        return response(200, res, { message: "Slots booked", data: slotsDate });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.deleteSlot = async (req, res, next) => {
    try {
        const { id } = req.params;
        await Slots.query().where({
            id: id
        }).delete();

        return response(200, res, { message: "", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.getExpertFreeSlots = async (req, res, next) => {
    try {
        const { date } = req.body;
        const { id } = req.params;

        var startdateTime = new Date(date);
        var enddateTime = new Date(date);
        enddateTime.setHours(enddateTime.getHours() + 24);

        const data = await Slots.query()
            .where('start_time', '>=', startdateTime)
            .where('start_time', '<=', enddateTime)
            .where('user_id', '=', id)
            .where('is_booked', '=', false);

        return response(200, res, { message: "You are on slot page", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.home = async (req, res, next) => {
    try {
        return response(200, res, { message: "You are on homepage" });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.dashboard = async (req, res, next) => {
    try {
        const auth = await User.getUserByToken(req.headers.authorization);
        let userInfo = await User.query().where({ id: auth.id }).first();

        let notesCount = await Notes.query().where({ user_id: auth.id, is_deleted: false }).count();
        var mentorshipTakenCount = 0;
        let mentorshipTakenRows = await Booking.query().select(
            `${tableNames.slots}.slot_date as SlotDate`,
            `${tableNames.slots}.start_time as SlotStartTime`,
            `${tableNames.slots}.end_time as SlotEndTime`,
            `${tableNames.bookings}.id as BookingID`,
        )
            .leftJoin(`${tableNames.slots}`, `${tableNames.slots}.booking_id`, `${tableNames.bookings}.id`,)
            .where(`${tableNames.bookings}.user_id`, '=', `${auth.id}`)
            .where(`${tableNames.bookings}.is_paid`, '=', true);

        for (var i in mentorshipTakenRows) {
            if (Date.parse(mentorshipTakenRows.SlotDate + ' ' + mentorshipTakenRows.SlotEndTime) > Date.parse(new Date())) {
                mentorshipTakenCount = mentorshipTakenCount + 1;
            }
        }

        var upcomingMeetingsCount = 0;
        let upcomingMeetingsRows = await Booking.query().select(
            `${tableNames.slots}.slot_date as SlotDate`,
            `${tableNames.slots}.start_time as SlotStartTime`,
            `${tableNames.slots}.end_time as SlotEndTime`,
            `${tableNames.bookings}.id as BookingID`,
        )
            .leftJoin(`${tableNames.slots}`, `${tableNames.slots}.booking_id`, `${tableNames.bookings}.id`,)
            .where(`${tableNames.slots}.user_id`, '=', `${auth.id}`)
            .where(`${tableNames.bookings}.is_paid`, '=', true);

        for (var i in upcomingMeetingsRows) {
            if (Date.parse(upcomingMeetingsRows.SlotDate + ' ' + upcomingMeetingsRows.SlotEndTime) < Date.parse(new Date())) {
                upcomingMeetingsCount = upcomingMeetingsCount + 1;
            }
        }

        let mentorshipGivenCount = await Slots.query().where({ user_id: auth.id, is_booked: true }).count();
        let notesReadCount = await LastReadNotes.query().where({ user_id: auth.id }).count();

        return response(200, res, {
            message: "You are on homepage", data: {
                userInfo: userInfo,
                meta: {
                    notesUploadCount: notesCount[0].count,
                    mentorshipGivenCount: mentorshipGivenCount[0].count,
                    currentRating: userInfo.rating,
                    notesReadCount: notesReadCount[0].count,
                    mentorshipTakenCount: mentorshipTakenCount,
                    upcomingMeetingsCount: upcomingMeetingsCount
                }
            }
        });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.myProfile = async (req, res, next) => {
    try {
        const auth = await User.getUserByToken(req.headers.authorization);
        const data = await User.query().findOne({ id: auth.id });
        data.password = '';

        let vinfo = await UserVerification.query().where({
            user_id: auth.id
        }).first();
        if (!vinfo) {
            await UserVerification.query().insert({ user_id: auth.id })
        }

        vinfo = await UserVerification.query().select(
            `${tableNames.user_verification_meta}.personal_doc_type`,
            `${tableNames.user_verification_meta}.personal_doc_ids`,
            `${tableNames.user_verification_meta}.linkedin_url`,
            `${tableNames.user_verification_meta}.major`,
            `${tableNames.user_verification_meta}.highschool_score`,
            `${tableNames.user_verification_meta}.other_ql_json`,
            `${tableNames.user_verification_meta}.university_accepted_json`,
            `${tableNames.user_verification_meta}.upi_id`,
            `${tableNames.user_verification_meta}.highschool_doc_ids`,
            `${tableNames.user_verification_meta}.other_ql_json`,
            `${tableNames.user_verification_meta}.university_accepted_json`,
            `${tableNames.user_verification_meta}.highschool_grade_type`,
            `${tableNames.user_verification_meta}.otherUniversity`,
            `${tableNames.user_verification_meta}.otherCurriculum`,
            `${tableNames.user_verification_meta}.otherQualification`,
            `${tableNames.user_verification_meta}.university`,
            `MetaCurriculum.title as highschool_grade_type`,
        )
            .leftJoin(`${tableNames.curriculums} as MetaCurriculum`, `${tableNames.user_verification_meta}.highschool_grade_type`, `MetaCurriculum.id`)
            .where(`${tableNames.user_verification_meta}.user_id`, '=', auth.id).first()


        vinfo.universityName = '';
        if (vinfo.university !== null) {
            const innerdata = await Universities.query().where({
                id: vinfo.university
            }).first();
            if (innerdata) {
                vinfo.universityName = innerdata.title;
            }
        }
        return response(200, res, {
            message: "Success", data: {
                userMeta: data,
                verificationInfo: vinfo
            }
        });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.getExperts = async (req, res, next) => {
    try {
        let limit = 0;
        if (req.query.limit) {
            limit = req.query.limit;
        }
        let offset = req.query.offset || 0;

        let crIds = [];
        let uniIds = [];
        let qualIds = [];
        if (typeof req.query.curriculums != undefined) {
            if (req.query.curriculums != '') {
                crIds = req.query.curriculums.split(',');
            }
        }

        if (typeof req.query.universities != undefined) {
            if (req.query.universities != '') {
                uniIds = req.query.universities.split(',');
            }
        }

        if (typeof req.query.qualification_type != undefined) {
            if (req.query.qualification_type != '') {
                qualIds = req.query.qualification_type.split(',');
            }

        }

        let data = User.query()
            .select(
                `${tableNames.user}.id`,
                `${tableNames.user}.name`,
                `${tableNames.user}.pro_pic_id`,
                `${tableNames.user}.mtag_enabled`,
                `${tableNames.user}.tagline`,
                `${tableNames.user_verification_meta}.highschool_grade_type as curriculum`,
                `${tableNames.user_verification_meta}.highschool_score as curriculum_score`,
                `${tableNames.universities}.feat_img_id as universityImageID`,
                `MetaCurriculum.title as curriculum`,
            )
            .leftJoin(`${tableNames.user_verification_meta}`, `${tableNames.user}.id`, `${tableNames.user_verification_meta}.user_id`)
            .leftJoin(`${tableNames.universities}`, `${tableNames.user_verification_meta}.university`, `${tableNames.universities}.id`)
            .leftJoin(`${tableNames.curriculums} as MetaCurriculum`, `${tableNames.user_verification_meta}.highschool_grade_type`, `MetaCurriculum.id`)
            .where(`${tableNames.user}.is_mentor`, `=`, true)
            .where(`${tableNames.user}.verification_status`, `=`, 1);

        if (crIds.length > 0) {
            data = data
                .whereIn(
                    `${tableNames.user_verification_meta}.highschool_grade_type`,
                    crIds
                );
        }
        if (uniIds.length > 0) {
            data = data
                .whereIn(
                    `${tableNames.user_verification_meta}.university`,
                    uniIds
                );
        }
        if (qualIds.length > 0) {
            data = data
                .whereIn(
                    `${tableNames.user_verification_meta}.qualification_type`,
                    qualIds
                );
        }
        if (limit > 0) {
            data = data
                .limit(limit)
                .offset(offset)
                .orderBy('id', 'DESC');
        } else {
            data = data
                .offset(offset)
                .orderBy('id', 'DESC');
        }

        data = await data;

        for (var i in data) {
            data[i].proPicURL = CONSTANTS.BUCKET_URL + 'useraplha/' + (data[i].name[0]).toLowerCase() + '.jpeg';
            data[i].universityImageURL = CONSTANTS.UNIVERSITY_PLACEHOLDER_URL;

            if (data[i].pro_pic_id != null) {
                let img = await Media.query().where({ id: data[i].pro_pic_id }).first();
                if (img != '') {
                    data[i].proPicURL = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + img.path);
                }
            }

            if (data[i].universityImageID != null) {
                let img = await Media.query().where({ id: data[i].universityImageID }).first();
                if (img != '') {
                    data[i].universityImageURL = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + img.path);
                }
            }
        }
        return response(200, res, { message: "Success", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.getNotes = async (req, res, next) => {
    try {
        let limit = req.query.limit || 20;
        let offset = req.query.offset || 0;
        let noteType = req.query.note_type || 0;
        let crIds = [];
        let sbIds = [];
        let uniIds = [];
        if (typeof req.query.curriculums != 'undefined') {
            if (req.query.curriculums != '') {
                crIds = req.query.curriculums.split(',');
            }
        }

        if (typeof req.query.subjects != 'undefined') {
            if (req.query.subjects != '') {
                sbIds = req.query.subjects.split(',');
            }
        }

        if (typeof req.query.universities != 'undefined') {
            if (req.query.universities != '') {
                uniIds = req.query.universities.split(',');
            }
        }

        let data = Notes.query()
            .select(
                `${tableNames.notes}.id`,
                `${tableNames.notes}.title`,
                `${tableNames.notes}.feat_img_id`,
                `${tableNames.notes}.id`,
                `${tableNames.user}.name as authorName`,
                `${tableNames.user}.pro_pic_id as authorImageID`,
                `MetaCurriculum.title as curriculum`,
                `${tableNames.user_verification_meta}.highschool_score as curriculum_score`,
                `${tableNames.universities}.feat_img_id as universityImageID`,
            )
            .leftJoin(`${tableNames.user}`, `${tableNames.notes}.user_id`, `${tableNames.user}.id`)
            .leftJoin(`${tableNames.user_verification_meta}`, `${tableNames.user}.id`, `${tableNames.user_verification_meta}.user_id`)
            .leftJoin(`${tableNames.universities}`, `${tableNames.user_verification_meta}.university`, `${tableNames.universities}.id`)
            .leftJoin(`${tableNames.curriculums} as MetaCurriculum`, `${tableNames.user_verification_meta}.highschool_grade_type`, `MetaCurriculum.id`)

            .where(`${tableNames.notes}.status`, `=`, 1)
            .where(`${tableNames.notes}.is_deleted`, `=`, false);


        if (crIds.length > 0) {
            data = data
                .whereIn(
                    'curriculum_id',
                    crIds
                );
        }
        if (sbIds.length > 0) {
            data = data
                .whereIn(
                    'subject_id',
                    sbIds
                );
        }

        if (uniIds.length > 0) {
            data = data
                .whereIn(
                    `${tableNames.user_verification_meta}.university`,
                    uniIds
                );
        }

        if (noteType > 0) {
            data = data.where(`${tableNames.notes}.note_type`, `=`, noteType);
        }

        data = data
            .limit(limit)
            .offset(offset)
            .orderBy('id', 'DESC');

        data = await data;

        for (var i in data) {
            data[i].cover = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/defaultTemplate/default-thumbnail.jpg');
            data[i].authorImageURL = CONSTANTS.BUCKET_URL + 'useraplha/' + (data[i].authorName[0]).toLowerCase() + '.jpeg';
            data[i].universityImageURL = CONSTANTS.UNIVERSITY_PLACEHOLDER_URL;
            if (data[i].feat_img_id != null) {
                let cover = await Media.query().where({ id: data[i].feat_img_id }).first();
                if (cover != '') {
                    data[i].cover = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + cover.path);
                }
            }

            if (data[i].authorImageID != null) {
                let img = await Media.query().where({ id: data[i].authorImageID }).first();
                if (img != '') {
                    data[i].authorImageURL = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + img.path);
                }
            }

            if (data[i].universityImageID != null) {
                let img = await Media.query().where({ id: data[i].universityImageID }).first();
                if (img != '') {
                    data[i].universityImageURL = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + img.path);
                }
            }
        }
        return response(200, res, { message: "Success", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.getSimilarNotes = async (req, res, next) => {
    try {
        const { id } = req.params;
        let limit = 4;
        let offset = 0;

        let data = Notes.query()
            .select(
                `${tableNames.notes}.id`,
                `${tableNames.notes}.title`,
                `${tableNames.notes}.feat_img_id`,
                `${tableNames.notes}.id`,
                `${tableNames.user}.name as authorName`,
                `${tableNames.user}.pro_pic_id as authorImageID`,
                `MetaCurriculum.title as curriculum`,
                `${tableNames.user_verification_meta}.highschool_score as curriculum_score`,
                `${tableNames.universities}.feat_img_id as universityImageID`,
            )
            .leftJoin(`${tableNames.user}`, `${tableNames.notes}.user_id`, `${tableNames.user}.id`)
            .leftJoin(`${tableNames.user_verification_meta}`, `${tableNames.user}.id`, `${tableNames.user_verification_meta}.user_id`)
            .leftJoin(`${tableNames.universities}`, `${tableNames.user_verification_meta}.university`, `${tableNames.universities}.id`)
            .leftJoin(`${tableNames.curriculums} as MetaCurriculum`, `${tableNames.user_verification_meta}.highschool_grade_type`, `MetaCurriculum.id`)
            .where(`${tableNames.notes}.status`, `=`, 1)
            .where(`${tableNames.notes}.is_deleted`, `=`, false);

        data = data
            .limit(limit)
            .offset(offset)
            .orderBy('id', 'DESC');

        data = await data;

        for (var i in data) {
            data[i].cover = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/defaultTemplate/default-thumbnail.jpg');
            data[i].authorImageURL = CONSTANTS.BUCKET_URL + 'useraplha/' + (data[i].authorName[0]).toLowerCase() + '.jpeg';
            data[i].universityImageURL = CONSTANTS.UNIVERSITY_PLACEHOLDER_URL;
            if (data[i].feat_img_id != null) {
                let cover = await Media.query().where({ id: data[i].feat_img_id }).first();
                if (cover != '') {
                    data[i].cover = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + cover.path);
                }
            }

            if (data[i].authorImageID != null) {
                let img = await Media.query().where({ id: data[i].authorImageID }).first();
                if (img != '') {
                    data[i].authorImageURL = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + img.path);
                }
            }

            if (data[i].universityImageID != null) {
                let img = await Media.query().where({ id: data[i].universityImageID }).first();
                if (img != '') {
                    data[i].universityImageURL = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + img.path);
                }
            }
        }
        return response(200, res, { message: "Success", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.getNotesByExpertID = async (req, res, next) => {
    try {
        const { id } = req.params;
        let limit = 20;
        let offset = 0;

        let data = Notes.query()
            .select(
                `${tableNames.notes}.id`,
                `${tableNames.notes}.title`,
                `${tableNames.notes}.feat_img_id`,
                `${tableNames.notes}.id`,
                `${tableNames.user}.name as authorName`,
                `${tableNames.user}.pro_pic_id as authorImageID`,
                `MetaCurriculum.title as curriculum`,
                `${tableNames.user_verification_meta}.highschool_score as curriculum_score`,
                `${tableNames.universities}.feat_img_id as universityImageID`,
            )
            .leftJoin(`${tableNames.user}`, `${tableNames.notes}.user_id`, `${tableNames.user}.id`)
            .leftJoin(`${tableNames.user_verification_meta}`, `${tableNames.user}.id`, `${tableNames.user_verification_meta}.user_id`)
            .leftJoin(`${tableNames.universities}`, `${tableNames.user_verification_meta}.university`, `${tableNames.universities}.id`)
            .leftJoin(`${tableNames.curriculums} as MetaCurriculum`, `${tableNames.user_verification_meta}.highschool_grade_type`, `MetaCurriculum.id`)
            .where(`${tableNames.notes}.user_id`, `=`, id)
            .where(`${tableNames.notes}.status`, `=`, 1)
            .where(`${tableNames.notes}.is_deleted`, `=`, false);

        data = data
            .limit(limit)
            .offset(offset)
            .orderBy('id', 'DESC');

        data = await data;

        for (var i in data) {
            data[i].cover = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/defaultTemplate/default-thumbnail.jpg');
            data[i].authorImageURL = CONSTANTS.BUCKET_URL + 'useraplha/' + (data[i].authorName[0]).toLowerCase() + '.jpeg';
            data[i].universityImageURL = CONSTANTS.UNIVERSITY_PLACEHOLDER_URL;
            if (data[i].feat_img_id != null) {
                let cover = await Media.query().where({ id: data[i].feat_img_id }).first();
                if (cover != '') {
                    data[i].cover = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + cover.path);
                }
            }

            if (data[i].authorImageID != null) {
                let img = await Media.query().where({ id: data[i].authorImageID }).first();
                if (img != '') {
                    data[i].authorImageURL = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + img.path);
                }
            }

            if (data[i].universityImageID != null) {
                let img = await Media.query().where({ id: data[i].universityImageID }).first();
                if (img != '') {
                    data[i].universityImageURL = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + img.path);
                }
            }
        }
        return response(200, res, { message: "Success", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.getNoteDetail = async (req, res, next) => {
    try {
        const { id } = req.params;
        let data = await Notes.query()
            .select(
                `${tableNames.notes}.id`,
                `${tableNames.notes}.title`,
                `${tableNames.notes}.feat_img_id`,
                `${tableNames.notes}.desc`,
                `${tableNames.notes}.doc_id`,
                `${tableNames.notes}.preview_id`,
                `${tableNames.user}.name as authorName`,
                `${tableNames.user}.id as authorID`,
                `${tableNames.user}.pro_pic_id as authorImageID`,
                `${tableNames.user_verification_meta}.highschool_score as curriculum_score`,
                `${tableNames.universities}.feat_img_id as universityImageID`,
                `${tableNames.universities}.title as universityName`,
                `${tableNames.subject}.title as subjectTitle`,
                `${tableNames.theme}.title as themeTitle`,
                `${tableNames.topic}.title as topicTitle`,
                `MetaCurriculum.title as curriculum`,
            )
            .leftJoin(`${tableNames.subject}`, `${tableNames.notes}.subject_id`, `${tableNames.subject}.id`)
            .leftJoin(`${tableNames.theme}`, `${tableNames.notes}.theme_id`, `${tableNames.theme}.id`)
            .leftJoin(`${tableNames.topic}`, `${tableNames.notes}.topic_id`, `${tableNames.topic}.id`)
            .leftJoin(`${tableNames.user}`, `${tableNames.notes}.user_id`, `${tableNames.user}.id`)
            .leftJoin(`${tableNames.user_verification_meta}`, `${tableNames.user}.id`, `${tableNames.user_verification_meta}.user_id`)
            .leftJoin(`${tableNames.universities}`, `${tableNames.user_verification_meta}.university`, `${tableNames.universities}.id`)
            .leftJoin(`${tableNames.curriculums} as MetaCurriculum`, `${tableNames.user_verification_meta}.highschool_grade_type`, `MetaCurriculum.id`)
            .where(`${tableNames.notes}.id`, `=`, id)
            .where(`${tableNames.notes}.is_deleted`, `=`, false)
            .first();

        data.isSubscribed = false;
        data.docURL = '';
        var subscription = false;
        if (req.headers.authorization !== 'null') {
            const auth = await User.getUserByToken(req.headers.authorization);
            subscription = await Subscriptions.query()
                .where({
                    user_id: auth.id,
                    is_paid: true
                })
                .where(`valid_from`, `<=`, new Date())
                .where(`valid_upto`, `>=`, new Date())
                .first();
        }

        data.previewURL = '';
        if (data.preview_id != null) {
            let preview = await Media.query().where({ id: data.preview_id }).first();
            if (preview != '') {
                var AWS = require('aws-sdk');
                var credentials = {
                    accessKeyId: process.env.AWS_ACCESS_KEY,
                    secretAccessKey: process.env.AWS_SECRET_KEY,
                };
                AWS.config.update({ credentials: credentials, region: 'us-east-2' });
                var s3 = new AWS.S3();

                var presignedGETURL = s3.getSignedUrl('getObject', {
                    Bucket: 'menteerebucket',
                    Key: preview.path, //filename
                    Expires: 20, //time to expire in seconds
                });
                data.previewURL = presignedGETURL;
            }
        }

        if (subscription) {
            data.isSubscribed = true;
            if (data.doc_id != null) {
                let doc = await Media.query().where({ id: data.doc_id }).first();
                if (doc != '') {
                    var AWS = require('aws-sdk');
                    var credentials = {
                        accessKeyId: process.env.AWS_ACCESS_KEY,
                        secretAccessKey: process.env.AWS_SECRET_KEY,
                    };
                    AWS.config.update({ credentials: credentials, region: 'us-east-2' });
                    var s3 = new AWS.S3();

                    var presignedGETURL = s3.getSignedUrl('getObject', {
                        Bucket: 'menteerebucket',
                        Key: doc.path, //filename
                        Expires: 20 //time to expire in seconds
                    });
                    data.docURL = presignedGETURL;
                }
            }
        }
        return response(200, res, { message: "Success", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.getExpertDetail = async (req, res, next) => {
    try {
        const { id } = req.params;
        let data = await User.query()
            .select(
                `${tableNames.user}.id`,
                `${tableNames.user}.name as ExpertName`,
                `${tableNames.user}.pro_pic_id`,
                `${tableNames.user}.about_me as AboutExpert`,
                `${tableNames.user}.rating`,
                `${tableNames.user}.fee_per_hour as Price`,
                `${tableNames.user}.tagline`,
                `${tableNames.user}.mtag_enabled`,
                `${tableNames.user_verification_meta}.major`,
                `${tableNames.user_verification_meta}.highschool_score as curriculumScore`,
                `${tableNames.user_verification_meta}.university_accepted_json as universityAccepted`,
                `${tableNames.user_verification_meta}.other_ql_json as otherQualifications`,
                `${tableNames.universities}.feat_img_id as universityImageID`,
                `${tableNames.universities}.title as universityName`,
                `MetaCurriculum.title as curriculum`,
            )
            .leftJoin(`${tableNames.user_verification_meta}`, `${tableNames.user}.id`, `${tableNames.user_verification_meta}.user_id`)
            .leftJoin(`${tableNames.universities}`, `${tableNames.user_verification_meta}.university`, `${tableNames.universities}.id`)
            .leftJoin(`${tableNames.curriculums} as MetaCurriculum`, `${tableNames.user_verification_meta}.highschool_grade_type`, `MetaCurriculum.id`)
            .where(`${tableNames.user}.id`, `=`, id)
            .first();

        if (data) {
            data.proPicURL = CONSTANTS.BUCKET_URL + 'useraplha/' + (data.ExpertName[0]).toLowerCase() + '.jpeg';
            data.universityImageURL = CONSTANTS.UNIVERSITY_PLACEHOLDER_URL;

            if (data.pro_pic_id != null) {
                let img = await Media.query().where({ id: data.pro_pic_id }).first();
                if (img != '') {
                    data.proPicURL = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + img.path);
                }
            }

            if (data.universityImageID != null) {
                let img = await Media.query().where({ id: data.universityImageID }).first();
                if (img != '') {
                    data.universityImageURL = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + img.path);
                }
            }
        }

        return response(200, res, { message: "Success", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.getPlans = async (req, res, next) => {
    try {
        let data = await SubscriptionPlans.query().orderBy('price', 'asc')
        return response(200, res, { message: "Success", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.subscribeMe = async (req, res, next) => {
    try {
        const { id } = req.body;

        const auth = await User.getUserByToken(req.headers.authorization);
        var startdateTime = new Date();
        let chek = moment(startdateTime).format('YYYY-MM-DD')
        console.log("startdatetime " + chek);
        let planinfo = await SubscriptionPlans.query().where({
            id: id,
        }).first();
        let convertedPrice;
        if (planinfo.price > 0) {
            let currencyConverter = new CC({ from: "USD", to: "INR", amount: planinfo.price })
            convertedPrice = await currencyConverter.convert();
        }

        const subscribedUser = await FreeSubscribedUser.query()
            .where({ user_id: auth.id })

        if (planinfo.price == 0 && subscribedUser.length == 0) {
            var endDate = new Date(); // Now
            endDate.setDate(endDate.getDate() + 36500);

            let transactions = await Transaction.query().insert({
                txn_id: '',
                amount: planinfo.price,
                pay_gateway: 'EaseBuzz',
                pay_status: 0,

            }).returning("id");

            let transactionid = transactions.id;

            let subscription = await Subscriptions.query().insert({
                user_id: auth.id,
                total: planinfo.price,
                is_paid: false,
                status: 0,
                transaction_id: transactionid,
                valid_from: new Date(),
                valid_upto: endDate,
                plan_id: id,
            }).returning("id");

            let txnid = subscription.id;
            return response(200, res, {
                message: "Success",
                data: {
                    subscriptionID: txnid,
                    easeBuzzAccessKey: false
                }
            });
        }
        if (planinfo.price == 0 && subscribedUser.length > 0) {
            return response(400, res, {
                message: "You have already taken free subscription. Please Upgrade to another plan",
                data: null
            })
        }

        let chekcSubscription = await Subscriptions.query().where({
            user_id: auth.id,
            is_paid: true,
            status: 1,
            plan_id: id,
        })
            .where(`${tableNames.subscriptions}.valid_upto`, '>=', chek)
            .first();

        if (!chekcSubscription) {
            var endDate = new Date(); // Now
            endDate.setDate(endDate.getDate() + 30);

            let transactions = await Transaction.query().insert({
                txn_id: '',
                amount: planinfo.price,
                pay_gateway: 'EaseBuzz',
                pay_status: 0,

            }).returning("id");

            let transactionid = transactions.id;

            let subscription = await Subscriptions.query().insert({
                user_id: auth.id,
                total: planinfo.price,
                is_paid: false,
                status: 0,
                transaction_id: transactionid,
                valid_from: new Date(),
                valid_upto: endDate,
                plan_id: id,
            }).returning("id");

            let txnid = subscription.id;
            let user = await User.query().where({ id: auth.id }).first();

            var easebuzzKey = process.env.EASEBUZZ_KEY;
            var saltKey = process.env.EASEBUZZ_SALT;

            let productinfo = "Menteere Subscription";
            let phone = "9501736242";
            const hashString = easebuzzKey + "|" + txnid + "|" + convertedPrice + "|" + productinfo + "|" + user.name + "|" + user.email + "|" + "" + "|" + "" + "|" + "" + "|" + "" + "|" + "" + "|" + "" + "|" + "" + "|" + "" + "|" + "" + "|" + "" + "|" + saltKey;
            const hash = sha512.sha512(hashString)
            console.log('hash--', hashString);
            var FormData = require('form-data');
            var form = new FormData();
            form.append('key', easebuzzKey);
            form.append('txnid', txnid);
            form.append('amount', convertedPrice);
            form.append('productinfo', productinfo);
            console.log(form)

            form.append('firstname', user.name);
            form.append('phone', phone);
            form.append('email', user.email);
            form.append('surl', "https://docs.easebuzz.in/code-response/success");
            form.append('furl', "https://docs.easebuzz.in/code-response/success");
            form.append('hash', hash);

            const fetch = require('node-fetch');
            // const data = await fetch('https://pay.easebuzz.in/payment/initiateLink', { method: 'POST', body: form })
            const data = await fetch(`${process.env.EASEBUZZLINK}`, { method: 'POST', body: form })
                .then(function (res) {
                    console.log(res);
                    return res.json();
                }).then(function (json) {
                    return json;
                })
                .catch(function (error) {
                    console.log(error);
                });

            return response(200, res, {
                message: "Success",
                data: {
                    subscriptionID: txnid,
                    easeBuzzAccessKey: data
                }
            });
        } else {
            return response(400, res, {
                message: "Already subscribed",
                data: null,
            });
        }
    } catch (error) {
        console.log(error);
        return catchFailure(res, error);
    }
}

exports.completeSubscription = async (req, res, next) => {
    try {
        const { txn_id, gateway_response, is_paid, subscriptionId } = req.body;

        const auth = await User.getUserByToken(req.headers.authorization);



        let subscription = await Subscriptions.query().where({ id: subscriptionId }).update({
            is_paid: is_paid,
            status: is_paid ? 1 : 0,
        });

        let subscriptionDetails = await Subscriptions.query().where({ id: subscriptionId }).first();

        let validFrom = moment(subscriptionDetails.valid_from).format('YYYY-MM-DD');
        let validUpto = moment(subscriptionDetails.valid_upto).format('YYYY-MM-DD');

        let transaction_id = await Subscriptions.query().select("transaction_id").where({ id: subscriptionId }).first();
        let transacID = transaction_id.transaction_id;

        let transactionTotal = await Subscriptions.query().select("total").where({ id: subscriptionId }).first();

        let subscriptionPlan = await SubscriptionPlans.query().where({ id: subscriptionDetails.plan_id }).first();


        var user = await User.query().where({
            id: auth.id
        }).first();

        let planHrs = 0;
        if (is_paid) {
            let planinfo = await SubscriptionPlans.query().where({
                id: subscriptionDetails.plan_id,
            }).first();
            planHrs = planinfo.mentorship_hrs;
        }

        let checkHrs = await User.query().where({
            id: auth.id
        }).first();

        let finalHours = planHrs + checkHrs.hrs;
        let walletHrs = await User.query().where({ id: auth.id }).update({
            hrs: finalHours,
        });

        let transactions = await Transaction.query().where({ id: transacID }).update({
            txn_id: txn_id,
            pay_status: is_paid ? 1 : 0,
            gateway_response: gateway_response,
        })

        if (txn_id == "FREE00") {
            let transactions = await FreeSubscribedUser.query().insert({
                user_id: auth.id,

            }).returning("id");
        }

        if (is_paid) {
            const AWS = require("aws-sdk");

            AWS.config.update({
                accessKeyId: process.env.AWS_SES_KEY,
                secretAccessKey: process.env.AWS_SES_SECRET_KEY,
                region: process.env.AWS_SES_REIGON
            });


            const ses = new AWS.SES();

            const params = {
                "Source": process.env.AWS_SES_EMAIL,
                "Template": "SubscriptionPlanMessageTemplate",
                "Destination": {
                    "ToAddresses": [user.email]
                },
                "TemplateData": "{ \"name\":\"" + user.name + "\", \"txn_id\": \"" + txn_id + "\", \"amount\": \"" + transactionTotal.total + "\", \"subscription\": \"" + subscriptionPlan.desc + "\", \"validFrom\": \"" + validFrom + "\", \"validUpto\": \"" + validUpto + "\" }"
            }

            console.log("params " + JSON.stringify(params))

            ses.sendTemplatedEmail(params, (err, data) => {
                if (err) {
                    console.log(err, err.stack);
                } else {
                    console.log(data);           // successful response
                }
            });

        }
        return response(200, res, { message: "Success", data: null });
    } catch (error) {
        console.log(error);
        return catchFailure(res, error);
    }
}


exports.storeMyNotes = async (req, res, next) => {
    try {
        const { title, desc } = req.body;
        const auth = await User.getUserByToken(req.headers.authorization);
        const data = await Notes.query().insert({ title, desc, user_id: auth.id });
        return response(200, res, { message: "Success", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.myNotes = async (req, res, next) => {
    try {
        const auth = await User.getUserByToken(req.headers.authorization);
        const data = await Notes.query().where({ user_id: auth.id, is_deleted: false });
        return response(200, res, { message: "Success", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.getCurriculums = async (req, res, next) => {
    try {

        if (typeof req.query.keywords != 'undefined') {
            const data = await Curriculums.query().where({
                is_active: true,
            })
                .whereRaw("LOWER(title) LIKE '%' || LOWER(?) || '%' ", req.query.keywords);
            return response(200, res, { message: "Success", data: data });
        } else {
            const data = await Curriculums.query().where({
                is_active: true
            });
            return response(200, res, { message: "Success", data: data });
        }
        return response(200, res, { message: "Success", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.getUniversities = async (req, res, next) => {
    try {
        let chk = [];
        if (typeof req.query.keywords != 'undefined') {
            chk = await Universitites.query().where({
                is_active: true,
            })
                .whereRaw("LOWER(title) LIKE '%' || LOWER(?) || '%' ", req.query.keywords);
        } else {
            chk = await Universitites.query().where({
                is_active: true,
            });
        }
        for (var i in chk) {
            chk[i].universityImageURL = CONSTANTS.UNIVERSITY_PLACEHOLDER_URL;
            if (chk[i].feat_img_id != null) {
                let img = await Media.query().where({ id: chk[i].feat_img_id }).first();
                if (img != '') {
                    chk[i].universityImageURL = encodeURI(CONSTANTS.BUCKET_URL + img.path);
                }
            }
        }

        let data = [];
        chk.forEach(element => {
            if (element.title != 'others') {
                data.push(element)
            }
        });
        return response(200, res, { message: "Success", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.getQualifications = async (req, res, next) => {
    try {

        if (typeof req.query.keywords != 'undefined') {
            const data = await MetaInfo.query().where({
                type: 'qualification_type'
            })
                .whereRaw("LOWER(title) LIKE '%' || LOWER(?) || '%' ", req.query.keywords);
            return response(200, res, { message: "Success", data: data });
        } else {
            const data = await MetaInfo.query().where({
                type: 'qualification_type'
            });
            return response(200, res, { message: "Success", data: data });
        }
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.getSubjectsByCurriculumID = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = await Subject.query().where({
            curriculum_id: id
        });
        return response(200, res, { message: "Success", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.getSubjects = async (req, res, next) => {
    try {
        if (typeof req.query.keywords != 'undefined') {
            let data = await Subject.query()
                .whereRaw("LOWER(title) LIKE '%' || LOWER(?) || '%' ", req.query.keywords);
            return response(200, res, { message: "Success", data: data });
        } else {
            let data = await Subject.query();
            return response(200, res, { message: "Success", data: data });
        }
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.getThemeBySubjectID = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = await Theme.query().where({
            subject_id: id
        });
        return response(200, res, { message: "Success", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.getTopicByThemeID = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = await Topic.query().where({
            theme_id: id
        });
        return response(200, res, { message: "Success", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.updateClickCount = async (req, res, next) => {
    try {

        const { noteId } = req.body;
        const auth = await User.getUserByToken(req.headers.authorization);

        const checkIfExist = await NumberOfClicks.query().where({
            user_id: auth.id,
            note_id: noteId,
        }).first();

        if (!checkIfExist) {
            await NumberOfClicks.query().insert({
                user_id: auth.id,
                note_id: noteId,
                clicks: 1
            });
        }

        return response(200, res, { message: "success", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}