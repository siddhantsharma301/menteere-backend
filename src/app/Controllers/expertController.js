const moment = require('moment');
const axios = require('axios');
const CC = require('currency-converter-lt')
var sha512 = require('js-sha512');
const { response, catchFailure, CONSTANTS } = require('../Helpers/basics');
const errorMessages = require('../Helpers/errorMessages');

const User = require('../Models/User');
const Slots = require('../Models/Slots');
const Media = require('../Models/Media');
const BookingSlots = require('../Models/BookingSlots');
const Booking = require('../Models/Booking');

const tableNames = require('../../database/tableNames');
const Transaction = require('../Models/Transaction');
const MentorshipRatings = require('../Models/MentorshipRatings');

exports.getPaymentAccessToken = async (req, res, next) => {
    const data = req.data;

    await axios.post(`${process.env.EASEBUZZLINK}`, data, {
        headers: {
            'Content-Type': 'application/json',
        }
    })
        .then(resp => {
            return response(200, res, {
                message: "data", data: resp.data
            });
        })
        .catch(error => {
            console.log(error);
            return response(200, res, {
                message: "error", data: error
            });
        });
}

exports.submitBookingRequest = async (req, res, next) => {
    try {
        const { description, selected_curriculum, selected_subject, selectedSlotIDs } = req.body;
        const { id } = req.params;
        const auth = await User.getUserByToken(req.headers.authorization);

        var totalHrs = 0, totalAmount = 0, walletHrs = 0;

        var feePerHour = await User.query().where({ id: id }).first();
        if (feePerHour) {
            feePerHour = feePerHour.fee_per_hour;
        }

        var chkWallterHours = await User.query().where({ id: auth.id }).first();
        if (chkWallterHours) {
            walletHrs = chkWallterHours.hrs;
        }

        var selectedSlots = selectedSlotIDs.split(',');
        for (var i in selectedSlots) {
            var SlotInfo = await Slots.query().where({ id: parseInt(selectedSlots[i]) }).first();
            if (SlotInfo) {
                if (SlotInfo.is_booked) throw new Error(errorMessages.slotAlreadyBooked);
                var timeStart = new Date(SlotInfo.start_time);
                var timeEnd = new Date(SlotInfo.end_time);
                var hourDiff = (((timeEnd - timeStart) / 1000) / 60) / 60;


                if (hourDiff < 0) {
                    hourDiff = 24 + hourDiff;
                }
                totalHrs = totalHrs + hourDiff;
            }
        }


        var is_paid = false;
        if (walletHrs >= totalHrs) {
            totalAmount = 0;
            is_paid = true;
        } else {
            totalAmount = (totalHrs - walletHrs) * feePerHour;
        }

        const data = await Booking.query().insert({
            user_id: auth.id,
            is_paid: is_paid,
            selected_curriculum,
            selected_subject,
            description,
            total: totalAmount,
            hrs_used: totalHrs,
        });

        for (var i in selectedSlots) {
            var SlotInfo = await Slots.query().where({ id: parseInt(selectedSlots[i]) }).first();
            if (SlotInfo) {
                await BookingSlots.query().insert({
                    slot_id: SlotInfo.id,
                    booking_id: data.id,
                });
                if (is_paid) {
                    await Slots.query().where({ id: SlotInfo.id }).update({
                        is_booked: true,
                        booking_id: data.id,
                    });
                }
            }
        }

        var haveToPay = true;
        if (is_paid) {
            haveToPay = false;
        }

        let easeBuzzData = null;
        let convertedPrice = 0;
        if (totalAmount > 0) {
            let currencyConverter = new CC({ from: "USD", to: "INR", amount: totalAmount })
            convertedPrice = await currencyConverter.convert();
        }

        if (haveToPay) {
            let user = await User.query().where({ id: auth.id }).first();
            var easebuzzKey = process.env.EASEBUZZ_KEY;
            var saltKey = process.env.EASEBUZZ_SALT;
            let productinfo = "Menteere Expert Booking";
            let phone = "9501736242";
            const hashString = easebuzzKey + "|booking_" + data.id + "|" + convertedPrice + "|" + productinfo + "|" + user.name + "|" + user.email + "|" + "" + "|" + "" + "|" + "" + "|" + "" + "|" + "" + "|" + "" + "|" + "" + "|" + "" + "|" + "" + "|" + "" + "|" + saltKey;
            const hash = sha512.sha512(hashString)
            console.log('hash--', hashString);
            var FormData = require('form-data');
            var form = new FormData();
            form.append('key', easebuzzKey);
            form.append('txnid', `booking_${data.id}`);
            form.append('amount', convertedPrice);
            form.append('productinfo', productinfo);
            form.append('firstname', user.name);
            form.append('phone', phone);
            form.append('email', user.email);
            form.append('surl', "https://docs.easebuzz.in/code-response/success");
            form.append('furl', "https://docs.easebuzz.in/code-response/success");
            form.append('hash', hash);

            const fetch = require('node-fetch');
            easeBuzzData = await fetch(`${process.env.EASEBUZZLINK}`, { method: 'POST', body: form })
                .then(function (res) {
                    console.log(res);
                    return res.json();
                }).then(function (json) {
                    return json;
                })
                .catch(function (error) {
                    console.log(error);
                });
        }

        return response(200, res, {
            message: "You are on slot page", data: {
                bookingID: data.id,
                amountToBePaid: data.total,
                haveToPay,
                easeBuzzAccessKey: easeBuzzData,
            }
        });
    } catch (error) {
        return catchFailure(res, error);
    }
}



exports.completeBookingPayment = async (req, res, next) => {
    try {
        const { amount, txn_id, gateway_response, is_paid } = req.body;
        const { id } = req.params;
        const auth = await User.getUserByToken(req.headers.authorization);

        var pay_status = 0;
        if (is_paid) {
            pay_status = 1;
        }

        const transaction = await Transaction.query().insert({
            txn_id,
            amount,
            pay_gateway: 'EASEBUZZ',
            pay_status: pay_status,
            gateway_response
        });

        const data = await Booking.query().where({
            id: id
        }).update({
            is_paid: is_paid,
            txn_id: transaction.id
        });

        var BookedSlots = await BookingSlots.query().where({
            booking_id: id
        });




        for (var i in BookedSlots) {
            var slot_id = BookedSlots[i].slot_id;
            await Slots.query().where({
                id: slot_id
            }).update({
                is_booked: is_paid,
                booking_id: id
            });
        }

        var slotsDetails = await Slots.query().where({
            booking_id: id
        }).first();

        let menteere = await User.query().where({ id: slotsDetails.user_id }).first();

        var user = await User.query().where({
            id: auth.id
        }).first();

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
                "Template": "MentorshipSubscriptionTemplate",
                "Destination": {
                    "ToAddresses": [user.email, menteere.email]
                },
                "TemplateData": "{ \"mentee\":\"" + user.name + "\", \"menteere\":\"" + menteere.name + "\", \"slotDate\":\"" + slotsDetails.slot_date + "\", \"startTime\":\"" + slotsDetails.start_time + "\", \"endTime\":\"" + slotsDetails.end_time + "\", \"txn_id\": \"" + txn_id + "\", \"amount\": \"" + amount + "\" }"
            }

            ses.sendTemplatedEmail(params, (err, data) => {
                if (err) {
                    console.log(err, err.stack);
                }
                else {
                    console.log(data);
                }
            });
        }

        return response(200, res, { message: "Successfully Subscribed", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.submitRating = async (req, res, next) => {
    try {
        const auth = await User.getUserByToken(req.headers.authorization);
        const { id } = req.params;
        let { area_1, area_2, area_3, area_4, area_5, review } = req.body;

        if (area_1 == undefined || area_1 == null) {
            area_1 = 0;
        }
        if (area_2 == undefined || area_2 == null) {
            area_2 = 0;
        }
        if (area_3 == undefined || area_3 == null) {
            area_3 = 0;
        }
        if (area_4 == undefined || area_4 == null) {
            area_4 = 0;
        }
        if (area_5 == undefined || area_5 == null) {
            area_5 = 0;
        }

        const SlotInfo = await Slots.query().where({
            id: id
        }).first();
        if (SlotInfo) {
            const rating = await MentorshipRatings.query().insert({
                rating_area_1: area_1,
                rating_area_2: area_2,
                rating_area_3: area_3,
                rating_area_4: area_4,
                rating_area_5: area_5,
                review: review,
                user_id: auth.id,
                mentor_id: SlotInfo.user_id,
                slot_id: id,
            });

            var finalRate = area_1 + area_2 + area_3 + area_4 + area_5;
            finalRate = Math.round(finalRate / 5);

            await Booking.query().where({
                id: SlotInfo.booking_id
            }).update({
                has_rated: true,
                rating: finalRate
            });

            await Slots.query().where({
                id: SlotInfo.id
            }).update({
                has_rated: true,
                rating: finalRate
            });

            this.updateMentorRating(SlotInfo.user_id);
        }

        return response(200, res, { message: "", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.updateMentorRating = async (id) => {
    const ratings = await Slots.query().select('rating').where({
        user_id: id,
        is_booked: true,
        has_rated: true
    });
    var TotalRate = 0;
    for (var i in ratings) {
        TotalRate = parseInt(TotalRate) + parseInt(ratings[i].rating);
    }
    TotalRate = Math.round(parseInt(TotalRate) / 5);
    await User.query().where({
        id: id
    }).update({
        rating: TotalRate
    });
}

exports.myMeetings = async (req, res, next) => {
    try {
        const auth = await User.getUserByToken(req.headers.authorization);

        var completedMeetings = [];
        var upcomingMeetings = [];
        var data = await Slots.query()
            .select(
                `${tableNames.slots}.id as SlotID`,
                `${tableNames.slots}.approval_status as SlotStatus`,
                `${tableNames.slots}.booking_id as BookingID`,
                `${tableNames.slots}.slot_date as SlotDate`,
                `${tableNames.slots}.start_time as StartTime`,
                `${tableNames.slots}.dialogue_id as DialogueId`,
                `${tableNames.slots}.end_time as EndTime`,
                `${tableNames.user}.name as UserName`,
                `${tableNames.user}.id as UserID`,
                `${tableNames.user}.pro_pic_id as UserImageID`,
                `${tableNames.user}.quickblox_id as UserQuickBloxID`,
                `${tableNames.bookings}.selected_curriculum as SelectedCurriculum`,
                `${tableNames.bookings}.selected_subject as SelectedSubject`,
                `${tableNames.bookings}.description as ShortNote`,
                `${tableNames.bookings}.total as AmountPaid`,
                `${tableNames.bookings}.has_rated as HasRated`,
                `${tableNames.bookings}.rating as Rating`,
            )
            .leftJoin(`${tableNames.bookingSlots}`, `${tableNames.bookingSlots}.slot_id`, `=`, `${tableNames.slots}.id`)
            .leftJoin(`${tableNames.bookings}`, `${tableNames.bookingSlots}.booking_id`, `=`, `${tableNames.bookings}.id`)
            .leftJoin(`${tableNames.user}`, `${tableNames.slots}.user_id`, `=`, `${tableNames.user}.id`)
            .where(`${tableNames.bookings}.is_paid`, `=`, true)
            .where(`${tableNames.bookings}.user_id`, `=`, auth.id)
            .orderBy(`${tableNames.slots}.id`, `desc`);

        for (var i in data) {
            data[i].UserImageURL = CONSTANTS.BUCKET_URL + 'useralpha/' + (data[i].UserName[0]).toLowerCase() + '.jpeg';
            if (data[i].UserImageID != null) {
                let MediaData = await Media.query().where({ id: data[i].UserImageID }).first();
                if (MediaData != '') {
                    data[i].UserImageURL = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + MediaData.path);
                }
            }
            let currDate = new Date();

            data[i].isCompleted = false;
            var slotDate = new Date(data[i].SlotDate);
            var slotEndDate = new Date(data[i].EndTime);
            let min1 = currDate.getTime() / 1000;
            let min2 = slotEndDate.getTime() / 1000;
            let diff = min2 - min1;
            let minuteDifferenc = Math.floor(diff / 60) + ":" + Math.floor(diff % 60 ? diff % 60 : '00');

            data[i].timeDiffMin = minuteDifferenc;

            data[i].checkData = Date.parse(data[i].EndTime) < Date.parse(new Date()) && data[i].SlotStatus != 0;
            if (Date.parse(data[i].EndTime) < Date.parse(new Date()) && data[i].SlotStatus != 0) {
                data[i].isCompleted = true;
                completedMeetings.push(data[i]);
            } else if (Date.parse(data[i].EndTime) < Date.parse(new Date()) && data[i].SlotStatus == 0) {
                data[i].isCompleted = true;
                completedMeetings.push(data[i]);
            }
            else {
                upcomingMeetings.push(data[i]);
            }

        }

        return response(200, res, {
            message: "", data: {
                completedMeetings, upcomingMeetings
            }
        });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.getMyRatings = async (req, res, next) => {
    try {
        const auth = await User.getUserByToken(req.headers.authorization);
        var data = await MentorshipRatings.query()
            .select(
                `${tableNames.mentorshipRatings}.id as RatingID`,
                `${tableNames.mentorshipRatings}.rating_area_1 as Rating1`,
                `${tableNames.mentorshipRatings}.rating_area_2 as Rating2`,
                `${tableNames.mentorshipRatings}.rating_area_3 as Rating3`,
                `${tableNames.mentorshipRatings}.rating_area_4 as Rating4`,
                `${tableNames.mentorshipRatings}.rating_area_5 as Rating5`,
                `${tableNames.mentorshipRatings}.created_at as ReviewDate`,
                `${tableNames.mentorshipRatings}.review as UserReview`,
                `${tableNames.user}.name as UserName`,
                `${tableNames.media}.path as UserProfilePicURL`
            )
            .leftJoin(`${tableNames.user}`, `${tableNames.user}.id`, `${tableNames.mentorshipRatings}.user_id`)
            .leftJoin(`${tableNames.media}`, `${tableNames.user}.pro_pic_id`, `${tableNames.media}.id`)
            .where(`${tableNames.mentorshipRatings}.mentor_id`, `=`, auth.id);

        var Area1 = 0, Area2 = 0, Area3 = 0, Area5 = 0, Area4 = 0;
        for (var i in data) {
            Area1 = parseInt(Area1) + parseInt(data[i].Rating1);
            Area2 = parseInt(Area2) + parseInt(data[i].Rating2);
            Area3 = parseInt(Area3) + parseInt(data[i].Rating3);
            Area4 = parseInt(Area4) + parseInt(data[i].Rating4);
            Area5 = parseInt(Area5) + parseInt(data[i].Rating5);

            if (data[i].UserProfilePicURL == null) {
                data[i].UserProfilePicURL = CONSTANTS.BUCKET_URL + 'useraplha/' + (data[i].UserName[0]).toLowerCase() + '.jpeg';
            } else {
                data[i].UserProfilePicURL = CONSTANTS.BUCKET_URL + data[i].UserProfilePicURL;
            }
        }

        let length = data.length;
        Area1 = Math.round(Area1 / length);
        Area2 = Math.round(Area2 / length);
        Area3 = Math.round(Area3 / length);
        Area4 = Math.round(Area4 / length);
        Area5 = Math.round(Area5 / length);

        return response(200, res, {
            message: "", data: {
                skillRatings: { Area1, Area2, Area3, Area4, Area5 },
                list: data
            }
        });
    } catch (error) {
        return catchFailure(res, error);
    }
}


