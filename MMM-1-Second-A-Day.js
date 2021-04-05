/* global Module */

/* Magic Mirror
 * Module: MMM-1-Second-A-Day
 *
 * By Gary Chew and Kyle Stadelmann
 */
Module.register('MMM-1-Second-A-Day',
{
	defaults:
	{
		driveDestination: ''
    },

	start: function()
	{
		Log.info('Starting module: ' + this.name);
		this.sendSocketNotification('START', this.config);
		this.status = "STATUS_DEFAULT";
		this.webcamVideoSrcObject = null;
	},

	getStyles: function() {
		return ["MMM-1-Second-A-Day.css"]
	},

	getDom: function() {
		const wrapper = document.createElement("div");
		wrapper.id = 'MMM1SecondADayContainer';

		const recordButton = document.createElement("span");
		recordButton.id = 'record_button'
		recordButton.className = 'button'
		var self = this;
        recordButton.addEventListener("click", function () {
			self.recordClip();
        });

        var symbol = document.createElement("span");
		symbol.className = "control-symbol fa fa-pause";
		recordButton.appendChild(symbol);
		wrapper.appendChild(recordButton);
		
		const statusText = document.createElement("p");
		wrapper.appendChild(statusText);
		console.log(this.status);
		if (this.status == 'STATUS_RECORDING') {
			statusText.innerHTML = "Recording...";
			wrapper.appendChild(statusText);

			const webcamVideoContainer = document.createElement("div");
			webcamVideoContainer.id = "webcamVideoContainer";
			wrapper.appendChild(webcamVideoContainer);

			const webcamVideo = document.createElement("video");
			webcamVideo.autoplay = true;
			webcamVideo.id = "webcamVideo";
			webcamVideo.srcObject = this.webcamVideoSrcObject
			webcamVideoContainer.appendChild(webcamVideo);
		} else if (this.status == 'STATUS_UPLOADING') {
			statusText.innerHTML = "Uploading...";
		} else if (this.status == 'STATUS_UPLOADED') {
			statusText.innerHTML = "Uploaded!";
		}

		return wrapper;
	},

    socketNotificationReceived: function(notification, payload) {
	    Log.info("MMM-1-Second-A-Day socketNotificationReceived: " + notification);
    },

	recordClip: function () {
		this.sendSocketNotification('RECORD_CLIP')

		/*
		const self = this;
		navigator.mediaDevices.getUserMedia({audio: true, video: true}).then(function (stream) {
			self.status = "STATUS_RECORDING";
			self.webcamVideoSrcObject = stream;
			self.updateDom(500);

			setTimeout(() => {
				const blob_reader = new FileReader();
				const blobs = [];
				blob_reader.addEventListener("load", function (ev) {
					self.sendSocketNotification("SAVE_CLIP", ev.currentTarget.result);
					if (blobs.length) {
						ev.currentTarget.readAsArrayBuffer(blobs.shift());
					}
				});

				const recorder = new MediaRecorder(stream);
				recorder.addEventListener("dataavailable", function (ev) {
					if (blob_reader.readyState != 1) {
						blob_reader.readAsArrayBuffer(ev.data);
					} else {
						blobs.push(ev.data);
					}
				});

				recorder.start();
				setTimeout(() => recorder.stop(), 10000); // 10 seconds
			}, 500);

		});
		*/
	},
});
