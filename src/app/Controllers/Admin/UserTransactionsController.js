const { response, catchFailure } = require('../../Helpers/basics');
const User = require('../../Models/User');
const errorMessages = require('../../Helpers/adminErrorMessages');
const bcrypt = require('bcrypt');
const UserTransactions = require('../../Models/UserTransactions');
const tableNames = require('../../../database/tableNames');

exports.store = async (req, res, next) => {
    try {
        const { user_id, amount_paid, transaction_id, mode_of_payment, description, pay_status } = req.body;
        await UserTransactions.query().insert({
            user_id,
            amount_paid,
            transaction_id,
            mode_of_payment,
            description,
            pay_status
        });
        return response(200, res, { message: "Transaction Successfully Added", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.update = async (req, res, next) => {
    try {
        const { user_id, amount_paid, transaction_id, mode_of_payment, description, pay_status } = req.body;
        const { id } = req.params;

        await UserTransactions.query().where({ id: id }).update({
            user_id,
            amount_paid,
            transaction_id,
            mode_of_payment,
            description,
            pay_status
        });

        return response(200, res, { message: "Transaction successfully updated", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.delete = async (req, res, next) => {
    try {
        const { id } = req.params;
        await UserTransactions.query().deleteById(id);
        return response(200, res, { message: "Transaction successfully deleted", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.edit = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = await UserTransactions.query().where({ id: id }).first();

        return response(200, res, { message: "", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.fetch = async (req, res, next) => {
    const columns = [
        'id',
        'user_id',
        'user_name',
        'amount_paid',
        'transaction_id',
        'mode_of_payment',
        'pay_status',
        'description',
        'options'
    ];

    const limit = req.body.length;
    const start = req.body.start;
    const ordercolumn = req.body['order[0][column]'];
    const order = columns[ordercolumn];

    const dir = req.body['order[0][dir]'];
    let totalData = await UserTransactions.query().count();
    totalData = totalData[0].count;


    let posts = [];
    let totalFiltered = 0;
    let search = '';

    posts = await UserTransactions.query()
        .select(
            `${tableNames.user_transactions}.id`,
            `${tableNames.user_transactions}.user_id`,
            `${tableNames.user_transactions}.amount_paid`,
            `${tableNames.user_transactions}.transaction_id`,
            `${tableNames.user_transactions}.mode_of_payment`,
            `${tableNames.user_transactions}.description`,
            `${tableNames.user_transactions}.pay_status`,
            `${tableNames.user_transactions}.created_at`,
            `${tableNames.user}.name as user_name`,
        )
        .leftJoin(`${tableNames.user}`, `${tableNames.user}.id`, `${tableNames.user_transactions}.user_id`)
        .offset(start)
        .limit(limit)
        .orderBy(order, dir);

    totalFiltered = totalData;

    let data = [];
    if (posts.length > 0) {
        for (var item in posts) {
            let nestedData = {};

            'user_id',
                'user_name',
                'amount_paid',
                'transaction_id',
                'mode_of_payment',
                'pay_status',
                'description',
                'options'

            nestedData.id = posts[item].id;
            nestedData.user_id = posts[item].user_id;
            nestedData.user_name = posts[item].user_name;
            nestedData.amount_paid = posts[item].amount_paid;
            nestedData.transaction_id = posts[item].transaction_id;
            nestedData.mode_of_payment = posts[item].mode_of_payment;
            nestedData.pay_status = posts[item].pay_status == 1 ? 'Paid' : 'Pending';
            nestedData.description = posts[item].description;
            nestedData.options = posts[item].id;

            data.push(nestedData);
        };
    }

    return res.status(200).json({
        draw: parseInt(req.body['draw']),
        recordsTotal: parseInt(totalData),
        recordsFiltered: parseInt(totalFiltered),
        data: data,
        search: search
    });
}