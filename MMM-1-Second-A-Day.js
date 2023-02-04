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
		driveDestination: '14-i6Hvbqfw3wsBKhti9h_IMD-ty1sHsE',
		recording_length: 10
    },

	start: function()
	{
		Log.info('Starting module: ' + this.name);
		this.sendSocketNotification('START', this.config);
		this.status = "STATUS_DEFAULT";
		this.webcamVideoSrcObject = null;
		this.cameraState = {};
	},

	getStyles: function() {
		return ["MMM-1-Second-A-Day.css"]
	},

	getDom: function() {
		const wrapper = document.createElement("div");
		const video_wrapper = document.createElement("span");
		const picture_wrapper = document.createElement("span");

		const verticalVideoButton = this.createButton('video', 'vertical');
		const horizontalVideoButton = this.createButton('video', 'horizontal');
		const verticalPicButton = this.createButton('pic', 'vertical');
		const horizontalPicButton = this.createButton('pic', 'horizontal');

		video_wrapper.appendChild(verticalVideoButton);
		video_wrapper.appendChild(horizontalVideoButton);

		picture_wrapper.appendChild(verticalPicButton);
		picture_wrapper.appendChild(horizontalPicButton);

		wrapper.appendChild(video_wrapper);
		wrapper.appendChild(picture_wrapper);

		var link_text = document.createElement("span");
		link_text.innerHTML = "Go to bit.ly/bradysnelson to view clips/pictures";
		wrapper.appendChild(link_text);

		wrapper.className = 'wrapper';
		video_wrapper.className = 'button_wrapper';
		picture_wrapper.className = 'button_wrapper';
		/*
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
		*/

		return wrapper;
	},

	createButton: function(type, orientation) {
		console.log('button pushed');
		button = document.createElement("span");
		button.className = 'capture-button';
		var self = this;
		button.addEventListener('click', function () {
			self.switchLightsWhite();
			if (type == 'video') {
				self.recordClip(orientation);
			} else if (type == 'pic') {
				self.takePicture(orientation);
			}
		})

		if (type == 'video') {
			if (orientation == 'vertical') {
				button.innerHTML = 'Vertical Video';
			} else if (orientation == 'horizontal') {
				button.innerHTML = 'Horizontal Video';
			}
		} else if (type =='pic') {
			if (orientation == 'vertical') {
				button.innerHTML = 'Vertical Pic';
			} else if (orientation == 'horizontal') {
				button.innerHTML = 'Horizontal Pic';
			}
		}

		return button;
	},

	switchLightsWhite: function() {
		console.log('its picutre time!!')
		this.sendNotification('PICTURE_TIME');
	},

	switchLightsBack: function() {
		console.log('sending notif with camera state to switch back:', this.cameraState)
		this.sendNotification('REVERSE_BACK', this.cameraState);
	},

	recordClip: function (orientation) {
		payload = {
			length: this.config.recording_length,
			orientation: orientation
		}
		this.sendSocketNotification('RECORD_CLIP', payload);
	},

	takePicture: function (orientation) {
		this.sendSocketNotification('TAKE_PICTURE', orientation);
	},

	socketNotificationReceived: function(notification, payload) {
		if (notification == 'UPLOAD_CLIP') {
			this.sendSocketNotification(notification, this.config.driveDestination);
		} else if (notification == 'SWITCH_BACK') {
			console.log('switching back from 1sec fe');
			this.switchLightsBack();
		}
    },

	notificationReceived: function(notification, payload, sender) {
		if (notification == 'CAMERA_STATE') { // Recieve this from the
			this.cameraState = payload;
		}
	}
});
