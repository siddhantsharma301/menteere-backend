const tableNames = require('../../database/tableNames');
const { response, catchFailure } = require('../Helpers/basics')
const Subscriptions = require('../Models/Subscriptions');
const NumberOfClicks = require('../Models/NumberOfClicks')
const User = require('../Models/User');
const Slots = require('../Models/Slots')
const { raw } = require('objection');
const Booking = require('../Models/Booking')

exports.getMyEarnings = async (req, res, next) => {
    try {
        const auth = await User.getUserByToken(req.headers.authorization);
        const { from, upto } = req.body;
        console.log("Id is " + auth.id);

        var totalRevenue = await Subscriptions.query()
            .sum(`total`)
            .where('created_at', '>=', new Date(from))
            .where('created_at', '<=', new Date(upto))
            .where('is_paid', '=', true);

        var endTotalRevenue = Math.round(totalRevenue[0].sum);
        var profitToDis = Math.round(endTotalRevenue * 0.65);

        var getNumOfClicks = await NumberOfClicks.query()
            .count('id as CNT')
            .where('created_at', '>=', new Date(from))
            .where('created_at', '<=', new Date(upto));
        var totalNumOfClicks = getNumOfClicks[0].CNT;

        var perClickProfit = Math.round(profitToDis / totalNumOfClicks);

        var getFinalClicks = await NumberOfClicks.query()
            .select(
                `${tableNames.numberOfClicks}.note_id as NoteID`,
                `${tableNames.notes}.title as noteTitle`,
                `${tableNames.numberOfClicks}.created_at as timeClicked`,
                `${tableNames.notes}.user_id as mentorID`,
                `${tableNames.user}.name as mentorName`,
            )
            .leftJoin(`${tableNames.notes}`, `${tableNames.numberOfClicks}.note_id`, `${tableNames.notes}.id`)
            .leftJoin(`${tableNames.user}`, `${tableNames.notes}.user_id`, `${tableNames.user}.id`)
            .where(`${tableNames.numberOfClicks}.created_at`, '>=', new Date(from))
            .where(`${tableNames.numberOfClicks}.created_at`, '<=', new Date(upto))
            .where(`${tableNames.user}.id`, '=', auth.id)

        var mainResponse = {};
        for (var i in getFinalClicks) {
            if (mainResponse.hasOwnProperty(getFinalClicks[i].mentorID)) {
                mainResponse[getFinalClicks[i].mentorID].ClickCount = mainResponse[getFinalClicks[i].mentorID].ClickCount + 1;
                mainResponse[getFinalClicks[i].mentorID].TotalProfit = perClickProfit * mainResponse[getFinalClicks[i].mentorID].ClickCount;
            } else {
                mainResponse[getFinalClicks[i].mentorID] = {
                    ClickCount: 1,
                    NoteId: getFinalClicks[i].NoteID,
                    NoteTitle: getFinalClicks[i].noteTitle,
                    MentorName: getFinalClicks[i].mentorName,
                    MentorID: getFinalClicks[i].mentorID,
                    TotalProfit: perClickProfit
                };
            }
        }

        return response(200, res, {
            message: "", data: {
                endTotalRevenue,
                profitToDis,
                perClickProfit,
                totalNumOfClicks,
                MentorRows: Object.values(mainResponse),
            }
        });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.getMyMentorshipEarnings = async (req, res, next) => {
    try {

        const auth = await User.getUserByToken(req.headers.authorization);
        const total = [];
        const user = await User.query().select(
            `${tableNames.user}.id`,
            `${tableNames.user}.name`,
            `${tableNames.user_verification_meta}.university as UniversityID`,
            `${tableNames.universities}.level`,
            `${tableNames.universities}.title as university`

        )
            .leftJoin(`${tableNames.user_verification_meta}`, `${tableNames.user}.id`, `${tableNames.user_verification_meta}.user_id`)
            .leftJoin(`${tableNames.universities}`, `${tableNames.user_verification_meta}.university`, `${tableNames.universities}.id`)
            .where(`${tableNames.user}.id`, '=', auth.id)

        for (var j = 0; j < user.length; j++) {

            const { from, upto } = req.body;
            let totalHrs = 0;
            const basePrice = 19;
            let totalPrice, finalAmt;
            let booking, usermentee;
            var totalHoursGiven = await Slots.query()
                .select(raw('slot_date, start_time, end_time, booking_id, (EXTRACT(EPOCH FROM end_time-start_time)/3600) as duration'))
                .where('created_at', '>=', new Date(from))
                .where('created_at', '<=', new Date(upto))
                .where(`${tableNames.slots}.user_id`, '=', user[j].id)
                .where(`${tableNames.slots}.booking_id`, '>', 0);

            if (totalHoursGiven[0] != undefined) {
                user[j].slotDate = totalHoursGiven[0].slot_date.toLocaleDateString('en-GB');
                user[j].slotStartTime = totalHoursGiven[0].start_time;
                user[j].slotEndTime = totalHoursGiven[0].end_time;


                for (var i = 0; i < totalHoursGiven.length; i++) {
                    totalHrs += totalHoursGiven[i].duration
                }

                for (var i = 0; i < totalHoursGiven.length; i++) {
                    booking = await Booking.query()
                        .select(`${tableNames.bookings}.user_id`)
                        .where(`${tableNames.bookings}.id`, '=', totalHoursGiven[i].booking_id)

                    usermentee = await User.query()
                        .select(`${tableNames.user}.name as takenBy`)
                        .where(`${tableNames.user}.id`, '=', booking[0].user_id)

                    user[j].menteeId = booking[0].user_id;
                    user[j].takenBy = usermentee[0].takenBy;
                }

                user[j].totalPrice = basePrice * totalHoursGiven[0].duration;

                if (user[j].level == 1) {
                    user[j].level = 'Top 5';
                    if (totalHrs > 15) {
                        user[j].percentToCut = 7.75;
                    } else if (totalHrs >= 5 && totalHrs <= 15) {
                        user[j].percentToCut = 8.50;
                    } else if (totalHrs < 5) {
                        user[j].percentToCut = 10.50;
                    }
                } else if (user[j].level == 2) {
                    user[j].level = 'Top 20';
                    if (totalHrs > 15) {
                        user[j].percentToCut = 8.75;
                    } else if (totalHrs >= 5 && totalHrs <= 15) {
                        user[j].percentToCut = 10.50;
                    } else if (totalHrs < 5) {
                        user[j].percentToCut = 11.50;
                    }
                } else if (user[j].level == 3) {
                    user[j].level = 'Top 40';
                    if (totalHrs > 15) {
                        user[j].percentToCut = 10.50;
                    } else if (totalHrs >= 5 && totalHrs <= 15) {
                        user[j].percentToCut = 11.50;
                    } else if (totalHrs < 5) {
                        user[j].percentToCut = 12.50;
                    }

                }

                if (user[j].totalPrice != undefined) {
                    totalPrice = user[j].totalPrice;
                    user[j].totalHrsGiven = totalHrs;
                    finalAmt = totalPrice * (100 - user[j].percentToCut) / 100;
                }
                user[j].finalAmount = finalAmt;

                if (user[j].totalHrsGiven > 0) {
                    total.push(user[j])
                    console.log("Total " + total)
                }

            }
            return response(200, res, {
                message: "", data: {
                    total
                }
            })

        }
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.getMyTotalEarnings = async (req, res, next) => {
    try {
        const auth = await User.getUserByToken(req.headers.authorization);
        const { from, upto } = req.body;

        var totalRevenue = await Subscriptions.query()
            .sum(`total`)
            .where('created_at', '>=', new Date(from))
            .where('created_at', '<=', new Date(upto))
            .where('is_paid', '=', true);

        var endTotalRevenue = Math.round(totalRevenue[0].sum);
        var profitToDis = Math.round(endTotalRevenue * 0.65);

        var getNumOfClicks = await NumberOfClicks.query()
            .count('id as CNT')
            .where('created_at', '>=', new Date(from))
            .where('created_at', '<=', new Date(upto));
        var totalNumOfClicks = getNumOfClicks[0].CNT;

        var perClickProfit = Math.round(profitToDis / totalNumOfClicks);

        var getFinalClicks = await NumberOfClicks.query()
            .select(
                `${tableNames.numberOfClicks}.note_id as NoteID`,
                `${tableNames.notes}.title as noteTitle`,
                `${tableNames.numberOfClicks}.created_at as timeClicked`,
                `${tableNames.notes}.user_id as mentorID`,
                `${tableNames.user}.name as mentorName`,
            )
            .leftJoin(`${tableNames.notes}`, `${tableNames.numberOfClicks}.note_id`, `${tableNames.notes}.id`)
            .leftJoin(`${tableNames.user}`, `${tableNames.notes}.user_id`, `${tableNames.user}.id`)
            .where(`${tableNames.numberOfClicks}.created_at`, '>=', new Date(from))
            .where(`${tableNames.numberOfClicks}.created_at`, '<=', new Date(upto))
            .where(`${tableNames.user}.id`, '=', auth.id)

        var mainResponse = {};
        for (var i in getFinalClicks) {
            if (mainResponse.hasOwnProperty(getFinalClicks[i].mentorID)) {
                mainResponse[getFinalClicks[i].mentorID].ClickCount = mainResponse[getFinalClicks[i].mentorID].ClickCount + 1;
                mainResponse[getFinalClicks[i].mentorID].TotalProfit = perClickProfit * mainResponse[getFinalClicks[i].mentorID].ClickCount;
            } else {
                mainResponse[getFinalClicks[i].mentorID] = {
                    ClickCount: 1,
                    NoteId: getFinalClicks[i].NoteID,
                    NoteTitle: getFinalClicks[i].noteTitle,
                    MentorName: getFinalClicks[i].mentorName,
                    MentorID: getFinalClicks[i].mentorID,
                    TotalProfit: perClickProfit
                };
            }
        }
        return response(200, res, {
            message: "", data: {
                endTotalRevenue,
                profitToDis,
                perClickProfit,
                totalNumOfClicks,
                MentorRows: Object.values(mainResponse),
            }
        });
    } catch (error) {
        return catchFailure(res, error);
    }
}