'use strict';
const NodeHelper = require('node_helper');
const fs = require('fs');
const moment = require('moment');
const { spawn, exec } = require("child_process");
const PiCamera = require('pi-camera');
const fetch = require('node-fetch');
const url = require('url');

const VIDEO_PATH = './modules/MMM-1-Second-A-Day/videos/clips/';
const IMAGE_PATH = './modules/MMM-1-Second-A-Day/pictures/clips/';

module.exports = NodeHelper.create({
	start: function () {
		console.log("Starting node helper for: " + this.name);
	},

	socketNotificationReceived: function (notification, payload) {
		console.log('node got notification:')
		console.log(notification);
		const self = this;
		switch (notification) {
			case "RECORD_CLIP":
				this.recordClip(payload);
				this.moveLights("takePicture");
				break;
			case "TAKE_PICTURE":
				this.takePicture(payload);
				this.moveLights("takePicture");
				break;
			case "UPLOAD_CLIP":
				this.moveLights("lightWall");
				this.uploadClip(payload);
				break;
			case "":
				break;
		}
	},

	uploadClip: function (destination) {
		this.sendSocketNotification("STATUS_UPDATE", {
			status: "STATUS_UPLOADING"
		});

		const uploadUniqueFile = require('./upload.js');
		fs.readdir(VIDEO_PATH, function (err, files) {
			if (err) {
				console.error(err);
			} else {
				files.forEach(function (file) {
					console.log("Uploading " + file);
					uploadUniqueFile(file, VIDEO_PATH + file, '14-i6Hvbqfw3wsBKhti9h_IMD-ty1sHsE', () => {
						self.sendSocketNotification("STATUS_UPDATE", {
							status: "STATUS_UPLOADED"
						});
					});
				});
			}
		});
		fs.readdir(IMAGE_PATH, function (err, files) {
			if (err) {
				console.error(err);
			} else {
				files.forEach(function (file) {
					console.log("Uploading " + file);
					uploadUniqueFile(file, IMAGE_PATH + file, '14-i6Hvbqfw3wsBKhti9h_IMD-ty1sHsE', () => {
						self.sendSocketNotification("STATUS_UPDATE", {
							status: "STATUS_UPLOADED"
						});
					});
				});
			}
		});
	},

	recordClip: function (payload) {
		const filename = 'clip_' + moment().format('YYYY[_]MM[_]DD[_]h:mm:ss');
		const recordingWindow = spawn('bash', ['~/start_picam.sh', payload.length, filename, payload.orientation], { shell: true });

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
		setTimeout(function () {
			self.sendSocketNotification('UPLOAD_CLIP')
		}, (10 + payload.length) * 1000);
	},

	takePicture: function (orientation) {
		const filename = 'pic_' + moment().format('YYYY[_]MM[_]DD[_]h:mm:ss');
		var myCamera = null;
		var self = this;
		if (orientation == 'horizontal') {
			myCamera = new PiCamera({
				mode: 'photo',
				output: `${IMAGE_PATH}/${filename}.jpg`,
				width: 1920,
				height: 1080,
				nopreview: false,
				vflip: true,
				fullscreen: false,
				preview: '640,360,1280,720'
			});
		} else if (orientation == 'vertical') {
			myCamera = new PiCamera({
				mode: 'photo',
				output: `${IMAGE_PATH}/${filename}.jpg`,
				width: 1080,
				height: 1920,
				nopreview: false,
				vflip: true,
				fullscreen: false,
				preview: '987,0,720,1280'
			});
		}

		myCamera.snap()
			.then((result) => {
				console.log(result)
				self.sendSocketNotification('UPLOAD_CLIP')
			})
			.catch((error) => {
				console.log('error occured');
				console.log(error);
			});
	},

	moveLights: function (methodToCall) {
		console.log("moving lights with method:", methodToCall);
		let self = this;

		var myHeaders = new fetch.Headers();
		myHeaders.append("Authorization", "Bearer d7f1d8f26ca4a5df7a4fb68c3e8a5d6eb65633d8");
		myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

		var urlencoded = new url.URLSearchParams();
		urlencoded.append("arg", "takePhoto");

		var requestOptions = {
		method: 'POST',
		headers: myHeaders,
		body: urlencoded,
		redirect: 'follow'
		};

		var endpoint = "https://api.particle.io/v1/devices/3f0035000f51353532343635/moveLights";
		fetch(endpoint, requestOptions)
		.then(response => response.text())
		.then(result => console.log(result))
		.catch(error => console.log('error', error));
	}
});
