'use strict';
const NodeHelper = require('node_helper');
const fs = require('fs');
const moment = require('moment');
const PiCamera = require('pi-camera');
const hbjs = require('handbrake-js')

const PATH_TO_CLIPS = './modules/MMM-1-Second-A-Day/videos/clips/';

module.exports = NodeHelper.create({
    start: function() {
        console.log("Starting node helper for: " + this.name);
    },

    socketNotificationReceived: function(notification, payload) {
		console.log('node got notification:')
		console.log(notification);
    	const self = this;
		switch(notification) {
			case "START":
				console.log("Starting node helper socket notification");
				self.sendSocketNotification("STATUS_UPDATE", {
					status: "STATUS_DEFAULT",
					clipFileNames: fs.readdirSync(PATH_TO_CLIPS)
				});
				break;
			case "RECORD_CLIP":
				this.recordClip(payload);
			case "SAVE_CLIP":
				this.saveClip(payload);
				break;
			case "UPLOAD_COMPILATIONS":
				this.uploadCompilations(payload);
				break;
			case "":
				break;
		}
    },

    saveClip : function(blob) {
    	const self = this;
		const currTime = moment().format('YYYY[_]MM[_]DD');
		const fileName = 'clip_' + currTime;
        const fileExtension = 'webm';
        const fileFullName = PATH_TO_CLIPS + fileName + '.' + fileExtension;
        fs.mkdirSync(PATH_TO_CLIPS, { recursive: true });
        fs.writeFile(fileFullName, Buffer.from(blob), {}, err => {
            if(err){
                console.error(err)
                return
            }
            console.log('video saved')
			self.sendSocketNotification("STATUS_UPDATE", {
				status: "STATUS_DEFAULT",
				clipFileNames: fs.readdirSync(PATH_TO_CLIPS)
			});
        })
    },

	uploadCompilations: function (destination) {
    	const self = this;
		this.sendSocketNotification("STATUS_UPDATE", {
			status: "STATUS_UPLOADING"
		});
		const uploadUniqueFile = require('./upload.js');

		fs.readdir(PATH_TO_COMPILATIONS, function(err, files) {
			if (err) 
				console.error(err);
			else {
				files.forEach(function(file) {
					console.log("Uploading " + file);
					uploadUniqueFile(file, PATH_TO_COMPILATIONS+file, destination, () => {
						self.sendSocketNotification("STATUS_UPDATE", {
							status: "STATUS_UPLOADED"
						});
					});
				});
			}
		});
	},

	recordClip: function(payload) {
		console.log("record clip function called")
		const currTime = moment().format('YYYY[_]MM[_]DD');
		const fileName = 'clip_' + currTime;
        const fileExtension = 'h264';
        const fileFullName = PATH_TO_CLIPS + fileName + '.' + fileExtension;

		const camera = new PiCamera({
			mode: 'video',
			output: fileFullName,
			width: 1920,
			height: 1080,
			timeout: 5000,
			nopreview: false,
		})

		camera.record()
			.then((result) => {
				console.log("video recorded");
				console.log(result);
			})
			.catch((error) => {
				console.log("error recording video");
				console.log(error);
			});

		const outputPath = PATH_TO_CLIPS + 'TEST.mp4';
		hbjs.spawn({ input: fileFullName, output: outputPath })
			.on('error', err => {
				console.log('conversion did not work');
				console.log(err);
			})
			.on('progress', progress => {
			console.log(
				'Percent complete: %s, ETA: %s',
				progress.percentComplete,
				progress.eta
			)
			})
	}
});
