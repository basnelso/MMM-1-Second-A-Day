'use strict';
const NodeHelper = require('node_helper');
const fs = require('fs');
const moment = require('moment');
const { spawn, exec } = require("child_process");
const PiCamera = require('pi-camera');

const VIDEO_PATH = './modules/MMM-1-Second-A-Day/videos/clips/';
const IMAGE_PATH = './modules/MMM-1-Second-A-Day/pictures/clips/';

module.exports = NodeHelper.create({
    start: function() {
        console.log("Starting node helper for: " + this.name);
    },

    socketNotificationReceived: function(notification, payload) {
		console.log('node got notification:')
		console.log(notification);
    	const self = this;
		switch(notification) {
			case "RECORD_CLIP":
				this.recordClip(payload);
				break;
			case "TAKE_PICTURE":
				this.takePicture(payload);
				break;
			case "UPLOAD_CLIP":
				this.uploadClip(payload);
				break;
			case "":
				break;
		}
    },

	uploadClip: function(destination) {
		this.sendSocketNotification("STATUS_UPDATE", {
			status: "STATUS_UPLOADING"
		});

		const uploadUniqueFile = require('./upload.js');
		fs.readdir(VIDEO_PATH, function(err, files) {
			if (err) {
				console.error(err);
			} else {
				files.forEach(function(file) {
					console.log("Uploading " + file);
					uploadUniqueFile(file, VIDEO_PATH + file, '14-i6Hvbqfw3wsBKhti9h_IMD-ty1sHsE', () => {
						self.sendSocketNotification("STATUS_UPDATE", {
							status: "STATUS_UPLOADED"
						});
					});
				});
			}
		});
	},

	recordClip: function(payload) {
		const filename = 'clip_' + moment().format('YYYY[_]MM[_]DD[_]h:mm:ss');
		const recordingWindow = spawn('bash', ['~/start_picam.sh', payload.length, filename, payload.orientation], {shell: true});

		recordingWindow.stdout.on('data', function (data) {
			if (data) {
				console.log('stdout: ' + data.toString());
			}
		});
		  
		recordingWindow.stderr.on('data', function (data) {
			if (data) {
				console.log('stderr: ' + data.toString());
			}
		});
		  
		recordingWindow.on('exit', function (code) {
			if (code) {
				console.log('child process exited with code ' + code.toString());
			}
		});

		var self = this;
		setTimeout(function() {
			console.log('save video')
			self.sendSocketNotification('UPLOAD_CLIP')
        }, (10 + payload.length) * 1000);
	},

	takePicture: function(orientation) {
		console.log('picture taken', orientation);
		var myCamera = null;
		if (orientation == 'horizontal') {
			myCamera = new PiCamera({
				mode: 'photo',
				output: `${IMAGE_PATH}/test.jpg`,
				width: 1920,
				height: 1080,
				nopreview: false,
			});
		} else if (orientation == 'vertical') {
			myCamera = new PiCamera({
				mode: 'photo',
				output: `${IMAGE_PATH}/test.jpg`,
				width: 1080,
				height: 1920,
				nopreview: false,
			});
		}

		myCamera.snap()
			.then((result) => {
				console.print('took a picture')
				console.log(result)
			})
			.catch((error) => {
				console.log('error occured');
				console.log(error);
			});
	}
});
