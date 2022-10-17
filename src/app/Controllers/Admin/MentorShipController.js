const { response, catchFailure, CONSTANTS } = require('../../Helpers/basics');
const errorMessages = require('../../Helpers/errorMessages');
const tableNames = require('../../../database/tableNames');
const Slots = require('../../Models/Slots');

exports.fetchMentorships = async (req, res, next) => {
    const columns = [
        'id',
        'status',
        'validFrom',
        'validUpto',
        'total'
    ];

    const limit = req.body.length;
    const start = req.body.start;
    const ordercolumn = req.body['order[0][column]'];
    let order = columns[ordercolumn];

    const dir = req.body['order[0][dir]'];
    let totalData = await Slots.query().count();
    totalData = totalData[0].count;

    let posts = [];
    let totalFiltered = 0;
    let search = '';
    if (req.body['search[value]'] == '' || req.body['search[value]'] == null) {
        try {
            posts = await Slots.query()
                .select(
                    `${tableNames.slots}.id as SlotID`,
                    `${tableNames.slots}.slot_date as SlotDate`,
                    `${tableNames.slots}.start_time as SlotStartTime`,
                    `${tableNames.slots}.end_time as SlotEndTime`,
                    `${tableNames.slots}.approval_status as SlotApprovalStatus`,
                    `${tableNames.slots}.user_id as MenteerID`,
                    `${tableNames.bookings}.selected_curriculum as UserCurriculum`,
                    `${tableNames.bookings}.selected_subject as UserSubject`,
                    `${tableNames.bookings}.description as UserShortDescription`,
                    `${tableNames.bookings}.has_rated as HasUserRated`,
                    `${tableNames.bookings}.rating as SlotRating`,
                    `${tableNames.user}.name as UserNiceName`,
                    `${tableNames.user}.id as UserId`,
                    `${tableNames.media}.path as UserProfilePicURL`,
                    `MetaUser.name as MenteerName`
                )
                .leftJoin(`${tableNames.bookings}`, `${tableNames.slots}.booking_id`, `${tableNames.bookings}.id`)
                .leftJoin(`${tableNames.user}`, `${tableNames.bookings}.user_id`, `${tableNames.user}.id`)
                .leftJoin(`${tableNames.media}`, `${tableNames.media}.id`, `${tableNames.user}.pro_pic_id`)
                .leftJoin(`${tableNames.user} as MetaUser`, `${tableNames.slots}.user_id`, `MetaUser.id`)
                .whereNotNull(`${tableNames.slots}.booking_id`)
                .orderBy(`${tableNames.slots}.id`, `DESC`);

            for (var i in posts) {
                if (posts[i].UserProfilePicURL == null) {
                    posts[i].UserProfilePicURL = CONSTANTS.AVATAR_URL;
                } else {
                    posts[i].UserProfilePicURL = CONSTANTS.BUCKET_URL + posts[i].UserProfilePicURL;
                }
            }
        } catch (error) {
            console.log(error);
        }

        totalFiltered = posts.length;
    }
    else {
        search = req.body['search[value]'];
        try {
            if (order == 'id')
                order = 'slots.' + order;
            let q = Slots.query()
                .select(
                    `${tableNames.slots}.id as SlotID`,
                    `${tableNames.slots}.slot_date as SlotDate`,
                    `${tableNames.slots}.start_time as SlotStartTime`,
                    `${tableNames.slots}.end_time as SlotEndTime`,
                    `${tableNames.slots}.approval_status as SlotApprovalStatus`,
                    `${tableNames.slots}.user_id as MenteerID`,
                    `${tableNames.bookings}.selected_curriculum as UserCurriculum`,
                    `${tableNames.bookings}.selected_subject as UserSubject`,
                    `${tableNames.bookings}.description as UserShortDescription`,
                    `${tableNames.bookings}.has_rated as HasUserRated`,
                    `${tableNames.bookings}.rating as SlotRating`,
                    `${tableNames.user}.name as UserNiceName`,
                    `${tableNames.user}.id as UserId`,
                    `${tableNames.media}.path as UserProfilePicURL`,
                    `MetaUser.name as MenteerName`
                )
                .leftJoin(`${tableNames.bookings}`, `${tableNames.slots}.booking_id`, `${tableNames.bookings}.id`)
                .leftJoin(`${tableNames.user}`, `${tableNames.bookings}.user_id`, `${tableNames.user}.id`)
                .leftJoin(`${tableNames.media}`, `${tableNames.media}.id`, `${tableNames.user}.pro_pic_id`)
                .leftJoin(`${tableNames.user} as MetaUser`, `${tableNames.slots}.user_id`, `MetaUser.id`)
                // .where(`${tableNames.user}.name`, 'like', search)
                .where(`MetaUser.name`, 'like', `%${search}%`)
                // .whereRaw(`LOWER(MetaUser.name) LIKE '%' || LOWER(?) || '%' `, search)
                .whereNotNull(`${tableNames.slots}.booking_id`)
                .offset(start)
                .limit(limit)
                .orderBy(order, dir);

            console.log(q.sql);
            posts = await q;
        } catch (error) {
            console.log(error);
        }
        console.log(posts.length);

        totalFiltered = posts.length;
    }
    let data = [];

    if (posts.length > 0) {
        posts.forEach(item => {
            let nestedData = {};

            nestedData.id = item.SlotID;
            nestedData.slotDate = item.SlotDate.toLocaleDateString('en-GB');
            nestedData.startTime = item.SlotStartTime;
            nestedData.endTime = item.SlotEndTime;
            nestedData.approvalStatus = item.SlotApprovalStatus;
            nestedData.menteerName = item.MenteerName;
            nestedData.menteerId = item.MenteerID;
            nestedData.userCurriculum = item.UserCurriculum;
            nestedData.UserSubject = item.UserSubject;
            nestedData.desc = item.UserShortDescription;
            nestedData.hasRated = item.HasUserRated;
            nestedData.rating = item.SlotRating;
            nestedData.userName = item.UserNiceName;
            nestedData.userID = item.UserId;
            nestedData.userProfilePicURL = item.UserProfilePicURL;

            data.push(nestedData);
        });
    }
    return res.status(200).json({
        draw: parseInt(req.body['draw']),
        recordsTotal: parseInt(totalData),
        recordsFiltered: parseInt(totalFiltered),
        data: data,
        search: search
    });
}


exports.getAllMentorshipList = async (req, res, next) => {
    try {
        const data = await Slots.query()
            .select(
                `${tableNames.slots}.id as SlotID`,
                `${tableNames.slots}.slot_date as SlotDate`,
                `${tableNames.slots}.start_time as SlotStartTime`,
                `${tableNames.slots}.end_time as SlotEndTime`,
                `${tableNames.slots}.approval_status as SlotApprovalStatus`,
                `${tableNames.slots}.user_id as MenteerID`,
                `${tableNames.bookings}.selected_curriculum as UserCurriculum`,
                `${tableNames.bookings}.selected_subject as UserSubject`,
                `${tableNames.bookings}.description as UserShortDescription`,
                `${tableNames.bookings}.has_rated as HasUserRated`,
                `${tableNames.bookings}.rating as SlotRating`,
                `${tableNames.user}.name as UserNiceName`,
                `${tableNames.user}.id as UserId`,
                `${tableNames.media}.path as UserProfilePicURL`,
                `MetaUser.name as MenteerName`
            )
            .leftJoin(`${tableNames.bookings}`, `${tableNames.slots}.booking_id`, `${tableNames.bookings}.id`)
            .leftJoin(`${tableNames.user}`, `${tableNames.bookings}.user_id`, `${tableNames.user}.id`)
            .leftJoin(`${tableNames.media}`, `${tableNames.media}.id`, `${tableNames.user}.pro_pic_id`)
            .leftJoin(`${tableNames.user} as MetaUser`, `${tableNames.slots}.user_id`, `MetaUser.id`)
            .whereNotNull(`${tableNames.slots}.booking_id`)
            .orderBy(`${tableNames.slots}.id`, `DESC`);

        for (var i in data) {
            if (data[i].UserProfilePicURL == null) {
                data[i].UserProfilePicURL = CONSTANTS.AVATAR_URL;
            } else {
                data[i].UserProfilePicURL = CONSTANTS.BUCKET_URL + data[i].UserProfilePicURL;
            }
        }

        return response(200, res, { message: "Success", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.getUserMentorshipDetail = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = await Slots.query()
            .select(
                `${tableNames.slots}.id as SlotID`,
                `${tableNames.slots}.slot_date as SlotDate`,
                `${tableNames.slots}.start_time as SlotStartTime`,
                `${tableNames.slots}.end_time as SlotEndTime`,
                `${tableNames.slots}.approval_status as SlotApprovalStatus`,
                `${tableNames.slots}.user_id as MenteerID`,
                `${tableNames.bookings}.selected_curriculum as UserCurriculum`,
                `${tableNames.bookings}.selected_subject as UserSubject`,
                `${tableNames.bookings}.description as UserShortDescription`,
                `${tableNames.bookings}.has_rated as HasUserRated`,
                `${tableNames.bookings}.rating as SlotRating`,
                `${tableNames.user}.name as UserNiceName`,
                `${tableNames.media}.path as UserProfilePicURL`,
                `MetaUser.name as MenteerName`
            )
            .leftJoin(`${tableNames.bookings}`, `${tableNames.slots}.booking_id`, `${tableNames.bookings}.id`)
            .leftJoin(`${tableNames.user}`, `${tableNames.bookings}.user_id`, `${tableNames.user}.id`)
            .leftJoin(`${tableNames.media}`, `${tableNames.media}.id`, `${tableNames.user}.pro_pic_id`)
            .leftJoin(`${tableNames.user} as MetaUser`, `${tableNames.slots}.user_id`, `MetaUser.id`)
            .where(`${tableNames.slots}.id`, `=`, id)
            .first();

        if (data.UserProfilePicURL == null) {
            data.UserProfilePicURL = CONSTANTS.AVATAR_URL;
        } else {
            data.UserProfilePicURL = CONSTANTS.BUCKET_URL + data.UserProfilePicURL;
        }

        return response(200, res, { message: "Success", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}