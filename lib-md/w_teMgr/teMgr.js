teMgr = {
	controllers: [],

	initControllers: function (elements, subControllers) {
		const self = this;
		return new Promise((resolve) => {
			if (document.readyState == 'loading') {
				document.addEventListener('DOMContentLoaded', function () {
					self.initControllers(elements, subControllers);
					resolve();
				});
			} else {
				if (elements instanceof Element) elements = [elements];
				else if (!(Array.isArray(elements)) && !(elements instanceof NodeList)) elements = this.queryAll(elements);
				Array.prototype.forEach.call(elements, function (element) {
					self.initController(element, subControllers);
					resolve();
				});
			}
		});
	},

	initController: function (element, subControllers) {
		try {
			const ctrl = new TEController(element, subControllers);
			this.controllers.push(ctrl);
			return ctrl;
		} catch (e) {
			console.error('initController:', e);
		}
	},

	getController: function (element) {
		for (let ctrl, i = 0; i < this.controllers.length, ctrl = this.controllers[i]; i++) {
			if (ctrl.element == element || ctrl.container == element || ctrl.container.contains(element)) return ctrl;
		}
		return null;
	},

	getSubController: function (element, classNames) {
		const ctrl = this.getController(element);
		if (ctrl) return ctrl.getSubController(classNames);
		return null;
	},

	getSubControllers: function (element, classNames) {
		const ctrl = this.getController(element);
		if (ctrl) return ctrl.getSubControllers(classNames);
		return [];
	},

	addSubController: function (element, subCtrl) {
		const ctrl = this.getController(element);
		if (ctrl) ctrl.addSubController(subCtrl);
	},

	query: function (classNames, context) {
		context = context || document;
		return context.querySelector(classNames);
	},

	queryAll: function (classNames, context) {
		context = context || document;
		return Array.prototype.slice.call(context.querySelectorAll(classNames));
	},

	matches: function (element, classNames) {
		const matches = element.matches || element.msMatchesSelector;
		return matches.call(element, classNames);
	},

	durationFormatter: Intl?.DurationFormat && document.documentElement.lang ? new Intl.DurationFormat(document.documentElement.lang, {style: "long", secondsDisplay: "always"}) : null,

	formatTime: function (time, long = false) {
		time = Number(time);
		const h = Math.floor(time / 3600);
		const m = Math.floor(time % 3600 / 60);
		const s = Math.floor(time % 3600 % 60);

		if (long && this.durationFormatter) {
			return this.durationFormatter.format({hours: h, minutes: m, seconds: s});
		} else {
			return ((long || h > 0 ? h + ":" : "") + (m > 0 ? (h > 0 && m < 10 ? "0" : "") + m + ":" : "0:") + (s < 10 ? "0" : "") + s);
		}
	},

	scPortalRenderer: {
		name: 'native_scportal',
		options: {
			prefix: 'native_scportal'
		},

		canPlayType: function (type) {
			return ['video/x-scportal', 'audio/x-scportal'].indexOf(type.toLowerCase()) > -1
		},

		create: function (mediaElement, options, mediaFiles) {
			let hlsRenderer, html5Renderer, subRenderer;

			function showHtml5Renderer() {
				if (!html5Renderer) html5Renderer = mejs.Renderers.renderers['html5'].create(mediaElement, {prefix: 'html5'}, []);
				mediaElement.renderer = html5Renderer;
				mediaElement.renderer.show();
			}

			const settings = (options && options.scportal) || {};
			const renderer = {
				hide: () => {
					if (subRenderer) subRenderer.hide();
				},
				show: () => {
					if (subRenderer) subRenderer.show();
				},
				setSrc: async (src) => {
					function fallback(e) {
						console.error("Unable to initialize the scPortal renderer");
						if (e) console.error(e);
						showHtml5Renderer();
						html5Renderer.setSrc(src);
					}

					try {
						const mediaManifestUrl = new URL(src);
						mediaManifestUrl.pathname += "/:api:/v1/media";
						mediaManifestUrl.search = mediaManifestUrl.hash = "";
						const mediaManifestResp = await fetch(mediaManifestUrl.href, {credentials: settings.credentials || "same-origin", cache: "no-cache"});
						const mediaManifest = await mediaManifestResp.json();

						let adaptStreamSrc;
						const videoSources = [];
						const audioSources = [];
						for (let i = 0; i < mediaManifest.sources.length; i++) {
							const source = mediaManifest.sources[i];
							if (source.type == "application/vnd.apple.mpegurl") {
								adaptStreamSrc = source;
								break;
							} else {
								if (source.height) videoSources.push(source);
								if (source.type.startsWith("audio/")) audioSources.push(source);
							}
						}

						adaptStreamSrc = mediaManifest.sources.filter(function (source) {
							return source.type == "application/vnd.apple.mpegurl";
						})[0];
						if (adaptStreamSrc) {
							if (!hlsRenderer) hlsRenderer = mejs.Renderers.renderers['native_hls'].create(mediaElement, {prefix: 'native_hls', hls: {}}, []);
							mediaElement.renderer.hide();
							mediaElement.renderer = hlsRenderer;
							mediaElement.renderer.show();
							mediaElement.renderer.setSrc(src + adaptStreamSrc.path);
						} else if (videoSources.length) {
							videoSources.sort(function (srcA, srcB) {
								return srcB.height - srcA.height
							});

							let defaultSrc = null;
							const qualities = [];
							for (let i = 0; i < videoSources.length; i++) {
								const source = videoSources[i];
								if (!defaultSrc && source.height <= 720) defaultSrc = source;
								if (videoSources.length > 1) qualities.push({label: source.label || (source.height + 'p'), value: source.path, type: source.type});
							}
							if (!defaultSrc) {
								fallback();
								return;
							}

							let quality = defaultSrc.path;
							showHtml5Renderer();

							html5Renderer.getQualities = function () {
								return qualities;
							}

							html5Renderer.getQuality = function () {
								return quality;
							}

							html5Renderer.setQuality = function (qual) {
								quality = qual;
								const playing = !mediaElement.paused;
								const currentTime = mediaElement.currentTime;
								html5Renderer.setSrc(src + qual);
								mediaElement.currentTime = currentTime;
								if (playing) mediaElement.play();
							}

							html5Renderer.setSrc(src + defaultSrc.path);
						} else if (audioSources.length) {
							showHtml5Renderer();
							for (let i = 0; i < audioSources.length; i++) {
								const audioSource = audioSources[i];
								if (html5Renderer.canPlayType(audioSource.type)) {
									html5Renderer.setSrc(src + audioSource.path);
									break;
								}
							}
						} else {
							fallback();
						}
					} catch (e) {
						fallback(e);
					}
				},
				getSrc: () => {
					return subRenderer ? subRenderer.getSrc() : null;
				},
				play: () => {
					if (subRenderer) subRenderer.play();
				},
				pause: () => {
					if (subRenderer) subRenderer.pause();
				}
			};
			renderer.setSrc(mediaFiles[0].src);
			return renderer;
		}
	},

	// Doit être appellé après l'initialisation du controlleur porteur du targetElem ou de l'ancre de la subWindow
	parseVTTTranscript: function (vttUrl, targetElem, anchor) {
		const trackElem = document.createElement('track');
		trackElem.src = vttUrl;
		trackElem.track.mode = "hidden";

		const win = anchor ? anchor.ownerDocument.defaultView : window;
		const ctrl = win.teMgr.getController(anchor || targetElem);
		if (!ctrl) throw new Error("Unable to find the temporal controller");

		const fragment = document.createDocumentFragment();
		return new Promise(function (resolve, reject) {
			trackElem.addEventListener('load', function () {
				let currentVoice = null;
				const url = frameElement && frameElement.fWin ? new URL(window.parent.location) : new URL(window.location);
				for (let cue of trackElem.track.cues) {
					const cueFragment = cue.getCueAsHTML();

					const voice = cueFragment.firstChild.localName == 'span' ? cueFragment.firstChild.getAttribute('title') : null;
					if (voice != currentVoice) {
						const voicePara = fragment.appendChild(document.createElement('p'));
						if (voice) {
							voicePara.appendChild(document.createTextNode(voice));
							voicePara.className = 'voice';
							voicePara.dataset.teStart = cue.startTime;
							voicePara.dataset.teEnd = cue.endTime;
						}
						currentVoice = voice;
					}

					const cueLinkElt = document.createElement('a');
					if (ctrl.getSubController(win.TEHashCtrl)) {
						url.hash = '#t=' + cue.startTime;
						cueLinkElt.href = url.toString();
						if (frameElement && frameElement.fWin) cueLinkElt.target = '_parent';
					} else {
						cueLinkElt.href = '#';
						cueLinkElt.onclick = function (event) {
							ctrl.media.currentTime = cue.startTime;
							event.preventDefault();
						}
					}

					cueLinkElt.appendChild(cueFragment);
					cueLinkElt.className = 'txt_tcLink';

					const para = fragment.appendChild(document.createElement('p'));
					para.dataset.teStart = cue.startTime;
					para.dataset.teEnd = cue.endTime;
					para.dataset.teFmtStartTime = teMgr.formatTime(cue.startTime);
					para.dataset.teFmtEndTime = teMgr.formatTime(cue.endTime);
					para.appendChild(cueLinkElt);
				}
				targetElem.appendChild(fragment);
				ctrl.updateSegments();
				ctrl.updateStates();
				resolve(fragment);
			});

			(ctrl.media.originalNode || ctrl.media).appendChild(trackElem);
		});
	}
};

TEController = function (element, subControllers) {
	const self = this;

	this.lastTimeUpdate = NaN;

	this.element = element;
	if (!this.element) throw "Temporal controller not found";
	this.subControllers = subControllers;

	this.queryPrefix = this.element.getAttribute('data-te-prefix') || '.te';

	let container = this.element.parentNode;
	while (container instanceof Element && !teMgr.matches(container, this.element.dataset.teContainer)) {
		container = container.parentNode;
	}
	if (container == document) container = document.body;
	this.container = container;

	const media = this.media = container.querySelector(this.element.dataset.teMedia || this.selector('media'));
	if (!media) throw "Media not found";

	this.updateMediaType();

	const seekInput = this.seekInput = this.query('seek');
	if (seekInput) {
		this.seekDragging = false;
		let seekInputTimeout = null;
		seekInput.addEventListener('input', function () {
			self.seekDragging = true;
			seekInput.style.setProperty('--value', seekInput.value * 100 / media.duration + '%');
			if (!seekInputTimeout) media.currentTime = parseFloat(this.value);
			seekInputTimeout = setTimeout(function () {
				seekInputTimeout = null;
			}, 200);
		}, false);
		seekInput.addEventListener('change', function () {
			self.seekDragging = false;
			media.currentTime = parseFloat(this.value);
		});
		seekInput.addEventListener('keydown', function (ev) {
			if (ev.code == 'Enter' || ev.code == 'Space') {
				self.playPause();
				ev.preventDefault();
				ev.stopPropagation();
			}
		});
	}

	this.playPauseBtn = this.query('playPause');
	if (this.playPauseBtn) this.bindButton(this.playPauseBtn, this.playPause);
	this.bind(this.media, 'click', this.videoPlayPause);

	this.nextTimeBtn = this.query('nextTime');
	if (this.nextTimeBtn) this.bindButton(this.nextTimeBtn, this.nextTime);

	this.previousTimeBtn = this.query('previousTime');
	if (this.previousTimeBtn) this.bindButton(this.previousTimeBtn, this.previousTime);

	this.currentTimeLabel = this.query('currentTime');
	this.durationLabel = this.query('duration');
	for (const label of [this.currentTimeLabel, this.durationLabel]) {
		const elt = label.appendChild(document.createElement('span'));
		elt.setAttribute('aria-hidden', 'true');
	}

	this.muteBtn = this.query('mute');
	if (this.muteBtn) {
		this.muteBtn.addEventListener('click', function () {
			if (media.volume == 0) media.volume = 1;
			media.muted = !media.muted;
		});
	}
	this.volumeInput = this.query('volume');
	if (this.volumeInput) {
		function setVolume() {
			media.volume = self.volumeInput.value / 100;
			if (media.volume != 0) media.muted = false;
		}

		this.volumeInput.addEventListener('input', setVolume);
		this.volumeInput.addEventListener('change', setVolume);
	}

	this.bind(media, 'timeupdate', this.updateTime);
	this.bind(media, 'volumechange', this.updateVolume);
	if (mejs.Features.isSafari) {
		// Bug de longue date sur Safari qui ne donne pas les dimensions au moment du loadedmetadata (https://bugs.webkit.org/show_bug.cgi?id=172223)
		// Contournement : on force le chargement et l'évènement canplay est utilisé à la place du loadedmetadata
		media.preload = "auto";
		// Sur iOS, le preload="auto" ne suffit pour charger la première frame : on force une lecture
		if (mejs.Features.isiOS) media.play();
		this.bind(media, 'canplay', () => {
			media.pause();
			this.updateMediaType();
		}, { once: true });
	} else {
		this.bind(media, 'loadedmetadata', this.updateMediaType);
	}
	this.bind(media, 'loadedmetadata', this.updateDuration);
	this.bind(media, 'durationchange', this.updateDuration);
	this.bind(media, 'durationchange', this.updateTime);
	this.bind(media, 'loadedmetadata', this.updateVolume);
	['loadedmetadata', 'playing', 'pause', 'ended', 'seeking', 'seeked'].forEach(function (event) {
		self.bind(media, event, self.updatePlayingState);
	});

	this.updateSegments();
	this.updatePoints();

	this.timelines = teMgr.queryAll(this.element.dataset.teTimelines || this.selector('timeline'), this.element);
	this.previousTimelineBtn = this.query('previousTimeline');
	this.nextTimelineBtn = this.query('nextTimeline');
	if (this.timelines.length) {
		if (this.previousTimelineBtn) this.bindButton(this.previousTimelineBtn, this.previousTimeline);
		if (this.nextTimelineBtn) this.bindButton(this.nextTimelineBtn, this.nextTimeline);
		this.selectTimeline(this.timelines[0]);
	} else {
		if (this.previousTimelineBtn) this.previousTimelineBtn.hidden = true;
		if (this.nextTimelineBtn) this.nextTimelineBtn.hidden = true;
		if (this.previousTimeBtn) this.previousTimeBtn.hidden = true;
		if (this.nextTimeBtn) this.nextTimeBtn.hidden = true;
	}

	if (this.subControllers) this.subControllers.forEach(function (subCtrl) {
		try {
			if (subCtrl.init) subCtrl.init(self);
		} catch (e) {
			console.error(subCtrl.constructor.name + '.init:', e);
		}
	});

	this.updateTime();
	this.subtitles = {};

	let readyCount = 2 /* dom, metadata */;

	function ready() {
		readyCount--;
		if (readyCount > 0) return;

		container.classList.add('teReady');
		if (self.subControllers) self.subControllers.forEach(function (subCtrl) {
			try {
				if (subCtrl.ready) subCtrl.ready(self);
			} catch (e) {
				console.error(subCtrl.constructor.name + '.ready:', e);
			}
		});

		self.initPressButtons();
	}

	if (media.readyState >= HTMLMediaElement.HAVE_METADATA) ready();
	else {
		function loadedmetadata() {
			media.removeEventListener('loadedmetadata', loadedmetadata);
			ready();
		}

		media.addEventListener('loadedmetadata', loadedmetadata);
	}

	if (document.readyState == 'complete') ready();
	else window.addEventListener('load', ready);
};

TEController.prototype = {
	getSubController: function (classNames) {
		for (let subCtrl, i = 0; i < this.subControllers.length, subCtrl = this.subControllers[i]; i++) {
			if (subCtrl instanceof classNames) return subCtrl;
		}
		return null;
	},

	getSubControllers: function (classNames) {
		const subCtrls = [];
		for (let subCtrl, i = 0; i < this.subControllers.length, subCtrl = this.subControllers[i]; i++) {
			if (subCtrl instanceof classNames) subCtrls.push(subCtrl);
		}
		return subCtrls;
	},

	addSubController: function (subCtrl) {
		try {
			if (subCtrl.init) subCtrl.init(self);
		} catch (e) {
			console.error(subCtrl.constructor.name + '.init:', e);
		}
		if (this.media.readyState >= HTMLMediaElement.HAVE_METADATA) {
			try {
				if (subCtrl.ready) subCtrl.ready(self);
			} catch (e) {
				console.error(subCtrl.constructor.name + '.ready:', e);
			}
		}
		this.subControllers.push(subCtrl);
	},

	selector: function (className) {
		return this.queryPrefix + className[0].toUpperCase() + className.substr(1);
	},

	query: function (className) {
		return teMgr.query(this.selector(className), this.element);
	},

	queryAll: function (className) {
		return teMgr.queryAll(this.selector(className), this.element);
	},

	bind: function (element, event, method, options) {
		var binded = method.bind(this);
		element.addEventListener(event, binded, options);
		return binded;
	},

	bindButton: function (button, method) {
		const binded = method.bind(this);
		button.addEventListener('click', binded);
		return binded;
	},

	dispatch: function (eventName, element) {
		if (this.subControllers) {
			for (let i = 0; i < this.subControllers.length; i++) {
				const subCtrl = this.subControllers[i];
				try {
					if (subCtrl[eventName]) {
						if (!element) subCtrl[eventName](this);
						else if (!subCtrl.handle || subCtrl.handle(element)) subCtrl[eventName](element, this);
					}
				} catch (e) {
					console.error(subCtrl.constructor.name + '.' + eventName + ':', e);
				}
			}
		}
	},

	updateSegments: function () {
		const self = this;
		const segments = teMgr.queryAll(this.element.dataset.teSegments || '[data-te-start],[data-te-segment-target]', this.container);
		this.segmentsData = new Map();
		for (let segment, i = 0; i < segments.length, segment = segments[i]; i++) {
			const target = segment.dataset.teSegmentTarget;
			let targetSegment, start, end;
			if (target) {
				targetSegment = document.getElementById(target);
				start = parseFloat(targetSegment.dataset.teStart);
				end = parseFloat(targetSegment.dataset.teEnd);
			} else {
				start = parseFloat(segment.dataset.teStart);
				end = parseFloat(segment.dataset.teEnd);
			}
			this.segmentsData.set(segment, {start: start, end: end});
		}
		this.segments = segments.sort(function (segment1, segment2) {
			const data1 = self.segmentsData.get(segment1);
			const data2 = self.segmentsData.get(segment2);
			return data1.start - data2.start;
		});
	},

	updatePoints: function () {
		const self = this;
		const points = teMgr.queryAll(this.element.dataset.tePause || '[data-te-position],[data-te-point-target]', this.container);
		this.pointsData = new Map();
		for (let point, i = 0; i < points.length, point = points[i]; i++) {
			const target = point.dataset.tePointTarget;
			let targetPoint, position;
			if (target) {
				targetPoint = document.getElementById(target);
				position = parseFloat(targetPoint.dataset.tePosition);
			} else {
				position = parseFloat(point.dataset.tePosition);
			}
			const interactive = point.localName == 'a' || point.localName == 'button' || point.localName == 'input';
			this.pointsData.set(point, {position: position, interactive: interactive});

			if (interactive) {
				point.addEventListener('click', function (event) {
					self.media.currentTime = self.pointsData.get(this).position;
					event.preventDefault();
				})
			}
		}
		this.points = points.sort(function (point1, point2) {
			const data1 = self.pointsData.get(point1);
			const data2 = self.pointsData.get(point2);
			return data1.position - data2.position;
		});
	},

	updateTime: function () {
		const currentTime = this.media.currentTime;
		const formattedTime = teMgr.formatTime(currentTime);
		const formattedLongTime = teMgr.formatTime(currentTime || 0, true);
		const formattedLongDuration = teMgr.formatTime(this.media.duration || 0, true);

		// Mise à jour du temps courant et du curseur de lecture
		if (this.currentTimeLabel) {
			this.currentTimeLabel.firstElementChild.textContent = formattedTime;
			this.currentTimeLabel.ariaLabel = formattedLongTime;
		}
		if (this.seekInput && !this.seekDragging) {
			this.seekInput.value = currentTime;
			this.seekInput.setAttribute('value', currentTime);
			this.seekInput.setAttribute("aria-valuenow", currentTime);
			this.seekInput.setAttribute("aria-valuetext", `${formattedLongTime} sur ${formattedLongDuration}`);
			this.seekInput.style.setProperty("--value", currentTime * 100 / this.media.duration + '%');

		}

		if (this.currentTimeline) {
			if (this.previousTimeBtn) this.previousTimeBtn.disabled = !this.currentTimes.length || currentTime <= this.currentTimes[0];
			if (this.nextTimeBtn) this.nextTimeBtn.disabled = !this.currentTimes.length || currentTime >= this.currentTimes[this.currentTimes.length - 1];
		}

		if (this.points.length || this.segments.length) this.updateStates();

		this.lastTimeUpdate = currentTime;
	},

	updateDuration: function () {
		const self = this;
		const duration = this.media.duration;
		if (duration == 0 || duration == Infinity) return;
		if (this.durationLabel) {
			this.durationLabel.firstElementChild.textContent = teMgr.formatTime(duration);
			this.durationLabel.ariaLabel = teMgr.formatTime(duration, true);
		}
		if (this.seekInput) {
			this.seekInput.max = duration;
			this.seekInput.setAttribute("aria-valuemax", duration);
		}
		this.segments.forEach(function (segment) {
			let styles = segment.dataset.teStyles;
			if (styles) {
				styles = styles.split(' ');
				styles.forEach(function (style) {
					const data = self.segmentsData.get(segment);
					if (style == 'width') {
						segment.style.width = ((data.end - data.start) * 100 / duration) + '%';
					} else if (style == 'left' || style == 'margin-left') {
						segment.style[style] = (data.start * 100 / duration) + '%';
					}
				});
			}
		});
		this.points.forEach(function (point) {
			let styles = point.dataset.teStyles;
			if (styles) {
				styles = styles.split(' ');
				styles.forEach(function (style) {
					const data = self.pointsData.get(point);
					if (style == 'width') point.style.width = 0;
					else if (style == 'left' || style == 'margin-left') {
						point.style[style] = (data.position * 100 / duration) + '%';
					}
				});
			}
		});
	},

	updateMediaType: function () {
		const media = this.media.originalNode || this.media;
		const isNative = !this.media.renderer || /html5|native/i.test(this.media.rendererName);
		if (!isNative || media.videoWidth || media.poster) {
			this.container.classList.remove('teAudioType');
			this.container.classList.add('teVideoType');
		} else {
			this.container.classList.remove('teVideoType');
			this.container.classList.add('teAudioType');
		}
		if (media.videoHeight) {
			const aspectRatio = media.videoWidth / media.videoHeight;
			this.container.style.setProperty("--te-video-aspect-ratio", aspectRatio);
			media.style.aspectRatio = "var(--te-video-aspect-ratio)";
			this.container.classList.toggle("tePortrait", media.videoHeight > media.videoWidth);
		} else {
			media.style.aspectRatio = '';
			this.container.style.setProperty("--te-video-aspect-ratio", '');
			this.container.classList.remove("tePortrait");
		}
		if (!isNative) {
			this.media.classList.add('teNotNative');
		} else {
			this.media.classList.remove('teNotNative');
		}
	},

	updateVolume: function () {
		if (this.fadeInterval) return;
		if (this.muteBtn) {
			if (this.media.muted || this.media.volume == 0) {
				this.muteBtn.setAttribute('data-pressed', true);
			} else {
				this.muteBtn.setAttribute('data-pressed', false);
			}
		}
		if (this.volumeInput) {
			const volume = this.media.muted ? 0 : this.media.volume * 100;
			this.volumeInput.value = volume;
			this.volumeInput.setAttribute('value', volume);
			this.volumeInput.setAttribute("aria-valuenow", volume);
			this.volumeInput.setAttribute("aria-valuetext", volume + "%");
			this.volumeInput.style.setProperty("--value", volume + '%');
		}
	},

	updateStates: function () {
		this.dispatch('beforeUpdateState');
		const currentTime = this.media.currentTime;

		const toActivates = [];

		this.currentActives = [];
		for (let point, i = 0; i < this.points.length, point = this.points[i]; i++) {
			const data = this.pointsData.get(point);

			if (currentTime < data.position - 0.25) {
				if (!point.classList.contains('teIdle')) {
					point.classList.remove('teActive');
					point.classList.remove('teDone');
					point.classList.add('teIdle');
					this.dispatch('idle', point);
				}
			} else if (currentTime >= data.position + 0.25) {
				if (!point.classList.contains('teDone')) {
					point.classList.remove('teActive');
					point.classList.remove('teIdle');
					point.classList.add('teDone');
					this.dispatch('done', point);
				}
			} else if (this.currentPause != point &&
				((currentTime >= data.position - 0.25 && currentTime < data.position + 0.25) ||
					(this.lastTimeUpdate < data.position && currentTime > data.position))) {
				if (!point.classList.contains('teActive')) {
					toActivates.push(point);
				}
				this.currentActives.push(point);
			}
		}

		for (let segment, i = 0; i < this.segments.length, segment = this.segments[i]; i++) {
			const data = this.segmentsData.get(segment);

			if (currentTime < data.start) {
				if (!segment.classList.contains('teIdle')) {
					segment.classList.remove('teActive');
					segment.classList.remove('teDone');
					segment.classList.add('teIdle');
					this.dispatch('idle', segment);
				}
			} else if (currentTime >= data.end) {
				if (!segment.classList.contains('teDone')) {
					segment.classList.remove('teActive');
					segment.classList.remove('teIdle');
					segment.classList.add('teDone');
					this.dispatch('done', segment);
				}
			} else {
				if (!segment.classList.contains('teActive')) {
					toActivates.push(segment);
				}
				this.currentActives.push(segment);
			}
		}

		for (let toActivate, i = 0; i < toActivates.length, toActivate = toActivates[i]; i++) {
			toActivate.classList.remove('teIdle');
			toActivate.classList.remove('teDone');
			toActivate.classList.add('teActive');
			this.dispatch('active', toActivate);
		}

		this.dispatch('afterUpdateState');
	},

	updatePlayingState: function () {
		const self = this;
		if (this.media.seeking) {
			if (!this.seekTimeout) {
				this.container.classList.remove('tePaused');
				this.container.classList.remove('tePlaying');
				this.seekTimeout = setTimeout(function () {
					self.container.classList.add('teSeeking');
					if (self.previousTimeBtn) self.previousTimeBtn.disabled = true;
					if (self.nextTimeBtn) self.nextTimeBtn.disabled = true;
				}, 500);
			}
		} else {
			clearTimeout(this.seekTimeout);
			this.seekTimeout = null;
			if (this.media.paused || this.media.ended) {
				this.container.classList.remove('teSeeking');
				this.container.classList.remove('tePlaying');
				this.container.classList.add('tePaused');
				this.playPauseBtn.setAttribute('data-pressed', false);
			} else {
				this.container.classList.remove('teSeeking');
				this.container.classList.remove('tePaused');
				this.container.classList.add('tePlaying');
				this.container.classList.add('tePlayed');
				this.playPauseBtn.setAttribute('data-pressed', true);
			}
		}
		this.dispatch('updatePlayingState');
	},

	playPause: function () {
		const self = this;

		const fadeDuration = this.playPauseBtn.dataset.teFadeDuration;
		if (this.media.currentTime && fadeDuration) {
			let volume = this.media.volume;
			let initialVolume;
			if (this.fadeInterval) {
				clearInterval(this.fadeInterval);
				self.fadeInterval = null;
				this.media.volume = volume = initialVolume = this.fadeInitialVolume;
			} else {
				initialVolume = this.fadeInitialVolume = volume;
			}
			const toPause = !this.media.paused && !this.media.end;
			if (!toPause) {
				this.media.volume = volume = 0;
				this.media.play();
			}
			const delta = 1 / (fadeDuration / 25);
			this.fadeInterval = setInterval(function () {
				if (toPause && volume > 0) {
					volume -= Math.min(delta, volume);
					self.media.volume = volume;
				} else if (!toPause && volume < initialVolume) {
					volume += Math.min(delta, initialVolume - volume);
					self.media.volume = volume;
				} else {
					if (toPause) self.media.pause();
					clearInterval(self.fadeInterval);
					self.fadeInterval = null;
					self.updateVolume();
					self.media.volume = initialVolume;
				}
			}, 25)
		} else {
			if (this.media.paused || this.media.ended) this.media.play();
			else this.media.pause();
		}
	},

	videoPlayPause: function (event) {
		if (event && event.target !== this.media) return;

		// Pas sur le double clic
		if (event && event.detail > 1) {
			clearTimeout(this.videoPlayPauseTimeout);
			return;
		}

		const self = this;
		const fadeDuration = this.playPauseBtn.dataset.teFadeDuration;
		if (fadeDuration) {
			if (this.media.paused || this.media.ended) {
				this.container.classList.add('teVideoPlay');
				setTimeout(function () {
					self.container.classList.remove('teVideoPlay');
				}, parseInt(fadeDuration));
			} else {
				this.container.classList.add('teVideoPause');
				setTimeout(function () {
					self.container.classList.remove('teVideoPause');
				}, parseInt(fadeDuration));
			}
		}

		this.videoPlayPauseTimeout = setTimeout(function () {
			self.playPauseBtn.click();
			self.playPauseBtn.focus();
		}, 300);
	},

	previousTime: function () {
		const currentTime = this.media.currentTime;
		for (let i = this.currentTimes.length - 1; i >= 0; i--) {
			const time = this.currentTimes[i];
			if (time + 0.25 <= currentTime) {
				this.media.currentTime = time;
				return;
			}
		}
	},

	nextTime: function () {
		const currentTime = this.media.currentTime;
		for (let i = 0; i < this.currentTimes.length; i++) {
			const time = this.currentTimes[i];
			if (time - 0.25 >= currentTime) {
				this.media.currentTime = time;
				return;
			}
		}
	},

	previousTimeline: function () {
		let index = this.timelines.indexOf(this.currentTimeline);
		if (index-- > 0) this.selectTimeline(this.timelines[index]);
	},

	nextTimeline: function () {
		let index = this.timelines.indexOf(this.currentTimeline);
		if (index++ < this.timelines.length) this.selectTimeline(this.timelines[index]);
	},

	selectTimeline: function (timeline) {
		if (this.currentTimeline) this.currentTimeline.classList.remove('teCurrent');
		this.currentTimeline = timeline;
		this.currentTimeline.classList.add('teCurrent');
		this.currentTimes = [];
		for (let point, i = 0; i < this.points.length, point = this.points[i]; i++) {
			if (this.currentTimeline.contains(point)) {
				this.currentTimes.push(this.pointsData.get(point).position);
			}
		}

		const index = this.timelines.indexOf(timeline);
		if (this.previousTimelineBtn) {
			if (index > 0) {
				this.previousTimelineBtn.disabled = false;
				this.previousTimelineBtn.title = this.timelines[index - 1].title;
			} else {
				this.previousTimelineBtn.disabled = true;
				this.previousTimelineBtn.title = '';
			}
		}
		if (this.nextTimelineBtn) {
			if (index < this.timelines.length - 1) {
				this.nextTimelineBtn.disabled = false;
				this.nextTimelineBtn.title = this.timelines[index + 1].title;
			} else {
				this.nextTimelineBtn.disabled = true;
				this.nextTimelineBtn.title = '';
			}
		}

		if (this.previousTimeBtn) this.previousTimeBtn.title = timeline.dataset.tePreviousTitle;
		if (this.nextTimeBtn) this.nextTimeBtn.title = timeline.dataset.teNextTitle;
	},

	showSubtitle: async function (trackElem, destElt) {
		const self = this;
		if (!(destElt instanceof Element)) destElt = this.container.querySelector(destElt);

		destElt.hidden = !trackElem;

		if (this.currentSubtitle) {
			while (destElt.lastChild) destElt.removeChild(destElt.lastChild);
			this.media.removeEventListener('timeupdate', this.currentSubtitle.listener);
			this.currentSubtitle = null;
		}

		if (!trackElem) return;

		function setSubtitle() {
			self.currentSubtitle = subTitle;
			self.media.addEventListener('timeupdate', subTitle.listener);
			subTitle.listener();
		}

		let subTitle = this.subtitles[trackElem.src];
		if (subTitle) setSubtitle();
		else {
			const track = trackElem.track;
			trackElem.addEventListener('load', function () {
				subTitle = self.subtitles[trackElem.src] = {cues: Array.from(track.cues)};

				subTitle.listener = function () {
					const currentCues = subTitle.cues.filter(function (cue) {
						return cue.startTime <= self.media.currentTime && cue.endTime > self.media.currentTime;
					});
					if (!self.currentSubCues || self.currentSubCues.length != currentCues.length || currentCues.some(function (cue, i) {
						return self.currentSubCues[i] != cue;
					})) {
						while (destElt.lastChild) destElt.lastChild.remove();

						currentCues.forEach(function (cue) {
							const div = destElt.appendChild(document.createElement('div'));
							div.appendChild(cue.getCueAsHTML());
						});
						self.currentSubCues = currentCues;
					}
				};

				setSubtitle();
			});
			track.mode = "hidden";
		}
	},

	addAudio: function (src) {
		const self = this;
		if (!this.addAudios) this.addAudios = {};
		const audio = this.addAudios[src] = document.createElement('audio');
		audio.addEventListener('loadedmetadata', function () {
			audio.currentTime = self.media.currentTime;
			if (!self.media.paused) audio.play();
			audio.volume = self.media.volume;
			audio.muted = self.media.muted;
		});
		self.media.addEventListener('pause', function () {
			audio.pause();
		});
		self.media.addEventListener('play', function () {
			audio.currentTime = self.media.currentTime;
			audio.play();
		});
		self.media.addEventListener('volumechange', function () {
			audio.volume = self.media.volume;
			audio.muted = self.media.muted;
		});
		self.media.addEventListener('seeked', function () {
			audio.currentTime = self.media.currentTime;
		});
		audio.src = src;
		this.container.appendChild(audio);
	},

	removeAudio: function (src) {
		if (this.addAudios[src]) this.addAudios[src].remove();
	},

	switchMedia: function (src, type) {
		const self = this;
		this.originalSrc = this.media.src;
		const currentTime = this.media.currentTime;
		// MediaElement
		if (this.media.setSrc && type) this.media.setSrc({src: src, type: type});
		else this.media.src = src;

		this.media.addEventListener('loadedmetadata', function () {
			self.media.currentTime = currentTime;
		});
	},

	restoreMedia: function () {
		const self = this;
		const currentTime = this.media.currentTime;
		this.media.src = this.originalSrc;
		this.media.addEventListener('loadedmetadata', function () {
			self.media.currentTime = currentTime;
		});
	},

	pressedObserver: new MutationObserver(function (records) {
		records.forEach(function (record) {
			const btn = record.target;
			let dispatchChange = false;
			if (record.attributeName == 'data-pressed') {
				const pressed = btn.dataset.pressed;
				if (record.oldValue == pressed) return;
				if (pressed == 'true') {
					if (btn.dataset.pressedTitle) {
						if (!btn.dataset.title) btn.dataset.title = btn.title;
						btn.title = btn.dataset.pressedTitle;
						if (btn.firstElementChild) btn.firstElementChild.textContent = btn.dataset.pressedTitle;
					}
				} else {
					if (btn.dataset.title) {
						btn.title = btn.dataset.title;
						if (btn.firstElementChild) btn.firstElementChild.textContent = btn.dataset.title;
					}
				}
				dispatchChange = true;
			} else if (record.attributeName == 'aria-expanded') {
				const expanded = btn.getAttribute('aria-expanded');
				if (record.oldValue == expanded) return;
				dispatchChange = true;
			} else if (record.attributeName == 'checked') {
				if (btn.checked) {
					btn.title = btn.dataset.checkedTitle;
					if (btn.firstElementChild) btn.firstElementChild.textContent = btn.dataset.checkedTitle;
				} else {
					btn.title = btn.dataset.title;
					if (btn.firstElementChild) btn.firstElementChild.textContent = btn.dataset.title;
				}
			}
			if (dispatchChange) {
				btn.dispatchEvent(new CustomEvent("change"));
			}
		});
	}),

	initPressButtons: function () {
		const self = this;
		const buttons = this.element.querySelectorAll('[data-pressed],[aria-expanded]');
		Array.prototype.forEach.call(buttons, function (btn) {
			self.initPressButton(btn);
		});
	},

	initPressButton: function (btn) {
		const self = this;
		if ('noToggle' in btn.dataset) return;
		btn.addEventListener('click', function (ev) {
			const pressed = this.dataset.pressed;
			if (pressed) {
				if (pressed == 'true') this.dataset.pressed = 'false';
				else this.dataset.pressed = 'true';
			} else {
				const expanded = this.getAttribute('aria-expanded');
				if (expanded == 'true') {
					this.setAttribute('aria-expanded', 'false');
				} else {
					this.setAttribute('aria-expanded', 'true');
				}
			}
		});
		self.pressedObserver.observe(btn, {attributes: true, attributeFilter: ['data-pressed', 'checked', 'aria-expanded'], attributeOldValue: true});
	},


};
