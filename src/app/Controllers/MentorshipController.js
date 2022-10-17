const fetch = require('node-fetch');
const ffmpeg = require('fluent-ffmpeg');
var cron = require("node-cron");
const { response, catchFailure, CONSTANTS } = require('../Helpers/basics');
const User = require('../Models/User');
const VideoRecording = require('../Models/VideoRecording');
const tableNames = require('../../database/tableNames');
const Slots = require('../Models/Slots');
const Booking = require('../Models/Booking');

exports.getMyMentorshipList = async (req, res, next) => {
    try {
        const auth = await User.getUserByToken(req.headers.authorization);
        var completedMeetings = [];
        var upcomingMeetings = [];
        const data = await Slots.query()
            .select(
                `${tableNames.slots}.id as SlotID`,
                `${tableNames.slots}.slot_date as SlotDate`,
                `${tableNames.slots}.start_time as SlotStartTime`,
                `${tableNames.slots}.end_time as SlotEndTime`,
                `${tableNames.slots}.approval_status as SlotApprovalStatus`,
                `${tableNames.slots}.dialogue_id as DialogueId`,
                `${tableNames.bookings}.selected_curriculum as UserCurriculum`,
                `${tableNames.bookings}.selected_subject as UserSubject`,
                `${tableNames.bookings}.description as UserShortDescription`,
                `${tableNames.bookings}.has_rated as HasUserRated`,
                `${tableNames.bookings}.rating as SlotRating`,
                `${tableNames.user}.name as UserNiceName`,
                `${tableNames.user}.id as UserID`,
                `${tableNames.user}.quickblox_id as UserQuickBloxID`,
                `${tableNames.media}.path as UserProfilePicURL`,
                `${tableNames.transactions}.pay_status as PayStatus`,
            )
            .leftJoin(`${tableNames.bookings}`, `${tableNames.slots}.booking_id`, `${tableNames.bookings}.id`)
            .leftJoin(`${tableNames.user}`, `${tableNames.bookings}.user_id`, `${tableNames.user}.id`)
            .leftJoin(`${tableNames.media}`, `${tableNames.media}.id`, `${tableNames.user}.pro_pic_id`)
            .leftJoin(`${tableNames.transactions}`, `${tableNames.transactions}.id`, `${tableNames.bookings}.txn_id`)
            .where(`${tableNames.slots}.user_id`, `=`, auth.id)
            .where(`${tableNames.transactions}.pay_status`, `=`, 1)
            .whereNotNull(`${tableNames.slots}.booking_id`)
            .orderBy(`${tableNames.slots}.id`, `DESC`);

        for (var i in data) {
            if (data[i].UserProfilePicURL == null) {
                if (data[i].UserNiceName != null) {
                    data[i].UserProfilePicURL = CONSTANTS.BUCKET_URL + 'useraplha/' + (data[i].UserNiceName).toLowerCase() + '.jpeg';
                }
            } else {
                data[i].UserProfilePicURL = CONSTANTS.BUCKET_URL + data[i].UserProfilePicURL;
            }
            let currDate = new Date();

            data[i].isCompleted = false;
            var slotEndDate = new Date(data[i].SlotEndTime);
            let min1 = currDate.getTime() / 1000;
            let min2 = slotEndDate.getTime() / 1000;
            let diff = min2 - min1;
            let minuteDifference = Math.floor(diff / 60) + ":" + Math.floor(diff % 60 ? diff % 60 : '00');

            data[i].timeDiffMin = minuteDifference;
            if (Date.parse(data[i].SlotEndTime) < Date.parse(new Date()) && data[i].SlotApprovalStatus != 0) {
                data[i].isCompleted = true;
                completedMeetings.push(data[i]);
            } else if (Date.parse(data[i].SlotEndTime) < Date.parse(new Date()) && data[i].SlotApprovalStatus == 0) {
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


exports.getMyMentorshipDetail = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = await Slots.query()
            .select(
                `${tableNames.slots}.id as SlotID`,
                `${tableNames.slots}.slot_date as SlotDate`,
                `${tableNames.slots}.start_time as SlotStartTime`,
                `${tableNames.slots}.end_time as SlotEndTime`,
                `${tableNames.slots}.approval_status as SlotApprovalStatus`,
                `${tableNames.slots}.dialogue_id as DialogueId`,
                `${tableNames.bookings}.selected_curriculum as UserCurriculum`,
                `${tableNames.bookings}.selected_subject as UserSubject`,
                `${tableNames.bookings}.description as UserShortDescription`,
                `${tableNames.bookings}.has_rated as HasUserRated`,
                `${tableNames.bookings}.rating as SlotRating`,
                `${tableNames.user}.name as UserNiceName`,
                `${tableNames.user}.quickblox_id as UserQuickBloxID`,
                `${tableNames.media}.path as UserProfilePicURL`,
            )
            .leftJoin(`${tableNames.bookings}`, `${tableNames.slots}.booking_id`, `${tableNames.bookings}.id`)
            .leftJoin(`${tableNames.user}`, `${tableNames.bookings}.user_id`, `${tableNames.user}.id`)
            .leftJoin(`${tableNames.media}`, `${tableNames.media}.id`, `${tableNames.user}.pro_pic_id`)
            .where(`${tableNames.slots}.id`, `=`, id)
            .first();

        if (data.UserProfilePicURL == null) {
            data.UserProfilePicURL = CONSTANTS.BUCKET_URL + 'useraplha/' + (data.UserNiceName[0]).toLowerCase() + '.jpeg';
        } else {
            data.UserProfilePicURL = CONSTANTS.BUCKET_URL + data.UserProfilePicURL;
        }

        let currDate = new Date();
        data.isCompleted = false;
        var slotEndDate = new Date(data.SlotEndTime);
        let min1 = currDate.getTime() / 1000;
        let min2 = slotEndDate.getTime() / 1000;
        let diff = min2 - min1;
        let minuteDifferenc = Math.floor(diff / 60) + ":" + Math.floor(diff % 60 ? diff % 60 : '00');

        data.timeDiffMin = minuteDifferenc;

        data.checkData = Date.parse(data.EndTime) < Date.parse(new Date()) && data.SlotApprovalStatus != 0;
        if (Date.parse(data.SlotEndTime) < Date.parse(new Date()) && data.SlotApprovalStatus != 0) {
            data.isCompleted = true;
        } else if (Date.parse(data.SlotEndTime) < Date.parse(new Date()) && data.SlotApprovalStatus == 0) {
            data.isCompleted = true;
        }
        return response(200, res, { message: "Success", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.approveSlot = async (req, res, next) => {
    try {
        const { id, dialogueID } = req.params;
        if (dialogueID != undefined) {
            const data = await Slots.query()
                .where({
                    id: id
                })
                .update({
                    approval_status: 1,
                    dialogue_id: dialogueID,
                }).returning("booking_id");
            if (data) {
                const chkBooking = await Booking.query().where({
                    id: data[0].booking_id
                }).first();

                if (chkBooking) {
                    let totaltime = 0, walletHrs = 0;
                    const chkWalletHrs = await User.query().where({ id: chkBooking.user_id }).first();
                    walletHrs = chkWalletHrs ? chkWalletHrs.hrs : 0;
                    if ((walletHrs - chkBooking.hrs_used) > 0) {
                        totaltime = walletHrs - chkBooking.hrs_used;
                    }
                    await User.query().where({ id: chkBooking.user_id }).update({
                        hrs: totaltime
                    });
                }
            }
        } else {
            const data = await Slots.query()
                .where({
                    id: id
                })
                .update({
                    approval_status: 0
                });
        }
        return response(200, res, { message: "Success", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.rejectSlot = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = await Slots.query()
            .where({
                id: id
            })
            .update({
                approval_status: -1
            });
        return response(200, res, { message: "Success", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}


cron.schedule("*/10 * * * * *", async () => {
    this.uploadQuickbloxVideos();
});


exports.uploadQuickbloxVideos = async (req, res, next) => {
    try {
        console.log("Cron scheduler running")
        let slotID = await Slots.query().select(raw('id')).where(
            raw(`isdownloading=false and approval_status=1 and end_time<CURRENT_Timestamp and DATE(end_time)=Current_Date and (select count(*) from video_recordings where chat_dialog_id=(8576000+slots.id))=0`));
        // janky ffmpeg video collating
        ffmpeg.setFfmpegPath(require('@ffmpeg-installer/ffmpeg').path);
        ffmpeg.setFfprobePath(appRoot);
        for (let i = 0; i < slotID.length; i++) {
            let chat_dialog_id;
            chat_dialog_id = `8576${slotID[i].id}`;
            await Slots.query().where({ id: slotID[i].id }).update({
                isdownloading: true,
            });
            if (chat_dialog_id != undefined) {
                const data = await fetch(`https://groupcallsmenteere.quickblox.com/api/server/records?chat_dialog_id=${chat_dialog_id}`, {
                    method: 'GET', headers: {
                        'Content-Type': 'application/json',
                    }
                })
                    .then(function (res) {
                        console.log(res);
                        return res.json();
                    }).then(function (json) {
                        return json;
                    })
                    .catch(function (error) {
                        console.log(error);
                    });

                let groupvideos;
                if (data.data.length != 0) {
                    const groupBy = (array, key) => {
                        return array.reduce((result, currentValue) => {
                            (result[currentValue[key]] = result[currentValue[key]] || []).push(
                                currentValue
                            );
                            return result;
                        }, {});
                    };
                    groupvideos = groupBy(data.data, 'start_time_offset');
                }
                if (data.data.length == 0) {
                    console.log(`No recordings for chat id ${chat_dialog_id}`)
                }
                else {
                    let d = 0;
                    for (var item in groupvideos) {
                        console.log(groupvideos[item])
                        if (groupvideos[item].length != 0 && groupvideos[item].length > 1) {
                            for (let i = 0; i < groupvideos[item].length - 1; i++) {
                                let firstFile = groupvideos[item][i].file;
                                let secondFile = groupvideos[item][i + 1].file;
                                d++;
                                const path = `videocallrecordings/${chat_dialog_id}/videos/video${d}.webm`;
                                const localpath = `${appRoot}\\videocallrecordings\\file${d}_${chat_dialog_id}_video${d}.webm`

                                var AWS = require('aws-sdk');
                                var credentials = {
                                    accessKeyId: process.env.AWS_ACCESS_KEY,
                                    secretAccessKey: process.env.AWS_SECRET_KEY,
                                };
                                AWS.config.update({ credentials: credentials, region: 'us-east-2' });

                                var fs = require('fs');
                                if (!fs.existsSync(localpath)) {
                                    let proc = new ffmpeg()
                                        .addInput(firstFile)
                                        .addInput(secondFile)
                                        .outputOptions(['-c:v copy', '-c:a libvorbis'])
                                        .outputOption('-strict')
                                        .outputOption('experimental')
                                        .saveToFile(localpath)
                                        .on('end', function () {
                                            console.log('files have been merged succesfully');
                                            //Upload file to s3 url
                                            fs.readFile(localpath, function (err, data) {
                                                if (err) throw err;
                                                var s3bucket = new AWS.S3({ params: { Bucket: process.env.AWS_BUCKET_NAME } });
                                                s3bucket.createBucket(function () {
                                                    var params = {
                                                        Key: path,
                                                        Body: data
                                                    };
                                                    s3bucket.upload(params, function (err, data) {
                                                        fs.unlink(localpath, function (err) {
                                                            if (err) {
                                                                console.error(err);
                                                            }
                                                            console.log('Temp File Delete');
                                                        });

                                                        console.log("PRINT FILE:", localpath);
                                                        if (err) {
                                                            console.log('ERROR MSG: ', err);
                                                        } else {
                                                            console.log('Successfully uploaded data to ', data.Location);
                                                            const syncData = async function () {
                                                                try {
                                                                    console.log("Inside async")
                                                                    await VideoRecording.query().insert({
                                                                        chat_dialog_id: chat_dialog_id,
                                                                        path: data.Key,
                                                                    });
                                                                } catch (error) {
                                                                    console.log("error await" + error)
                                                                }
                                                            };
                                                            syncData();
                                                        }
                                                    });
                                                });

                                            });

                                        })
                                        .on('error', function (err) {
                                            console.log('an error happened: ' + err.message);
                                        });
                                }
                            }
                        }
                        else if (groupvideos[item].length != 0 && groupvideos[item].length == 1) {
                            for (let i = 0; i < groupvideos[item].length; i++) {
                                let firstFile = groupvideos[item][i].file;
                                d++;
                                const path = `videocallrecordings/${chat_dialog_id}/videos/video${d}.webm`;
                                const localpath = `${appRoot}\\videocallrecordings\\file${d}_${chat_dialog_id}_video${d}.webm`
                                var AWS = require('aws-sdk');
                                var credentials = {
                                    accessKeyId: process.env.AWS_ACCESS_KEY,
                                    secretAccessKey: process.env.AWS_SECRET_KEY,
                                };
                                AWS.config.update({ credentials: credentials, region: 'us-east-2' });

                                var fs = require('fs');
                                if (!fs.existsSync(localpath)) {
                                    let proc = new ffmpeg()
                                        .addInput(firstFile)
                                        .outputOptions(['-c:v copy', '-c:a libvorbis'])
                                        .outputOption('-strict')
                                        .outputOption('experimental')
                                        .saveToFile(localpath)
                                        .on('end', function () {
                                            console.log('files have been merged succesfully');
                                            fs.readFile(localpath, function (err, data) {
                                                if (err) throw err;
                                                var s3bucket = new AWS.S3({ params: { Bucket: process.env.AWS_BUCKET_NAME } });
                                                s3bucket.createBucket(function () {
                                                    var params = {
                                                        Key: path,
                                                        Body: data
                                                    };
                                                    s3bucket.upload(params, function (err, data) {
                                                        fs.unlink(localpath, function (err) {
                                                            if (err) {
                                                                console.error(err);
                                                            }
                                                            console.log('Temp File Delete');
                                                        });

                                                        console.log("PRINT FILE:", localpath);
                                                        if (err) {
                                                            console.log('ERROR MSG: ', err);
                                                        } else {
                                                            console.log('Successfully uploaded data to ', data.Location);
                                                            const syncData = async function () {
                                                                try {
                                                                    console.log("Inside async")
                                                                    const media = await VideoRecording.query().insert({
                                                                        chat_dialog_id: chat_dialog_id,
                                                                        path: data.Key,
                                                                    });
                                                                } catch (error) {
                                                                    console.log("error await" + error)
                                                                }
                                                            };
                                                            syncData();
                                                        }
                                                    });
                                                });
                                            });
                                        })
                                        .on('error', function (err) {
                                            console.log('an error happened: ' + err.message);
                                        });
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.log("error" + error)
    }
}


exports.getQuickbloxVideos = async (req, res, next) => {
    try {
        const { id, chat_dialog_id } = req.params;
        const data = await VideoRecording.query().where({ chat_dialog_id: chat_dialog_id });
        for (let i = 0; i < data.length; i++) {
            if (data[i].path != null) {
                var AWS = require('aws-sdk');
                var credentials = {
                    accessKeyId: process.env.AWS_ACCESS_KEY,
                    secretAccessKey: process.env.AWS_SECRET_KEY,
                };
                AWS.config.update({ credentials: credentials, region: 'us-east-2' });
                var s3 = new AWS.S3();
                var presignedGETURL = s3.getSignedUrl('getObject', {
                    Bucket: 'menteerebucket',
                    Key: data[i].path, //filename
                    Expires: 30, //time to expire in seconds
                });
                data[i].videoUrl = presignedGETURL;
                data[i].url = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + data[i].path);
            }
        }
        return response(200, res, { message: "Success", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}