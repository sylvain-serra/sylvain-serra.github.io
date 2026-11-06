TESettingsFromTracks = function (classPrefix, insertBefore, subTitlesArea, transcriptArea, transcriptSubWin) {
	this.classPrefix = classPrefix;
	this.insertBefore = insertBefore;
	this.subTitlesArea = subTitlesArea || '.' + this.classPrefix + 'SubtitlesArea';
	this.transcriptArea = transcriptArea || '.' + this.classPrefix + 'TranscriptArea';
};

TESettingsFromTracks.ctrlCount = 0;

TESettingsFromTracks.prototype = {
	ready: function (ctrl) {
		const self = this;
		this.id = TESettingsFromTracks.ctrlCount++;
		this.inputCount = 0;
		this.focusWalker = document.createTreeWalker(ctrl.container, NodeFilter.SHOW_ELEMENT, (elem) => {
			if (elem.hidden) return NodeFilter.FILTER_REJECT;
			else if (elem.matches('input,button,a,[tabindex]:not([tabindex="-1"])')) return NodeFilter.FILTER_ACCEPT;
			else return NodeFilter.FILTER_SKIP;
		});

		this.ctrl = ctrl;
		this.insertBefore = ctrl.container.querySelector(this.insertBefore);
		this.subTitlesArea = ctrl.container.querySelector(this.subTitlesArea);

		const media = ctrl.media.originalNode || ctrl.media;
		const subtitleTracks = [];
		let altVideoTrack, audioDescTrack, transcriptTrack;
		for (let child = media.firstElementChild; child; child = child.nextElementSibling) {
			const kind = child.getAttribute('kind');
			if (child.localName == 'track' || child.localName == 'text-track') {
				if (kind == 'subtitles') subtitleTracks.push(child);
			} else if (child.localName == 'audio-track') {
				if (kind == 'descriptions') audioDescTrack = child;
			} else if (child.localName == 'video-track') {
				if (kind == 'sign') altVideoTrack = child;
			} else if (child.localName == 'html-track') {
				if (kind == 'captions') transcriptTrack = child;
			} else if (child.localName == 'nav-track') {
				if (kind == 'captions') transcriptTrack = child;
			}
		}

		const settingsList = document.createElement('ul');
		settingsList.className = this.classPrefix + 'SettingsList';
		const settingsBtn = this.createExpandButton(
			this.classPrefix + 'SettingsBtn',
			"Options d\'accessibilité",
			"Afficher les options d\'accessibilité",
			true);

		function updateVisibility() {
			settingsBtn.hidden = Array.prototype.every.call(settingsList.children, function (child) {
				return child.hidden
			});
		}

		this.subTitlesArea.hidden = true;
		if (subtitleTracks.length) {
			const subtitlesList = document.createElement('ul');
			subtitlesList.className = this.classPrefix + 'SubtitlesList';
			subtitlesList.appendChild(self.createSubtitleItem(null));
			subtitleTracks.forEach(function (track) {
				subtitlesList.appendChild(self.createSubtitleItem(track));
			});

			const subtitlesItem = settingsList.appendChild(document.createElement('li'));
			const subtitlesBtn = subtitlesItem.appendChild(this.createExpandButton(
				this.classPrefix + 'SubtitlesBtn',
				"Sous-titres",
				"Afficher la liste des sous-titres")
			);
			subtitlesItem.appendChild(this.createPanel(subtitlesBtn, this.classPrefix + 'SubtitlesPanel', subtitlesList));
		}

		if (audioDescTrack) {
			const audioDescItem = settingsList.appendChild(document.createElement('li'));
			const audioDescInput = audioDescItem.appendChild(this.createInput(
				this.classPrefix + 'AudioDesc',
				'checkbox',
				"Audio-description",
				"Écouter l\'audio-description",
				"Arrêter l\'audio-description")
			);
			audioDescInput.firstElementChild.onchange = function () {
				const src = audioDescTrack.getAttribute('src');
				if (this.checked) ctrl.addAudio(src);
				else ctrl.removeAudio(src)
			}
		}

		if (altVideoTrack) {
			const altVideoItem = settingsList.appendChild(document.createElement('li'));
			const altVideoInput = altVideoItem.appendChild(this.createInput(
				this.classPrefix + 'AltVideo',
				'checkbox',
				"Alternative vidéo (LSF, LPC)",
				"Regarder l\'alternative vidéo",
				"Quitter l\'alternative vidéo")
			);
			altVideoInput.firstElementChild.onchange = function () {
				if (this.checked) ctrl.switchMedia(altVideoTrack.getAttribute('src'), altVideoTrack.getAttribute('type'));
				else ctrl.restoreMedia()
			}
		}

		const qualities = ctrl.media.renderer && ctrl.media.renderer.getQualities && ctrl.media.renderer.getQualities();
		// Si il y a une gestion de la qualité, getQualities retourne un tableaux (qui peut être vide)
		if (qualities) {
			const qualitiesItem = settingsList.appendChild(document.createElement('li'));
			qualitiesItem.hidden = true;
			const qualitiesBtn = qualitiesItem.appendChild(this.createExpandButton(
				this.classPrefix + 'QualitiesBtn',
				"Qualité",
				"Afficher les différentes qualités disponibles")
			);
			qualitiesItem.appendChild(qualitiesBtn);

			let qualitiesPanel = null;

			function updateQualities(qualities) {
				if (qualitiesPanel) qualitiesItem.removeChild(qualitiesPanel);
				if (qualities.length) {
					qualitiesItem.hidden = false;
					const qualitiesList = document.createElement('ul');
					qualitiesList.className = self.classPrefix + 'QualitiesList';

					const currentQuality = ctrl.media.renderer.getQuality();
					for (let i = 0; i < qualities.length; i++) {
						const quality = qualities[i];
						qualitiesList.appendChild(self.createQualityItem(quality, quality.value == currentQuality));
					}
					qualitiesPanel = self.createPanel(qualitiesBtn, self.classPrefix + 'QualitiesPanel', qualitiesList);
					qualitiesItem.appendChild(qualitiesPanel);
				} else {
					qualitiesItem.hidden = true;
				}
				updateVisibility();
			}

			updateQualities(qualities);

			ctrl.media.addEventListener('me-qualitiesavailable', function () {
				updateQualities(ctrl.media.renderer.getQualities());
			});

			ctrl.media.addEventListener('me-qualitychange', function () {
				let input = qualitiesItem.querySelector('input:checked');
				if (input) input.checked = false;
				const currentQuality = ctrl.media.renderer.getQuality();
				input = qualitiesItem.querySelector('input[value="' + currentQuality + '"]');
				if (input) input.checked = true;
			});
		}

		if (!ctrl.media.renderer || ctrl.media.renderer.getPlaybackRate() !== null) {
			const playbackRatesList = document.createElement('ul');
			playbackRatesList.className = this.classPrefix + 'PlaybackRatesList';
			const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
			playbackRates.forEach(function (playbackRate) {
				playbackRatesList.appendChild(self.createPlaybackRateItem(playbackRate));
			});

			const playbackRatesItem = settingsList.appendChild(document.createElement('li'));
			const playbackRatesBtn = playbackRatesItem.appendChild(this.createExpandButton(
				this.classPrefix + 'PlaybackRatesBtn',
				"Vitesse de lecture",
				"Afficher les différentes vitesses de lecture")
			);
			playbackRatesItem.appendChild(this.createPanel(playbackRatesBtn, self.classPrefix + 'PlaybackRatesPanel', playbackRatesList));

			function updateRateItem() {
				let input = playbackRatesItem.querySelector('input:checked');
				if (input) input.checked = false;
				input = playbackRatesItem.querySelector('input[value="' + ctrl.media.playbackRate + '"]');
				if (input) input.checked = true;
			}

			ctrl.media.addEventListener('ratechange', updateRateItem);
			updateRateItem();
		}

		if (transcriptTrack) {
			const transcriptType = transcriptTrack.getAttribute('type');
			const transcriptSrc = transcriptTrack.getAttribute('src');
			const transcriptItem = settingsList.appendChild(document.createElement('li'));
			if (transcriptTrack.localName == 'html-track') {
				const transcriptInput = transcriptItem.appendChild(this.createInput(
					this.classPrefix + 'Transcript',
					'checkbox',
					"Transcription",
					"Afficher la transcription",
					"Cacher la transcription")
				);

				function loadTranscript(area, anchor) {
					if (transcriptType == "text/vtt" && transcriptSrc) {
						teMgr.parseVTTTranscript(transcriptSrc, area, anchor);
					} else {
						const content = document.createRange();
						content.selectNodeContents(transcriptTrack);
						area.appendChild(content.extractContents());
					}
					transcriptTrack.parentNode.removeChild(transcriptTrack);
				}

				const transcriptArea = ctrl.container.querySelector(self.transcriptArea);
				if (transcriptArea) {
					transcriptArea.hidden = true;
					transcriptInput.firstElementChild.onchange = function () {
						if (this.checked) {
							if (transcriptTrack.parentNode) loadTranscript(transcriptArea);
							ctrl.container.classList.add('teActiveTranscript');
							transcriptArea.hidden = false;
							setTimeout(() => transcriptArea.focus(), 100);
						} else {
							ctrl.container.classList.remove('teActiveTranscript');
							transcriptArea.hidden = true;
						}
					};
					const subLabelElt = transcriptInput.lastElementChild.appendChild(document.createElement('span'));
					subLabelElt.className = this.classPrefix + 'VisuallyHidden';
					subLabelElt.textContent = " affichée après le lecteur";
				} else {
					const transcriptPanel = self.createPanel(transcriptInput.firstElementChild, self.classPrefix + 'TranscriptPanel', () => {
						const transcriptArea = document.createElement('div');
						transcriptArea.className = this.classPrefix + 'TranscriptArea';
						loadTranscript(transcriptArea, self.ctrl.container);
						return transcriptArea;
					});
					ctrl.element.insertBefore(transcriptPanel, this.insertBefore);
				}
			} else if (transcriptTrack.localName == 'nav-track') {
				const transcriptTarget = transcriptTrack.getAttribute('target');
				const transcriptLink = transcriptItem.appendChild(document.createElement('a'));
				transcriptLink.textContent = "Transcription";
				transcriptLink.href = transcriptSrc;
				transcriptLink.className = this.classPrefix + 'Transcript ' + this.classPrefix + 'Button';
				transcriptLink.title = "Afficher la transcription";
				transcriptLink.href = transcriptSrc;

				if (transcriptTarget == "subWindow") {
					const transcriptWinName = transcriptTrack.getAttribute('windowName') || "";
					let transcriptWinOptions = transcriptTrack.getAttribute('windowOptions')
					if (transcriptWinOptions !== null) transcriptWinOptions = JSON.parse(transcriptWinOptions);
					else transcriptWinOptions = {CLOSEBTNTI: 'Fermer'};
					transcriptLink.addEventListener('click', function (ev) {
						scDynUiMgr.displaySubWindow(this, transcriptLink.href, transcriptWinName, transcriptWinOptions);
						ev.preventDefault();
					});
				} else if (transcriptTarget == "download") {
					transcriptLink.setAttribute("download", "");
				} else if (transcriptTarget == "newWindow") {
					transcriptLink.addEventListener('click', function () {
						window.open(transcriptSrc, "_blank");
					});
				}
			}
		}

		const settingsPanel = this.createPanel(settingsBtn, this.classPrefix + 'SettingsPanel', settingsList);
		updateVisibility();
		ctrl.element.insertBefore(settingsBtn, this.insertBefore);
		ctrl.element.insertBefore(settingsPanel, this.insertBefore);

		// Activation des boutons sur la touche Espace
		// Ne concerne pas que les settings, mais géré ici pour centraliser les listeners d'accessibilité
		ctrl.element.addEventListener('keydown', function (ev) {
			if (ev.target.localName == "button" && ev.code == "Space") {
				ev.target.click();
				ev.preventDefault();
				ev.stopPropagation();
				ev.stopImmediatePropagation();
			}
		});
	},

	createPanel: function (btn, className, content) {
		const self = this;
		const panel = document.createElement('div');
		panel.hidden = true;
		panel.id = this.classPrefix + 'Panel_' + this.id + '_' + this.inputCount++;
		panel.className = className + " " + this.classPrefix + 'Panel';
		panel.appendChild(content);

		btn.ariaExpanded = false;
		btn.ariaHasPopup = true;
		btn.setAttribute('aria-controls', panel.id);

		function closePanel() {
			if (!panel.hidden) btn.click();
		}

		function mouseUpListener(ev) {
			if (ev.target != btn && !panel.contains(ev.target)) closePanel();
		}

		function focusInListener(ev) {
			if (!panel.contains(ev.target)) closePanel();
		}

		btn.addEventListener('click', function (ev) {
			if (panel.hidden) {
				window.addEventListener('mouseup', mouseUpListener);
				window.addEventListener('focusin', focusInListener);
				panel.hidden = false;
				self.focusWalker.currentNode = panel;
				let firstFocusable = self.focusWalker.nextNode();
				if (firstFocusable) {
					if (firstFocusable.matches("input[type=radio]")) {
						while (!firstFocusable.checked) firstFocusable = self.focusWalker.nextNode();
					}
					firstFocusable.focus();
				}
			} else {
				window.removeEventListener('mouseup', mouseUpListener);
				window.removeEventListener('focusin', focusInListener);
				if (panel.contains(document.activeElement)) btn.focus();
				panel.hidden = true;
			}
			ev.stopPropagation();
		});

		// Safari change le focus au moment du mousedown, ce qui casse la gestion du focus lors du click
		btn.addEventListener('mousedown', (ev) => {
			ev.preventDefault();
		});


		panel.addEventListener('change', function (ev) {
			if (!ev.target.matches("input[type=radio]")) setTimeout(closePanel, 200);
		});

		function cancelEvent(ev, allowDefault) {
			if (!allowDefault) ev.preventDefault();
			ev.stopImmediatePropagation();
		}

		panel.addEventListener('keydown', function (ev) {
			const active = document.activeElement;
			if (active.closest(`.${self.classPrefix}Panel`) === panel) {
				const isRadio = active.matches("input[type=radio]");
				if (ev.key == "Escape") {
					closePanel();
					cancelEvent(ev);
				} else if (ev.key == "Enter") {
					if (isRadio) {
						setTimeout(closePanel, 100);
						cancelEvent(ev);
					}
				} else if (ev.key == "ArrowDown") {
					if (!isRadio) {
						self.focusWalker.currentNode = active;
						self.focusWalker.nextNode()?.focus();
					}
					cancelEvent(ev, true);
				} else if (ev.key == "ArrowUp") {
					if (!isRadio) {
						self.focusWalker.currentNode = active;
						self.focusWalker.previousNode()?.focus();
					}
					cancelEvent(ev, true);
				} else if (ev.key == "ArrowLeft") {
					if (active.matches("button")) active.click();
					cancelEvent(ev);
				} else if (ev.key == "ArrowRight") {
					setTimeout(closePanel);
					cancelEvent(ev);
				} else if (ev.key == "Tab") {
					if (isRadio) {
						if (ev.shiftKey) {
							self.focusWalker.currentNode = active;
							self.focusWalker.previousNode()?.focus();
						} else {
							self.focusWalker.currentNode = active;
							self.focusWalker.nextNode()?.focus();
						}
						cancelEvent(ev);
					}
				}
			}
		});

		panel.addEventListener('pointerdown', function (ev) {
			const target = ev.target.localName == "label" ? ev.target.htmlFor && document.getElementById(ev.target.htmlFor) : ev.target;
			if (target && target.matches("input")) {
				// Gestion manuelle de la sélection et annulation de l'event
				// Sinon le parent le plus proche avec tabindex="-1" prend le focus avant que celui-ci revienne à l'input (ce qui ferme le panneau)
				if (target.type == "radio") {
					if (!target.checked) target.click();
					setTimeout(closePanel, 100);
				}
				cancelEvent(ev);
			}
		});

		return panel;
	},

	createButton: function (className, label, title, labelHidden) {
		const btn = document.createElement('button');
		btn.className = className + ' ' + this.classPrefix + 'Button';
		btn.title = title;
		const span = btn.appendChild(document.createElement('span'));
		span.textContent = label;
		if (labelHidden) span.className = this.classPrefix + 'VisuallyHidden';
		return btn;
	},


	createPressButton: function (className, label, title, pressedTitle, labelHidden) {
		const btn = this.createButton(className, label, title, labelHidden);
		btn.setAttribute('aria-pressed', 'false');
		btn.dataset.pressedTitle = pressedTitle;
		return btn;
	},

	createExpandButton: function (className, label, title, labelHidden) {
		const btn = this.createButton(className, label, title, labelHidden);
		btn.setAttribute('aria-expanded', 'false');
		return btn;
	},

	createInput: function (className, type, label, title, checkedTitle, value, subLabel) {
		const parentElt = document.createElement('div');
		const input = parentElt.appendChild(document.createElement('input'));
		input.type = type;
		input.id = this.classPrefix + 'Input_' + this.id + '_' + this.inputCount++;
		input.classList.add(this.classPrefix + 'VisuallyHidden');
		if (value !== undefined) input.value = value;

		const labelElt = parentElt.appendChild(document.createElement('label'));
		labelElt.className = className + ' ' + this.classPrefix + 'Button';
		labelElt.htmlFor = input.id;
		labelElt.textContent = label;
		if (title) {
			labelElt.title = title;
			if (checkedTitle) input.addEventListener('change', function () {
				if (this.checked) labelElt.title = checkedTitle;
				else labelElt.title = title;
			});
		}
		if (subLabel) {
			labelElt.textContent += " ";
			const subLabelElt = labelElt.appendChild(document.createElement('span'));
			subLabelElt.className = this.classPrefix + 'VisuallyHidden';
			subLabelElt.textContent = subLabel;
		}
		input.addEventListener('keydown', function (ev) {
			if (ev.key == "Enter" || ev.key == "Space") {
				setTimeout(() => this.click());
			}
		});
		return parentElt;
	},

	createSubtitleItem: function (trackElem) {
		const self = this;
		const item = document.createElement('li');
		if (trackElem && trackElem.localName == 'text-track') {
			const newTrackElem = document.createElement('track');
			if (trackElem.hasAttribute('srclang')) newTrackElem.setAttribute('srclang', trackElem.getAttribute('srclang'));
			if (trackElem.hasAttribute('label')) newTrackElem.setAttribute('label', trackElem.getAttribute('label'));
			newTrackElem.setAttribute('src', URL.createObjectURL(new Blob([trackElem.textContent], {type: "text/vtt"})));
			trackElem.replaceWith(newTrackElem);
			trackElem = newTrackElem;
		}
		const src = trackElem ? trackElem.getAttribute('src') : "";
		const langOrLabel = trackElem && (trackElem.getAttribute('srclang') || trackElem.getAttribute('label'));
		const title = langOrLabel ? "Activer les sous-titres" + langOrLabel : "Désactiver les sous-titres";
		const label = langOrLabel || "Désactivés";
		const labelElt = item.appendChild(this.createInput(this.classPrefix + 'Subtitle', 'radio', label, title, null, src));
		const input = labelElt.firstElementChild;
		input.name = this.classPrefix + 'Subtitles_' + this.id;
		input.onchange = function () {
			if (this.checked) self.ctrl.showSubtitle(trackElem, self.subTitlesArea);
		};
		return item;
	},

	createPlaybackRateItem: function (playbackRate) {
		const self = this;
		const item = document.createElement('li');
		let label = playbackRate == 1 ? 'Normale' : playbackRate.toString();
		const labelElt = item.appendChild(this.createInput(this.classPrefix + 'PlaybackRate', 'radio', label, null, null, playbackRate));
		const input = labelElt.firstElementChild;
		input.name = this.classPrefix + 'PlaybackRates_' + this.id;
		input.onchange = function () {
			if (this.checked) {
				const value = parseFloat(this.value);
				self.ctrl.media.playbackRate = value;
			}
		};
		return item;
	},

	createQualityItem: function (quality, checked) {
		const self = this;
		const item = document.createElement('li');
		const labelElt = item.appendChild(this.createInput(this.classPrefix + 'Quality', 'radio', quality.label, quality.label, null, quality.value));
		const input = labelElt.firstElementChild;
		input.name = this.classPrefix + 'Qualities_' + this.id;
		input.checked = checked;
		//if (checked) input.setAttribute('checked', '');
		input.onchange = function () {
			if (this.checked) self.ctrl.media.renderer.setQuality(this.value);
		};
		return item;
	}
};
