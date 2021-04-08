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
		console.log("record clip function called")
		const currTime = moment().format('YYYY[_]MM[_]DD');
		const fileName = 'clip_' + currTime;
        const fileExtension = 'h264';
        const fileFullName = PATH_TO_CLIPS + fileName + '.' + fileExtension;

		const command = '~/picam/picam';
		const args = ['--alsadev', 'hw:2,0', '--rotation', '180', '--samplerate', '32000', '--preview', '--previewrect', '640,360,1280,720'];
		const recordingWindow = spawn(command, args, {shell: true});

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

		setTimeout(function() {
			exec('touch ~/picam/hooks/start_recording');
			setTimeout(function() {
				console.log('stopping recording');
				exec('touch ~/picam/hooks/stop_recording');
				setTimeout(function() {
					console.log('killing window');
					killer(recordingWindow.pid, 'SIGTERM', function(err) {
						console.log(err);
					});
					// Send signal to convert + upload video
				}, 3000);
			}, 10000);
		}, 3000);



		console.log('exiting function')

		// touch ~/picam/hooks/start_recording
		// touch ~/picam/hooks/stop_recording
		/*
		const outputPath = PATH_TO_CLIPS + 'TEST.mp4';
		setTimeout(function() {
			const execCommand = ['MP4Box', '-add', fileFullName, outputPath].join(' ')
			exec(execCommand, (error, stdout, stderr) => {
				if (error) {
					console.log(`error: ${error.message}`);
					return;
				}
				if (stderr) {
					console.log(`stderr: ${stderr}`);
					return;
				}
				console.log(`stdout: ${stdout}`);
			});
		}, 20000)
		*/
	}
});
