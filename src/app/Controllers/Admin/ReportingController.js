const tableNames = require('../../../database/tableNames');
const { response, catchFailure } = require('../../Helpers/basics');
const NumberOfClicks = require('../../Models/NumberOfClicks');
const Slots = require('../../Models/Slots');
const Subscriptions = require('../../Models/Subscriptions');
const MentorshipRatings = require('../../Models/MentorshipRatings');
const User = require('../../Models/User')
const UserVerification = require('../../Models/UserVerification')
const { raw } = require('objection');
const Booking = require('../../Models/Booking')
const UserTransactions = require('../../Models/UserTransactions')


function monthDiff(d1, d2) {
    var months = [];
    months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth();
    months += d2.getMonth();
    return months <= 0 ? 0 : months;
}

async function getMentorshipEarningBreakup(from, upto, userID) {
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
        .where(`${tableNames.user}.id`, '=', userID).first();

    var MainResponse = {
        totalHrs: 0,
        totalEarning: 0,
        breakup: []
    };

    var data = await MentorshipRatings.query()
        .select(
            `${tableNames.mentorshipRatings}.rating_area_1 as Rating1`,
            `${tableNames.mentorshipRatings}.rating_area_2 as Rating2`,
            `${tableNames.mentorshipRatings}.rating_area_3 as Rating3`,
            `${tableNames.mentorshipRatings}.rating_area_4 as Rating4`,
            `${tableNames.mentorshipRatings}.rating_area_5 as Rating5`,
            `${tableNames.mentorshipRatings}.created_at as ReviewDate`,
            `${tableNames.mentorshipRatings}.review as UserReview`,
        )
        .where(`${tableNames.mentorshipRatings}.mentor_id`, `=`, userID);

    var Area1 = 0, Area2 = 0, Area3 = 0, Area5 = 0, Area4 = 0;
    for (var i in data) {
        Area1 = parseInt(Area1) + parseInt(data[i].Rating1);
        Area2 = parseInt(Area2) + parseInt(data[i].Rating2);
        Area3 = parseInt(Area3) + parseInt(data[i].Rating3);
        Area4 = parseInt(Area4) + parseInt(data[i].Rating4);
        Area5 = parseInt(Area5) + parseInt(data[i].Rating5);

    }

    let length = data.length;
    Area1 = Math.round(Area1 / length);
    Area2 = Math.round(Area2 / length);
    Area3 = Math.round(Area3 / length);
    Area4 = Math.round(Area4 / length);
    Area5 = Math.round(Area5 / length);

    let finalRating = Math.round((Area1 + Area2 + Area3 + Area4 + Area5) / 5);
    console.log(finalRating);

    var perCentageToCut = 0;
    if (user.level == 1) {
        user.level = 'Top 5';
        if (MainResponse.totalHrs > 15 && finalRating >= 4.5) {
            perCentageToCut = 7.75;
        } else if (MainResponse.totalHrs > 15 && finalRating < 4.5) {
            perCentageToCut = 8.50;
        } else if (MainResponse.totalHrs >= 5 && MainResponse.totalHrs <= 15) {
            perCentageToCut = 8.50;
        } else if (MainResponse.totalHrs < 5) {
            perCentageToCut = 10.50;
        }
    }
    else if (user.level == 2) {
        user.level = 'Top 20';
        if (MainResponse.totalHrs > 15 && finalRating >= 4.5) {
            perCentageToCut = 8.75;
        } else if (MainResponse.totalHrs > 15 && finalRating < 4.5) {
            perCentageToCut = 10.50;
        } else if (MainResponse.totalHrs >= 5 && MainResponse.totalHrs <= 15) {
            perCentageToCut = 10.50;
        } else if (MainResponse.totalHrs < 5) {
            perCentageToCut = 11.50;
        }
    }
    else if (user.level == 3) {
        user.level = 'Top 40';
        if (MainResponse.totalHrs > 15 && finalRating >= 4.5) {
            perCentageToCut = 10.50;
        } else if (MainResponse.totalHrs > 15 && finalRating < 4.5) {
            perCentageToCut = 11.50;
        } else if (MainResponse.totalHrs >= 5 && MainResponse.totalHrs <= 15) {
            perCentageToCut = 11.50;
        } else if (MainResponse.totalHrs < 5) {
            perCentageToCut = 12.50;
        }
    }

    let totalHrs = 0;
    const basePrice = 19;
    let totalPrice, finalAmt;
    let booking, usermentee;
    var UserSlots = await Slots.query()
        .select(raw(`${tableNames.slots}.id as SlotID, ${tableNames.slots}.slot_date as SlotDate, ${tableNames.slots}.start_time as StartTime, ${tableNames.slots}.end_time as EndTime, ${tableNames.slots}.booking_id, (EXTRACT(EPOCH FROM ${tableNames.slots}.end_time-${tableNames.slots}.start_time)/3600) as Slotduration, ${tableNames.bookings}.user_id as MenteeID, ${tableNames.user}.name as MenteeName`))
        .leftJoin(`${tableNames.bookings}`, `${tableNames.bookings}.id`, `${tableNames.slots}.booking_id`)
        .leftJoin(`${tableNames.user}`, `${tableNames.bookings}.user_id`, `${tableNames.user}.id`)
        .where('slot_date', '>=', new Date(from))
        .where('slot_date', '<=', new Date(upto))
        .where(`${tableNames.slots}.user_id`, '=', userID)
        .where(`${tableNames.slots}.approval_status`, '=', 1)
        .where(`${tableNames.slots}.booking_id`, '>', 0);

    for (var i in UserSlots) {
        let absoluteEarning = basePrice * UserSlots[i].slotduration;
        absoluteEarning = absoluteEarning - (absoluteEarning * perCentageToCut / 100);
        MainResponse.breakup.push({
            SlotDate: UserSlots[i].slotdate,
            SlotID: UserSlots[i].slotid,
            StartTime: UserSlots[i].starttime,
            EndTime: UserSlots[i].endtime,
            Slotduration: UserSlots[i].slotduration,
            MenteeID: UserSlots[i].menteeid,
            MenteeName: UserSlots[i].menteename,
            absoluteEarning: absoluteEarning,
        });
        MainResponse.totalHrs += UserSlots[i].slotduration;
    }
    MainResponse.totalEarning = MainResponse.totalHrs * basePrice;
    MainResponse.totalEarning = MainResponse.totalEarning - (MainResponse.totalEarning * perCentageToCut / 100);

    return MainResponse;
}

async function getNotesProfitByUserID(from, upto, userID) {
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
        .where(`${tableNames.user}.id`, '=', userID);

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

    var amountoReturn = 0;
    Object.values(mainResponse).map((item) => {
        amountoReturn = amountoReturn + item.TotalProfit;
    });
    return amountoReturn;
}


exports.getNotesStats = async (req, res, next) => {
    try {
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
                `${tableNames.numberOfClicks}.created_at as timeClicked`,
                `${tableNames.notes}.user_id as mentorID`,
                `${tableNames.user}.name as mentorName`,
            )
            .leftJoin(`${tableNames.notes}`, `${tableNames.numberOfClicks}.note_id`, `${tableNames.notes}.id`)
            .leftJoin(`${tableNames.user}`, `${tableNames.notes}.user_id`, `${tableNames.user}.id`)
            .where(`${tableNames.numberOfClicks}.created_at`, '>=', new Date(from))
            .where(`${tableNames.numberOfClicks}.created_at`, '<=', new Date(upto));

        var mainResponse = {};
        for (var i in getFinalClicks) {
            if (mainResponse.hasOwnProperty(getFinalClicks[i].mentorID)) {
                mainResponse[getFinalClicks[i].mentorID].ClickCount = mainResponse[getFinalClicks[i].mentorID].ClickCount + 1;
                mainResponse[getFinalClicks[i].mentorID].TotalProfit = perClickProfit * mainResponse[getFinalClicks[i].mentorID].ClickCount;
            } else {
                mainResponse[getFinalClicks[i].mentorID] = {
                    ClickCount: 1,
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

exports.getMentorshipStats = async (req, res, next) => {
    try { 
        const { user_id } = req.body;
        var responses = [];
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const user = await User.query().select(
            `${tableNames.user}.id`,
            `${tableNames.user}.name`,
            `${tableNames.user}.created_at`,
            `${tableNames.user_verification_meta}.university as UniversityID`,
            `${tableNames.universities}.level`,
            `${tableNames.universities}.title as university`
        )
            .leftJoin(`${tableNames.user_verification_meta}`, `${tableNames.user}.id`, `${tableNames.user_verification_meta}.user_id`)
            .leftJoin(`${tableNames.universities}`, `${tableNames.user_verification_meta}.university`, `${tableNames.universities}.id`)
            .where(`${tableNames.user}.id`, '=', user_id).first();

        const from = user.created_at;
        const till = new Date();
        const fromYear = from.getYear() + 1900;
        let months = monthDiff(from, till);
        var k = from.getMonth();
        let endDate, firstDate;
        for (var m = k; m <= (months + k); m++) {
            firstDate = fromYear + '-' + (m + 1) + '-' + '01';
            endDate = new Date(fromYear, m + 1, 1);

            //let mentorshipProfit = await getMentorshipProfitByUserID(firstDate, endDate, user.id);
            let notesProfit = await getNotesProfitByUserID(firstDate, endDate, user.id);
            let mentorshipEarningBreakup = await getMentorshipEarningBreakup(firstDate, endDate, user.id);
            let mentorshipProfit = mentorshipEarningBreakup.totalEarning;
            // let notesProfit = [];

            responses.push({
                date: endDate,
                startDate: firstDate,
                endDate: endDate,
                totalProfit: mentorshipProfit + notesProfit,
                desc: monthNames[new Date(firstDate).getMonth()] + ' | Earning',
                type: 'earning'
            });

        }

        const transactions = await UserTransactions.query().where({
            user_id: user.id,
            pay_status: 1
        });
        for (var i in transactions) {
            responses.push({
                date: transactions[i].created_at,
                endDate: transactions[i].created_at,
                startDate: transactions[i].created_at,
                totalProfit: transactions[i].amount_paid,
                desc: transactions[i].description,
                type: 'payout'
            });
        }

        responses.sort(function (a, b) {
            return new Date(a.date) - new Date(b.date);
        });

        var curBalance = 0;
        responses = responses.map((item) => {
            if (item.type == "earning") {
                item.curBalance = curBalance + item.totalProfit;
                curBalance = item.curBalance;
            } else {
                item.curBalance = curBalance - item.totalProfit;
                curBalance = item.curBalance;
            }
            return item;
        });

        responses.sort(function (a, b) {
            return new Date(b.date) - new Date(a.date);
        });

        return response(200, res, {
            message: "", data: responses
        });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.getMentorshipStatstics = async (req, res, next) => {
    try {
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



        for (var j = 0; j < user.length; j++) {

            const { from, upto } = req.body;
            let totalHrs = 0;
            const basePrice = 19;
            let totalPrice, finalAmt;
            let percentToCut = 0;
            let booking, usermentee;
            var totalHoursGiven = await Slots.query()
                .select(raw('start_time, end_time, booking_id, (EXTRACT(EPOCH FROM end_time-start_time)/3600) as duration'))
                .where('slot_date', '>=', new Date(from))
                .where('slot_date', '<=', new Date(upto))
                .where(`${tableNames.slots}.user_id`, '=', user[j].id)
                .where(`${tableNames.slots}.booking_id`, '>', 0)
                .where(`${tableNames.slots}.approval_status`, '=', 1);



            for (var i = 0; i < totalHoursGiven.length; i++) {
                totalHrs += totalHoursGiven[i].duration
            }


            for (var i = 0; i < totalHoursGiven.length; i++) {
                booking = await Booking.query()
                    .select(`${tableNames.bookings}.user_id`)
                    .where(`${tableNames.bookings}.id`, '=', totalHoursGiven[i].booking_id)

                console.log(JSON.stringify(booking[0].user_id));

                usermentee = await User.query()
                    .select(`${tableNames.user}.name as takenBy`)
                    .where(`${tableNames.user}.id`, '=', booking[0].user_id)


                user[j].takenBy = usermentee[0].takenBy;
            }




            if (totalHoursGiven != null) {
                if (totalHoursGiven.length > 0) {
                    user[j].totalPrice = basePrice * totalHrs;

                }
            }

            var data = await MentorshipRatings.query()
                .select(
                    `${tableNames.mentorshipRatings}.rating_area_1 as Rating1`,
                    `${tableNames.mentorshipRatings}.rating_area_2 as Rating2`,
                    `${tableNames.mentorshipRatings}.rating_area_3 as Rating3`,
                    `${tableNames.mentorshipRatings}.rating_area_4 as Rating4`,
                    `${tableNames.mentorshipRatings}.rating_area_5 as Rating5`,
                    `${tableNames.mentorshipRatings}.created_at as ReviewDate`,
                    `${tableNames.mentorshipRatings}.review as UserReview`,
                )
                .where(`${tableNames.mentorshipRatings}.mentor_id`, `=`, user[j].id);

            var Area1 = 0, Area2 = 0, Area3 = 0, Area5 = 0, Area4 = 0;
            for (var i in data) {
                Area1 = parseInt(Area1) + parseInt(data[i].Rating1);
                Area2 = parseInt(Area2) + parseInt(data[i].Rating2);
                Area3 = parseInt(Area3) + parseInt(data[i].Rating3);
                Area4 = parseInt(Area4) + parseInt(data[i].Rating4);
                Area5 = parseInt(Area5) + parseInt(data[i].Rating5);

            }

            let length = data.length;
            Area1 = Math.round(Area1 / length);
            Area2 = Math.round(Area2 / length);
            Area3 = Math.round(Area3 / length);
            Area4 = Math.round(Area4 / length);
            Area5 = Math.round(Area5 / length);

            let finalRating = Math.round((Area1 + Area2 + Area3 + Area4 + Area5) / 5);
            console.log(finalRating);




            if (user[j].level == 1) {
                user[j].level = 'Top 5';
                if (totalHrs > 15 && finalRating >= 4.5) {
                    user[j].percentToCut = 7.75;
                } else if (totalHrs > 15 && finalRating < 4.5) {
                    perCentageToCut = 8.50;
                } else if (totalHrs >= 5 && totalHrs <= 15) {
                    user[j].percentToCut = 8.50;
                } else if (totalHrs < 5) {
                    user[j].percentToCut = 10.50;
                }
            }
            else if (user[j].level == 2) {
                user[j].level = 'Top 20';
                if (totalHrs > 15 && finalRating >= 4.5) {
                    user[j].percentToCut = 8.75;
                } else if (totalHrs > 15 && finalRating < 4.5) {
                    perCentageToCut = 10.50;
                } else if (totalHrs >= 5 && totalHrs <= 15) {
                    user[j].percentToCut = 10.50;
                } else if (totalHrs < 5) {
                    user[j].percentToCut = 11.50;
                }
            }
            else if (user[j].level == 3) {
                user[j].level = 'Top 40';
                if (totalHrs > 15 && finalRating >= 4.5) {
                    user[j].percentToCut = 10.50;
                } else if (totalHrs > 15 && finalRating < 4.5) {
                    perCentageToCut = 11.50;
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


    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.getEarningBreakup = async (req, res, next) => {
    try {
        const { startDate, endDate, user_id } = req.body;
        console.log(user_id);
        // const auth = await User.getUserByToken(req.headers.authorization);

        let notesProfit = await getNotesProfitByUserID(startDate, endDate, user_id);
        let notesProfitBreakup = await getNotesEarningBreakup(startDate, endDate, user_id);
        let mentorshipEarningBreakup = await getMentorshipEarningBreakup(startDate, endDate, user_id);
        let mentorshipProfit = mentorshipEarningBreakup.totalEarning;

        var responses = {
            mentorshipProfit,
            notesProfit,
            totalProfit: mentorshipProfit + notesProfit,
            notesProfitBreakup,
            mentorshipEarningBreakup
        };

        return response(200, res, {
            message: "", data: responses
        });
    } catch (error) {
        return catchFailure(res, error);
    }
}


async function getNotesEarningBreakup(from, upto, userID) {

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
        .where(`${tableNames.user}.id`, '=', userID)

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

    return {
        endTotalRevenue,
        profitToDis,
        perClickProfit,
        totalNumOfClicks,
        MentorRows: Object.values(mainResponse),
    }
}