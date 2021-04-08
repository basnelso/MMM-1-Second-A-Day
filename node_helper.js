'use strict';
const NodeHelper = require('node_helper');
const fs = require('fs');
const moment = require('moment');
const { exec, spawn } = require("child_process");
const killer = require('tree-kill')

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
				break;
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
		const filename = 'clip_' + moment().format('YYYY[_]MM[_]DD, h:mm:ss');
		const recordingWindow = spawn('bash', ['~/start_picam.sh', '10', filename], {shell: true});

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


	}
});
