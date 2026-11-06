var panelMgr = {
	onLoad: function () {
		var vPanelByLabels = new Map();

		var vLabels = document.querySelectorAll('.panelLabel');
		Array.prototype.forEach.call(vLabels, function (pLabel) {
			var vPanel = pLabel.nextElementSibling;
			var vControl = document.getElementById(pLabel.htmlFor);
			var vCloseBtn = vPanel.querySelector('.panelClose');
			var vFocusOutBtn = vPanel.querySelector('.panelFocusOut');
			var vFocusRingBtn = vPanel.querySelector('.panelFocusRing');

			pLabel.title = pLabel.getAttribute('data-open-title');
			vControl.addEventListener('change', function () {
				pLabel.title = this.checked ? pLabel.getAttribute('data-close-title') : pLabel.getAttribute('data-open-title');
				if (this.checked) {
					setTimeout(function() {
						vCloseBtn.focus();
					}, 200);
				} else {
					closePanel();
				}
			});

			function closePanel () {
				vControl.checked = false;
				pLabel.focus();
			}

			vPanelByLabels.set(pLabel, vPanel);
			vCloseBtn.onclick = closePanel;
			vFocusOutBtn.onclick = function () {
				// TODO ne permet pas de passer au suivant
				pLabel.focus();
			};
			vFocusRingBtn.onfocus = function () {
				vCloseBtn.focus();
			};

			if (vPanel.dataset.closeOnChange !== undefined) {
				vPanel.addEventListener('change', function(pEvent) {
					var vPanelChange = Array.prototype.some.call(vLabels, function(pLabel) {
						var vControl = document.getElementById(pLabel.htmlFor);
						return pEvent.target == vControl;
					});
					if (!vPanelChange) closePanel();
				});
			}
			window.addEventListener('keydown', function(pEvent) {
				if (pEvent.keyCode == 27 /* Escape */ && pLabel.control.checked) {
					closePanel();
				}
			});
		});

		window.addEventListener('mouseup', function (pEvent) {
			if (pEvent.button != 0) return;
			Array.prototype.forEach.call(vLabels, function (pLabel) {
				if (pEvent.target != pLabel && !vPanelByLabels.get(pLabel).contains(pEvent.target)) {
					var vControl = document.getElementById(pLabel.htmlFor);
					if (vControl.checked) vControl.checked = false;
				}
			});
		}, false);
	}
};
scOnLoads[scOnLoads.length] = panelMgr;