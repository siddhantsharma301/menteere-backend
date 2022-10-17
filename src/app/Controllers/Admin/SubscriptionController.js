const { response, catchFailure, CONSTANTS } = require('../../Helpers/basics')
const SubscriptionPlans = require('../../Models/SubscriptionPlans')
const Subscriptions = require('../../Models/Subscriptions')
const tableNames = require('../../../database/tableNames')
const Media = require('../../Models/Media')
const User = require('../../Models/User')


exports.fetchSubscriptions = async (req, res, next) => {
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
    let totalData = await Subscriptions.query().count();
    totalData = totalData[0].count;


    let posts = [];
    let totalFiltered = 0;
    let search = '';
    if (req.body['search[value]'] == '' || req.body['search[value]'] == null) {
        posts = await Subscriptions.query().select(
            `${tableNames.subscriptions}.id`,
            `${tableNames.subscriptions}.status`,
            `${tableNames.subscriptions}.valid_from`,
            `${tableNames.subscriptions}.valid_upto`,
            `${tableNames.user}.name`,
            `${tableNames.subscriptionPlans}.title`
        )
            .leftJoin(`${tableNames.user}`, `${tableNames.user}.id`, `${tableNames.subscriptions}.user_id`)
            .leftJoin(`${tableNames.subscriptionPlans}`, `${tableNames.subscriptionPlans}.id`, `${tableNames.subscriptions}.plan_id`)
            .offset(start)
            .limit(limit)
            .orderBy(order, dir)


        totalFiltered = posts.length;
    }
    else {
        search = req.body['search[value]'];
        try {
            if (order == 'id')
                order = 'subscription.' + order;
            posts = await Subscriptions.query().select(
                `${tableNames.subscriptions}.id`,
                `${tableNames.subscriptions}.status`,
                `${tableNames.subscriptions}.valid_from`,
                `${tableNames.subscriptions}.valid_upto`,
                `${tableNames.user}.name`,
                `${tableNames.subscriptionPlans}.title`
            )
                .leftJoin(`${tableNames.user}`, `${tableNames.user}.id`, `${tableNames.subscriptions}.user_id`)
                .leftJoin(`${tableNames.subscriptionPlans}`, `${tableNames.subscriptionPlans}.id`, `${tableNames.subscriptions}.plan_id`)
                .whereRaw("LOWER(name) LIKE '%' || LOWER(?) || '%' ", search)
                .offset(start)
                .limit(limit)
                .orderBy(order, dir);
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
            let curr_date = new Date().toLocaleDateString('en-GB');
            let validUpto = item.valid_upto.toLocaleDateString('en-GB')
            if (Date.parse(item.valid_upto) > Date.parse(new Date())) {
                nestedData.status = 'Active'
            }
            else {
                nestedData.status = 'Not-Active'
            }
            console.log("Current Date" + curr_date);
            console.log("Valid Upto " + validUpto)
            console.log(Date.parse(item.valid_upto) + '>' + Date.parse(new Date()));
            nestedData.id = item.id;
            nestedData.validFrom = item.valid_from.toLocaleDateString('en-GB');
            nestedData.validUpto = item.valid_upto.toLocaleDateString('en-GB');
            nestedData.name = item.name;
            nestedData.planName = item.title;
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

exports.getAllSubscriptions = async (req, res, next) => {
    try {
        const subscriptions = await SubscriptionPlans.query().select(
            `${tableNames.subscriptionPlans}.id as plan_id`,
            `${tableNames.subscriptionPlans}.title as planName`,
            `${tableNames.subscriptionPlans}.price as price`,
        )
        return response(200, res, { message: "success", data: subscriptions })
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.viewSubscription = async (req, res, next) => {
    try {
        const { id } = req.params;
        let subscription = await Subscriptions.query().select(
            `${tableNames.subscriptions}.id`,
            `${tableNames.subscriptions}.status`,
            `${tableNames.subscriptions}.valid_from`,
            `${tableNames.subscriptions}.valid_upto`,
            `${tableNames.user}.name`,
            `${tableNames.user}.email`,
            `${tableNames.user}.pro_pic_id`,
            `${tableNames.user}.hrs`,
            `${tableNames.media}.path as pro_pic_url`,
            `${tableNames.subscriptionPlans}.title as planName`,
            `${tableNames.subscriptionPlans}.desc as desc`,
            `${tableNames.subscriptionPlans}.price`,
            `${tableNames.subscriptionPlans}.notes_free`,
        )
            .leftJoin(`${tableNames.user}`, `${tableNames.user}.id`, `${tableNames.subscriptions}.user_id`)
            .leftJoin(`${tableNames.media}`, `${tableNames.user}.pro_pic_id`, `${tableNames.media}.id`)
            .leftJoin(`${tableNames.subscriptionPlans}`, `${tableNames.subscriptionPlans}.id`, `${tableNames.subscriptions}.plan_id`)
            .where(`${tableNames.subscriptions}.id`, '=', req.params.id).first();

        let ValidFrom = subscription.valid_from.toLocaleDateString('en-GB');
        subscription.ValidFrom = ValidFrom;

        let ValidUpto = subscription.valid_upto.toLocaleDateString('en-GB');
        subscription.ValidUpto = ValidUpto;


        subscription = await subscription;
        if (subscription.pro_pic_id != null) {
            let img = await Media.query().where({ id: subscription.pro_pic_id }).first();
            subscription.pro_pic_url = encodeURI(CONSTANTS.BUCKET_URL + img.path)
        }

        return response(200, res, {
            message: "", data: {
                subscription: subscription,
            }
        });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.getPrice = async (req, res, next) => {
    try {
        const { id } = req.params;
        const price = await SubscriptionPlans.query().where(`${tableNames.subscriptionPlans}.id`, '=', id).first()
        return response(200, res, { message: "success", data: price })
    } catch (error) {
        return catchFailure(res, error)
    }
}

exports.storeSubscription = async (req, res, next) => {

    try {
        const { plan_id, user_id } = req.body;

        let planinfo = await SubscriptionPlans.query().where({
            id: plan_id,
        }).first();

        var endDate = new Date(); // Now
        endDate.setDate(endDate.getDate() + 30);
        console.log(endDate)

        let data = await Subscriptions.query().insert({
            user_id: user_id,
            total: planinfo.price,
            is_paid: true,
            status: 1,
            valid_from: new Date(),
            valid_upto: endDate,
            plan_id: plan_id,
        });
        let check = await SubscriptionPlans.query().where({
            id: plan_id
        }).first();
        let checkHrs = await User.query().where({
            id: data.user_id
        }).first();
        let finalHours = check.mentorship_hrs + checkHrs.hrs;
        await User.query().where({ id: data.user_id }).update({
            hrs: finalHours
        });
        return response(200, res, { message: "Subscription Updated", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}
