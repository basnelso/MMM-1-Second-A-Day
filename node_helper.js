'use strict';
const NodeHelper = require('node_helper');
const fs = require('fs');
const moment = require('moment');
const { spawn, exec } = require("child_process");

const PATH_TO_CLIPS = '~/picam/rec/archive/';

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
				break;
			case "UPLOAD_CLIP":
				this.uploadClip('mirror-videos');
				break;
			case "":
				break;
		}
    },

	uploadClip: function(destination) {
		this.sendSocketNotification("STATUS_UPDATE", {
			status: "STATUS_UPLOADING"
		});

		console.log('uploading clip to', destination);
		const uploadUniqueFile = require('./upload.js');
		fs.readdir(PATH_TO_CLIPS, function(err, files) {
			if (err) 
				console.error(err);
			else {
				files.forEach(function(file) {
					console.log("Uploading " + file);
					uploadUniqueFile(file, PATH_TO_CLIPS + file, destination, () => {
						console.log('uploaded video')
						self.sendSocketNotification("STATUS_UPDATE", {
							status: "STATUS_UPLOADED"
						});

						//exec(`rm ${PATH_TO_CLIPS + file}`)
					});
				});
			}
		});
	},

	recordClip: function(recording_length) {
		const filename = 'clip_' + moment().format('YYYY[_]MM[_]DD[_]h:mm:ss');
		const recordingWindow = spawn('bash', ['~/start_picam.sh', recording_length, filename], {shell: true});

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
        }, (10 + recording_length) * 1000);
	}
});
