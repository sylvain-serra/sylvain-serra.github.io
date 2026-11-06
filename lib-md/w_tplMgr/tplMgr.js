/* === Opale template manager =============================================== */
window.tplMgr = {
	fStoreRootKey: null,
	fRootPath: "ide:root",
	fCbkPath: "des:.cbk-closed",
	fCmxTabs: "ide:content/des:table.complexTable",
	fWaiMnuPath: "ide:accessibility",
	fWaiBtnPath: "des:.waiBtn",
	fResumeBtnPath: "ide:tools/des:li.module/des:a",
	fSaveBtnPath: "ide:tools/des:li.tools/des:a",
	fNextBtnPath: "ide:navigation/des:a.next",
	fRefLnkPath: "des:.refOutlineEntry/chi:a",
	fRandomChoiceListPath: "des:div.randomizeAnswers/chi:form/chi:.choiceList",
	fZenBtnPathMemorized: "bod:.default/ide:tools/chi:menu", // Path when tplMgr.fParam.zenMode = 0 | 1
	fZenBtnPathFixed: "bod:.default/ide:header/chi:menu", // Path when tplMgr.fParam.zenMode = 2 | 3
	fZenListeners: [],
	fThemingBtnPath: "ide:tools/chi:menu",
	fMenuBtnPath: "bod:.default/ide:tools/chi:menu",
	fMenuListeners: [],
	fNoAjax: false,
	fDysOptions : {                        // Accessibility bar options
		type : "dys",                        // Unused
		storeRootKey : null,                 // Properties store root key - set to "" for domain-wide storage
		pathRoot: "ide:root",                // Path to root element - used for dynamic resizing
		pathContent: "ide:content",          // Path to main page content
		pathBtnParent: "ide:tools/chi:menu", // Path to button insert point
		pathPanelParent : "ide:main",        // Path to panel insert point
		defaultPanelInactive: true,          // true : panel closed by default
		optNumHeadings: true,                // true : include heading numbering option
		counterFormat: "1",                  // Counter format, available formats 1,A,a,I,i ex : "I1a" displays heading counter 5.4.3. as V.4.c.
		optScaleH2: true,                    // true : page title scaling option
		optAltLineColor: true,               // true : color text lines in three colors option
		optMoreSpaceWord: true,              // true : extra word spacing option
		optMoreSpaceLine: true,              // true : extra line spacing option
		optFontActive: "true"==="true",                 // true : change font option
		optFontSize: true,                   // true : change font size option
		defaults:{                           // Default values for each option
			dysFontActive:"false",             // Activate the given font by default
			dysFontDefaults:"true",            // Add generic serif, sans & mono options
			dysFontList:["OpenDyslexic"],      // List of extra fonts that are available to the user
			dysFontSize:false,                 // Ex : 120 : text zoomed to 120% by default
			dysMoreSpaceWord:false,            // Activate extra word spacing by default
			dysMoreSpaceLine:false,            // Activate extra line spacing by default
			dysNumHeadings:false,              // Activate numbered headings by default
			dysScaleH2:false,                  // Activate page title scaling by default
			dysAltLineColor:false              // Activate alternating line colors by default
		},
		ignoreFilter: ".dysPanel|.hidden|.footnotes|.CodeMirror-static|script|noscript|object|.tooltip_ref|.bkSolResOut|.toolbar|.txt_mathtex_tl|.MathJax_Preview|.MathJax_SVG_Display|i.type|.markers|.resultE|.multiSelect|.simpleSelect"
	},

	fStrings: ["Agrandir", "Cacher des éléments de l\'interface pour agrandir le contenu",
		/*02*/      "Restaurer", "Restaurer l\'interface par défaut.",
		/*04*/      "Cacher le contenu de \'%s\'", "Afficher le contenu de \'%s\'",
		/*06*/      "Le chargement dynamique de ressources est désactivé.\n\nLes restrictions sécuritaires de votre navigateur interdisent l\'utilisation de certaines fonctionnalités telles que la recherche ou l\'exploration du menu.", "",
		/*08*/      "%s - page courante du module", "thème",
		/*10*/      "Passer au thème sombre", "Passer au thème clair",
		/*12*/      "", "Menu",
		/*14*/      "Ouvrir le menu", "Fermer le menu",
		/*16*/      "Fermer", "Cacher le plan",
		/*18*/      "Ouvrir", "Afficher le plan",
		""],

	/* === Public API =========================================================== */
	/** init function - must be called at the end of page body */
	init: function (pParam) {
		this.fParam = pParam || {};
		try {
			this.fPageCurrent = scServices.scLoad.getUrlFromRoot(scCoLib.hrefBase());
			this.fStore = new LocalStore(this.fStoreRootKey);

			// Set tooltip callback functions.
			if ("scTooltipMgr" in window) {
				scTooltipMgr.addShowListener(this.sTtShow);
				scTooltipMgr.addHideListener(this.sTtHide);
				if (scTooltipMgr.addMakeListener) scTooltipMgr.addMakeListener(this.sTtMake);
				else scTooltipMgr.addShowListener(this.sTtMake);
			}

			// Set SubWin callback functions.
			if ("scDynUiMgr" in window) {
				scDynUiMgr.collBlk.addOpenListener(this.sCollBlkOpen);
				scDynUiMgr.collBlk.addCloseListener(this.sCollBlkClose);
				scDynUiMgr.subWindow.addOpenListener(this.sSubWindowOpen);
				scDynUiMgr.subWindow.addCloseListener(this.sSubWindowClose);
			}

			// Set MediaMgr callback functions.
			if ("scMediaMgr" in window) {
				scMediaMgr.addListener("mediaError", this.sMediaError);
			}

			// Add touch-specific event handling
			if ("ontouchstart" in window) {
				document.addEventListener("touchstart", this.sTouchHandler, true);
				document.addEventListener("touchmove", this.sTouchHandler, true);
				document.addEventListener("touchend", this.sTouchHandler, true);
				document.addEventListener("touchcancel", this.sTouchHandler, true);
				document.addEventListener("click", this.sTouchHandler, true);
				if ("scImageMgr" in window) scImageMgr.registerListener("onAnimationOpen", this.sTouchGalOpen);
				if ("scDragMgr" in window) {
					scDragMgr.addStartListener(function () {
						tplMgr.fDisableTouchEvents = true;
					});
					scDragMgr.addStopListener(function () {
						tplMgr.fDisableTouchEvents = false;
					});
				}
			}

			this.initDom();

			scCoLib.addEventsHandler(this);
		} catch (e) {
			console.error(`ERROR - tplMgr.init : ${e}`);
		}
	},

	setDysOptions: function (pType) {
		window.dysOptions = {
			type : pType || this.fDysOptions.type,
			storeRootKey : this.fDysOptions.storeRootKey,
			pathRoot : this.fDysOptions.pathRoot,
			pathContent : this.fDysOptions.pathContent,
			pathBtnParent : this.fDysOptions.pathBtnParent,
			pathPanelParent : this.fDysOptions.pathPanelParent,
			disable : scPaLib.checkNode(".home", document.body),
			defaultPanelInactive : this.fDysOptions.defaultPanelInactive,
			optNumHeadings: this.fDysOptions.optNumHeadings ? !!scPaLib.findNode("ide:menu") : false,
			counterFormat: this.fDysOptions.counterFormat,
			optScaleH2: this.fDysOptions.optScaleH2 ? !!scPaLib.findNode("ide:menu/chi:ul/chi:li.type_b") : false,
			optAltLineColor: this.fDysOptions.optAltLineColor,
			optMoreSpaceWord: this.fDysOptions.optMoreSpaceWord,
			optMoreSpaceLine: this.fDysOptions.optMoreSpaceLine,
			optFontActive: this.fDysOptions.optFontActive,
			optFontSize: this.fDysOptions.optFontSize,
			defaults: this.fDysOptions.defaults,
			ignoreFilter : this.fDysOptions.ignoreFilter
		}
	},

	/** init dom function - must be called at the end of page body or when the content of the page is replaced */
	initDom: function () {
		let i;
		this.fRoot = scPaLib.findNode(this.fRootPath);

		// Close collapsable blocks that are closed by default.
		const vCbks = scPaLib.findNodes(this.fCbkPath);
		for (i in vCbks) {
			const vTgl = scPaLib.findNode("des:a", vCbks[i]);
			if (vTgl) vTgl.onclick();
		}

		// Parse complex tables : add @id & @headers to cells
		// To accomplish this we first create a two-dimensional array of cells taking into account @rowspan & @colspan.
		// We also create two arrays of header ids for cols and rows
		// Then we set @headers on all cells by parsing these arrays
		const vCmxTabs = scPaLib.findNodes(this.fCmxTabs);
		let vCmxTabIdBase = Date.now();
		vCmxTabs.forEach((vTable) => {
			const vRows = scPaLib.findNodes("des:tr", vTable);
			// Determine table actual size (vMaxRows, vMaxCols)
			const vMaxRows = vRows.length;
			const vFirstCells = scPaLib.findNodes("des:th|td", vRows[0]);
			let vMaxCols = 0;
			for (let i = 0; i < vFirstCells.length; i++) {
				const vCell = vFirstCells[i];
				vMaxCols++;
				if (vCell.getAttribute("colspan")) vMaxCols += scCoLib.toInt(vCell.getAttribute("colspan")) - 1;
			}
			// Init Full table and header arrays
			const vCellArray = Array(vMaxRows);
			const vRowHeaders = Array(vMaxRows), vRowHeaderCtrl = Array(vMaxRows);
			const vColHeaders = Array(vMaxCols), vColHeaderCtrl = Array(vMaxCols);
			for (let i = 0; i < vCellArray.length; i++) {
				vCellArray[i] = Array(vMaxCols);
				vRowHeaders[i] = [];
				vRowHeaderCtrl[i] = {};
			}
			for (let i = 0; i < vColHeaders.length; i++) {
				vColHeaders[i] = [];
				vColHeaderCtrl[i] = {};
			}
			// Populate table arrays taking rowspan and colspan into account
			for (let i = 0; i < vRows.length; i++) {
				const vRow = vRows[i];
				const vCells = scPaLib.findNodes("des:th|td", vRow);
				for (let j = 0; j < vCells.length; j++) {
					const vCell = vCells[j];
					if (vCell.localName.toLowerCase() === "th") vCell.id = "cell-" + vCmxTabIdBase++;
					let vColIdx = j;
					while (vCellArray[i][vColIdx]) vColIdx++;
					let vRowspan = scCoLib.toInt(vCell.getAttribute("rowspan"));
					if (vRowspan > 0) vRowspan--
					while (vRowspan>=0){
						let vColspan = scCoLib.toInt(vCell.getAttribute("colspan"));
						if (vColspan > 0) vColspan--
						while (vColspan>=0){
							vCellArray[i + vRowspan][vColIdx + vColspan] = vCell;
							if (vCell.localName.toLowerCase() === "th"){
								if(vCell.getAttribute("scope")==="col" && !vColHeaderCtrl[vColIdx + vColspan][vCell.id]){
									vColHeaders[vColIdx + vColspan].push(vCell.id);
									vColHeaderCtrl[vColIdx + vColspan][vCell.id] = true
								}
							}
							vColspan--
						}
						if (vCell.localName.toLowerCase() === "th"){
							if(vCell.getAttribute("scope")==="row" && !vRowHeaderCtrl[i + vRowspan][vCell.id]){
								vRowHeaders[i + vRowspan].push(vCell.id);
								vRowHeaderCtrl[i + vRowspan][vCell.id] = true;
							}
						}
						vRowspan--
					}
				}
			}
			// Set headers attribute on all table cells that need them
			for (let i = 0; i < vCellArray.length; i++) {
				for (let j = 0; j < vCellArray[i].length; j++) {
					const vCell = vCellArray[i][j];
					let vHeaders = vCell.headers ? vCell.headers.split(" ") : [];
					for (let k = 0; k < vRowHeaders[i].length; k++) {
						if(vRowHeaders[i][k] !== vCell.id) vHeaders.push(vRowHeaders[i][k]);
					}
					for (let k = 0; k < vColHeaders[j].length; k++) {
						if(vColHeaders[j][k] !== vCell.id) vHeaders.push(vColHeaders[j][k]);
					}
					vCell.headers = [...new Set(vHeaders)].join(" ");
				}
			}
		});

		// Randomize MCQ quizes that need to be (For evaluations, solution choices will be ordered in the same way as the question choices where)
		try {
			const vRandomChoiceLists = scPaLib.findNodes(this.fRandomChoiceListPath, this.fContent);
			for (i = 0; i < vRandomChoiceLists.length; i++) {
				const vFormId = scPaLib.findNode("par:form", vRandomChoiceLists[i]).id.split("_A");
				const vChoices = scPaLib.findNodes("chi:li", vRandomChoiceLists[i]);
				if (vFormId.length===2 && vFormId[1] === "sol_form"  && sessionStorage.getItem(vFormId[0]+"IdxList")){
					const vIdxList = sessionStorage.getItem(vFormId[0]+"IdxList").split(",");
					for (let j = 0; j < vChoices.length; j++) {
						vChoices[j].style.order = vIdxList[j];
					}
				} else {
					const vIdxCtrl = {"-1": true};
					const vIdxList = [];
					let vNewIdx = -1;
					for (let j = 0; j < vChoices.length; j++) {
						while (vIdxCtrl[vNewIdx]) vNewIdx = Math.round(Math.random() * (vChoices.length - 1));
						vIdxCtrl[vNewIdx] = true;
						vChoices[j].style.order = vNewIdx;
						vIdxList.push(vNewIdx);
					}
					if (vFormId.length===2 && vFormId[1] === "eval_form"){
						sessionStorage.setItem(vFormId[0]+"IdxList", vIdxList.join())
					}
				}
			}
		} catch (e) {
			console.error(`ERROR - tplMgr.initDom - randomizeAnswers : ${e}`);
		}

		// Add zen button
		// null = no zen button, 0 = off by default, memorized, 1 = on by default, memorized, 2 = always off, 3 = always on
		if (this.fParam.zenMode!==null) {
			this.fZenBtnPath = this.fParam.zenMode < 2 ? this.fZenBtnPathMemorized : this.fZenBtnPathFixed;
			if (scPaLib.findNode(this.fZenBtnPath)) {
				document.body.classList.add(this.fParam.zenMode < 2 ? "zenModeMemorized" : "zenModeFixed");
				let vBd = dom.newBd(scPaLib.findNode(this.fZenBtnPath));
				const vZenBtn = vBd.elt("li", "zenBtnParent").elt("button", "zenBtnToggle")
					.att("title", this.fStrings[this.fParam.zenMode < 2 ? 1 : 17])
					.att("aria-label", this.fStrings[this.fParam.zenMode < 2 ? 1 : 17])
					.listen("click", function(){
						this.fFullScreen = !this.fFullScreen;
						this.innerHTML = '<span>' + tplMgr.fStrings[(this.fFullScreen ? this.strIdxLblZenYes : this.strIdxLblZenNo)] + '</span>';
						this.title = tplMgr.fStrings[(this.fFullScreen ? this.strIdxTiZenYes : this.strIdxTiZenNo)];
						this.setAttribute("aria-label", this.title);
						tplMgr.fStore.set("templateZen", this.fFullScreen);
						tplMgr.switchClass(tplMgr.fRoot, "zen_" + !this.fFullScreen, "zen_" + this.fFullScreen, true);
						for (let i = 0; i < tplMgr.fZenListeners.length; i++) {
							try {
								tplMgr.fZenListeners[i]();
							} catch (e) {}
						}
					})
					.prop("strIdxTiZenNo", this.fParam.zenMode < 2 ? 1 : 17)
					.prop("strIdxTiZenYes", this.fParam.zenMode < 2 ? 3 : 19)
					.prop("strIdxLblZenNo", this.fParam.zenMode < 2 ? 0 : 16)
					.prop("strIdxLblZenYes", this.fParam.zenMode < 2 ? 2 : 18)
					.elt("span").text(this.fStrings[this.fParam.zenMode < 2 ? 0 : 16]).up().current();
				const vZenState = this.fStore.get("templateZen");
				if (this.fParam.zenMode === 3 || (this.fParam.zenMode !== 2 && vZenState === "true") || (this.fParam.zenMode === 1 && !vZenState)) vZenBtn.click();
				else this.switchClass(tplMgr.fRoot, "zen_true", "zen_false", true);
			}
		}

		// Theme button
		let vHasParentMgr = false;
		try {
			if (window.parent !== window && window.parent.tplMgr) vHasParentMgr = true;
		} catch (e){}
		if(this.fParam.themeMode==="button" && scPaLib.findNode(this.fThemingBtnPath)){
			let vBd = dom.newBd(scPaLib.findNode(this.fThemingBtnPath));
			this.fThemingBtn = vBd.elt("li", "themeBtnParent").elt("button", "themeBtn")
				.prop("fTheme", localStorage.getItem(scServices.scLoad.fRootUrl+"theme-preference") ? localStorage.getItem(scServices.scLoad.fRootUrl+"theme-preference") : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
				.prop("setPreference", function (){
					localStorage.setItem(scServices.scLoad.fRootUrl+"theme-preference", this.fTheme);
					this.reflectPreference();
				})
				.prop("reflectPreference", function (){
					document.documentElement.setAttribute("data-theme", this.fTheme);
					this.title = this.fTheme === "dark" ? tplMgr.fStrings[11] : tplMgr.fStrings[10];
					this.setAttribute("aria-label", this.title);
					localStorage.setItem(scServices.scLoad.fRootUrl+"theme-preference", this.fTheme);
				})
				.listen("click", function(){
					this.fTheme = this.fTheme === "light" ? "dark" : "light";
					this.setPreference();
				})
				.call("reflectPreference")
				.elt("span").text(this.fStrings[9]).up().currentUp();
			window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", ({matches:isDark}) => {
				tplMgr.fThemingBtn.fTheme = isDark ? "dark" : "light";
				tplMgr.fThemingBtn.setPreference();
			});
		} else if (vHasParentMgr && localStorage.getItem(scServices.scLoad.fRootUrl+"theme-preference")){ //We are in a sub-window set theme from sessionStorage.
			document.documentElement.setAttribute("data-theme", localStorage.getItem(scServices.scLoad.fRootUrl+"theme-preference"));
		} else if (this.fParam.themeMode !== "none" && this.fParam.themeMode !== "button"){ //Direct theme code in themeMode
			document.documentElement.setAttribute("data-theme", this.fParam.themeMode);
			localStorage.setItem(scServices.scLoad.fRootUrl+"theme-preference", this.fParam.themeMode);
		} else if (this.fParam.themeMode === "button") {
			console.warn("WARNING : cannot setup theming on this page.");
		}

		// Burger menu button
		if (this.fParam.addMenuBtn && scPaLib.findNode(this.fMenuBtnPath)){
			let vBd = dom.newBd(scPaLib.findNode(this.fMenuBtnPath));
			this.fMenuBtn = vBd.elt("li", "menuBtnParent").elt("button", "menuBtn")
				.att("title", this.fStrings[14])
				.att("aria-label", this.fStrings[14])
				.listen("click", function(){
					this.fOpen = this.fOpen !== true;
					this.title = this.fOpen ? tplMgr.fStrings[15] : tplMgr.fStrings[14];
					this.setAttribute("aria-label", this.title);
					if (this.fOpen) {
						document.body.classList.add("menuOpen");
						sc$("document").setAttribute("inert", "true");
						sc$("tools").focus();
					} else {
						document.body.classList.remove("menuOpen");
						sc$("document").removeAttribute("inert");
					}
					for (let i = 0; i < tplMgr.fMenuListeners.length; i++) {
						try {
							tplMgr.fMenuListeners[i](this.fOpen);
						} catch (e) {}
					}
				})
				.elt("span").text(this.fStrings[13]).up().currentUp();
			if ("searchMgr" in window){
				searchMgr.register("find", function () {
					if (tplMgr.fMenuBtn.fOpen) tplMgr.fMenuBtn.click();
				})
			}
		}

		// Accessibility Toolbar
		if(this.fParam.accessBar !== "none"){
			this.setDysOptions(this.fParam.accessBar);
			const vScript = document.createElement('script');
			vScript.setAttribute("src", scServices.scLoad.resolveDestUri("/lib-md/w_tplMgr/dys/dys.js"))
			document.getElementsByTagName("head")[0].appendChild(vScript);
			const vCss = document.createElement("link");
			vCss.setAttribute("rel", "stylesheet")
			vCss.setAttribute("type", "text/css")
			vCss.setAttribute("href", scServices.scLoad.resolveDestUri("/lib-md/w_tplMgr/dys/dys.css"));
			document.getElementsByTagName("head")[0].appendChild(vCss);
		}

		// Add file protocol class
		if (window.location.protocol === "file:") this.fRoot.classList.add("fileProtocol");

	},

	/** scCoLib OnLoad  */
	onLoad: function () {
		try{
			let i;
			// Set save and resume button onclicks.
			const vResumeBtns = scPaLib.findNodes(this.fResumeBtnPath);
			for (i in vResumeBtns) {
				if (vResumeBtns[i]) vResumeBtns[i].onclick = function () {
					const vUrl = tplMgr.fStore.get("courseUrl");
					if (vUrl) this.setAttribute("href", vUrl);
				}
			}
			const vSaveBtns = scPaLib.findNodes(this.fSaveBtnPath);
			if (scPaLib.checkNode(".last", document.body) && scPaLib.findNode(this.fNextBtnPath)) vSaveBtns.push(scPaLib.findNode(this.fNextBtnPath));
			for (i in vSaveBtns) {
				if (vSaveBtns[i]) vSaveBtns[i].addEventListener("click", function(pEvent) {
					tplMgr.fStore.set("courseUrl", document.location.href);
				});
			}
			// Plan outline
			const vRetUrl = this.fStore.get("courseUrl");
			const vMnuItems = scPaLib.findNodes("ide:content/des:ul.plan/des:a");
			if (vRetUrl && vMnuItems) {
				const vPage = vRetUrl.substring(vRetUrl.lastIndexOf("/") + 1);
				for (i = 0; i < vMnuItems.length; i++) {
					const vMnuItem = vMnuItems[i];
					if (vMnuItem.href.substring(vMnuItem.href.lastIndexOf("/") + 1) === vPage) {
						vMnuItem.classList.add("sel_yes");
						vMnuItem.setAttribute("title", this.fStrings[8].replace("%s", vMnuItem.getAttribute("data-label")));
						break;
					}
				}
			}

			// Purge empty menus
			const vMenus = scPaLib.findNodes("des:menu");
			for (i = 0; i < vMenus.length; i++) {
				if (vMenus[i].childNodes.length == 0) vMenus[i].parentNode.removeChild(vMenus[i]);
			}

			document.body.classList.add("loaded");
		} catch (e) {
			console.error(`ERROR - tplMgr.onLoad : ${e}`);
		}
	},
	loadSortKey: "AZ",
	addZenListener: function (pFunc) {
		this.fZenListeners.push(pFunc);
	},
	addMenuListener: function (pFunc) {
		this.fMenuListeners.push(pFunc);
	},
	/** Load page in search */
	loadPage: function (pUrl, pDirect) {
		if (pUrl && pUrl.length > 0) window.location.href = scServices.scLoad.getRootUrl() + "/" + pUrl;
	},
	/** scrollTo in search */
	scrollTo: function (pId) {
		this.loadPage(this.fPageCurrent + "#" + pId, true);
	},
	makeVisible: function (pNode) {
		// Ouvre bloc collapsable contenant pNode
		const vCollBlk = scPaLib.findNode("anc:.collBlk_closed", pNode);
		if (vCollBlk) vCollBlk.fTitle.onclick();
	},
	hideCaption: function (pNode) {
		const vCaption = scPaLib.findNode("anc:figure/chi:figcaption", pNode);
		if (vCaption) vCaption.style.display = "none";
	},
	xMediaFallback: function (pMedia) {
		while (pMedia.firstChild) {
			if (pMedia.firstChild instanceof HTMLSourceElement) {
				pMedia.removeChild(pMedia.firstChild);
			} else {
				pMedia.parentNode.insertBefore(pMedia.firstChild, pMedia);
			}
		}
		pMedia.parentNode.removeChild(pMedia);
	},
	/** isNoAjax */
	isNoAjax: function () {
		return this.fNoAjax;
	},
	/** setNoAjax */
	setNoAjax: function () {
		if (!this.fNoAjaxWarn) alert(this.fStrings[6]);
		this.fNoAjax = true;
		this.fNoAjaxWarn = true;
	},
	/** Load the next image if a gallery open or page if exists */
	next: function () {
		if ("scImageMgr" in window && scImageMgr.fCurrItem && scImageMgr.fCurrItem.fName === "gal") {
			scImageMgr.xNxtSs(scImageMgr.fCurrItem);
		} else {
			const vBtn = scPaLib.findNode("ide:navigation/des:a.next");
			if (vBtn) vBtn.click();
		}
	},
	/** Load previous image if a gallery open or page if exists */
	previous: function () {
		if ("scImageMgr" in window && scImageMgr.fCurrItem && scImageMgr.fCurrItem.fName === "gal") {
			scImageMgr.xPrvSs(scImageMgr.fCurrItem);
		} else {
			const vBtn = scPaLib.findNode("ide:navigation/des:a.prev");
			if (vBtn) vBtn.click();
		}
	},
	/* === Utilities ============================================================ */
	/** tplMgr.addBtn : Add a HTML button to a parent node. */
	addBtn: function (pParent, pClassName, pCapt, pTitle, pNxtSib) {
		const vBtn = scDynUiMgr.addElement("a", pParent, pClassName, pNxtSib);
		vBtn.href = "#";
		vBtn.target = "_self";
		vBtn.setAttribute("role", "button");
		if (pTitle) {
			vBtn.setAttribute("title", pTitle);
			vBtn.setAttribute("aria-label", pTitle);
		}
		if (pCapt) vBtn.innerHTML = "<span>" + pCapt + "</span>"
		vBtn.onkeydown = function (pEvent) {
			scDynUiMgr.handleBtnKeyDwn(pEvent);
		}
		vBtn.onkeyup = function (pEvent) {
			scDynUiMgr.handleBtnKeyUp(pEvent);
		}
		return vBtn;
	},

	/** tplMgr.switchClass - replace a class name. */
	switchClass: function (pNode, pClassOld, pClassNew, pAddIfAbsent, pMatchExact) {
		const vAddIfAbsent = typeof pAddIfAbsent == "undefined" ? false : pAddIfAbsent;
		const vMatchExact = typeof pMatchExact == "undefined" ? true : pMatchExact;
		const vClassName = pNode.className;
		const vReg = new RegExp("\\b" + pClassNew + "\\b");
		if (vMatchExact && vClassName.match(vReg)) return;
		let vClassFound = false;
		if (pClassOld && pClassOld !== "") {
			if (vClassName.indexOf(pClassOld) === -1) {
				if (!vAddIfAbsent) return;
				else if (pClassNew && pClassNew !== '') pNode.className = vClassName + " " + pClassNew;
			} else {
				const vCurrentClasses = vClassName.split(' ');
				const vNewClasses = new Array();
				let i = 0;
				const n = vCurrentClasses.length;
				for (; i < n; i++) {
					const vCurrentClass = vCurrentClasses[i];
					if (vMatchExact && vCurrentClass !== pClassOld || !vMatchExact && vCurrentClass.indexOf(pClassOld) !== 0) {
						vNewClasses.push(vCurrentClasses[i]);
					} else {
						if (pClassNew && pClassNew !== '') vNewClasses.push(pClassNew);
						vClassFound = true;
					}
				}
				pNode.className = vNewClasses.join(' ');
			}
		}
		return vClassFound;
	},
	/* === Event Handlers & lib override functions ============================== */
	/** sTouchHandler */
	sTouchHandler: function (pEvt) {
		if (tplMgr.fDisableTouchEvents) return;
		switch (pEvt.type) {
			case "click":
				if ("scTooltipMgr" in window) scTooltipMgr.hideTooltip(); // Close tooltips on click as mouseup is not available
				break;
			case "touchstart":
				if (pEvt.touches.length === 1) {
					tplMgr.fSwipeStart = {x: pEvt.touches[0].pageX, y: pEvt.touches[0].pageY};
					tplMgr.fSwipeEnd = tplMgr.fSwipeStart;
				}
				break;
			case "touchmove":
				if (pEvt.touches.length === 1) {
					tplMgr.fSwipeEnd = {x: pEvt.touches[0].pageX, y: pEvt.touches[0].pageY};
				}
				break;
			case "touchend":
				try { //Swipe left and right to change page (delta Y < 30% & delta X > 200px)
					const vDeltaX = tplMgr.fSwipeStart.x - tplMgr.fSwipeEnd.x;
					if (Math.abs((tplMgr.fSwipeStart.y - tplMgr.fSwipeEnd.y) / vDeltaX) < 0.3) {
						if (vDeltaX > 200) tplMgr.next();
						else if (vDeltaX < -200) tplMgr.previous();
					}
					tplMgr.fSwipeStart = {x: null, y: null};
					tplMgr.fSwipeEnd = tplMgr.fSwipeStart;
				} catch (e) {}
		}
	},
	/** sTouchGalOpen callback: this = function */
	sTouchGalOpen: function (pGal) {
		if (!pGal || !pGal.fFra || typeof pGal.fFra.fTouchScreen != "undefined") return;
		pGal.fFra.className = pGal.fFra.className + " " + pGal.fFra.className + "_touch";
	},
	/** Tooltip lib make callback: this = function */
	sTtMake: function (pNode) {
		if (!pNode.fMedias) {
			pNode.fMedias = scPaLib.findNodes("des:.mediaPlayer", sc$(pNode.ttId));
			for (let i = 0; i < pNode.fMedias.length; i++) scMediaMgr.initMedia(pNode.fMedias[i]);
		}
	},
	/** Tooltip lib show callback: this = function */
	sTtShow: function (pNode) {
		if (!pNode.fOpt.FOCUS && !pNode.onblur) pNode.onblur = function () {
			scTooltipMgr.hideTooltip(true);
		};
	},
	/** Tooltip lib hide callback: this = function */
	sTtHide: function (pNode) {
		if (pNode) pNode.focus();
		for (let i = 0; i < pNode.fMedias.length; i++) {
			scMediaMgr.xStop(pNode.fMedias[i].media);
		}
	},
	/** Callback function. */
	sCollBlkOpen: function (pCo, pTitle) {
		if (pTitle) pTitle.title = tplMgr.fStrings[4].replace("%s", (pTitle.innerText ? pTitle.innerText : pTitle.textContent));
		if (! pCo.fInitChildren){
			if ("scImageMgr" in window) {
				scImageMgr.xInitSqs(pCo);
			}
			pCo.fInitChildren = true;
		}
	},
	/** Callback function. */
	sCollBlkClose: function (pCo, pTitle) {
		if (pTitle) pTitle.title = tplMgr.fStrings[5].replace("%s", (pTitle.innerText ? pTitle.innerText : pTitle.textContent));
	},
	/** Callback function. */
	sMediaError: function (pType) {
		if (pType && pType.error === "subsRequestNetwork") {
			tplMgr.setNoAjax();
		}
	},
	/** Callback function. */
	sSubWindowOpen: function (pSwId) {
		if (tplMgr.fRoot) tplMgr.fRoot.setAttribute("inert", "true");
	},
	/** Callback function. */
	sSubWindowClose: function (pSwId) {
		if (tplMgr.fRoot) tplMgr.fRoot.removeAttribute("inert");
	},
	/** Callback function. */
	sMediaError: function (pType) {
		if (pType && pType.error === "subsRequestNetwork") {
			tplMgr.setNoAjax();
		}
	}
};

/** Local Storage API (localStorage/cookie) */
function LocalStore(pRootKey, pId){
	if (pId && !/^[a-z][a-z0-9]+$/.exec(pId)) throw new Error("Invalid store name");
	this.fId = pId || "";
	this.fRootKey = pRootKey!==null ? pRootKey : scServices.scLoad.fRootUrl;
	if ("localStorage" in window && typeof window.localStorage != "undefined") {
		this.get = function(pKey) {
			const vRet = localStorage.getItem(this.fRootKey + this.xKey(pKey));return (typeof vRet == "string" ? unescape(vRet) : null)};
		this.set = function(pKey, pVal) {localStorage.setItem(this.fRootKey+this.xKey(pKey), escape(pVal))};
	} else {
		this.get = function(pKey){
			const vReg = new RegExp(this.xKey(pKey) + "=([^;]*)");
			const vArr = vReg.exec(document.cookie);if(vArr && vArr.length===2) return(unescape(vArr[1]));else return null};
		this.set = function(pKey,pVal){document.cookie = this.xKey(pKey)+"="+escape(pVal)};
	}
	this.xKey = function(pKey){return this.fId + this.xEsc(pKey)};
	this.xEsc = function(pStr){return "LS" + pStr.replace(/ /g, "_")};
}

/** ### ScSiRuleAutoMarginW ######### */
function ScSiRuleAutoMarginW(pIdMarginWNode, pPathContainer, pIsDynSize, pMinWidth, pMaxMargin) {
	this.fIsDynSize = pIsDynSize;
	this.fId = pIdMarginWNode;
	this.fPath = pPathContainer;
	this.fMinWidth = pMinWidth;
	this.fMaxMargin = pMaxMargin;
	scOnLoads[scOnLoads.length] = this;
}
ScSiRuleAutoMarginW.prototype.onResizedAnc = function(pOwnerNode, pEvent) {
	if( ! this.fIsDynSize) {
		pEvent.stopBranch = true;
		return;
	}
	if(pEvent.resizedNode === pOwnerNode) return;
	if(pEvent.phase===1) this.xReset();
	else this.xRedraw();
}
ScSiRuleAutoMarginW.prototype.onResizedDes = function(pOwnerNode, pEvent) {
	if(pEvent.phase===1) this.xReset();
	else this.xRedraw();
}
ScSiRuleAutoMarginW.prototype.xReset = function() {
	this.fNode.style.marginLeft = "0px";
	this.fNode.style.marginRight = "0px";
}
ScSiRuleAutoMarginW.prototype.xRedraw = function() {
	const vH = this.fContainer.clientHeight;
	if(isNaN(vH) || vH <= 0) return;
	const vContentH = scSiLib.getContentHeight(this.fContainer);
	if(isNaN(vContentH) || vContentH <= 0) return;
	if(vContentH < vH) {
		const vW = this.fContainer.clientWidth;
		if(vW <= this.fMinWidth) return;
		const vMargin = Math.min(this.fMaxMargin * (1 - vContentH / vH), (vW - this.fMinWidth) / 2) + "px";
		this.fNode.style.marginLeft = vMargin;
		this.fNode.style.marginRight = vMargin;
	}
}
ScSiRuleAutoMarginW.prototype.onLoad = function() {
	this.fNode = sc$(this.fId);
	if( ! this.fNode) return;
	this.fContainer = scPaLib.findNode(this.fPath, this.fNode);
	if( ! this.fContainer) return;
	scSiLib.addRule(this.fContainer, this);
	this.xRedraw();
}
ScSiRuleAutoMarginW.prototype.loadSortKey = "Si2";
ScSiRuleAutoMarginW.prototype.ruleSortKey = "2";

/** ### ScSiRuleFlexH ######### */
function ScSiRuleFlexH(pIdFlexNode, pPathContainer, pIsDynSize, pRatioFreeSpace) {
	this.fIsDynSize = pIsDynSize;
	this.fId = pIdFlexNode;
	this.fPath = pPathContainer;
	this.fRatioFreeSpace = pRatioFreeSpace;
	scOnLoads[scOnLoads.length] = this;
}
ScSiRuleFlexH.prototype.onResizedAnc = ScSiRuleAutoMarginW.prototype.onResizedAnc;
ScSiRuleFlexH.prototype.onResizedDes = ScSiRuleAutoMarginW.prototype.onResizedDes;
ScSiRuleFlexH.prototype.xReset = function() {
	this.fNode.style.height = null;
}
ScSiRuleFlexH.prototype.xRedraw = function() {
	const vH = this.fContainer.clientHeight;
	if(isNaN(vH) || vH <= 0) return;
	const vContentH = scSiLib.getContentHeight(this.fContainer);
	if(isNaN(vContentH) || vContentH <= 0) return;
	if(vContentH < vH) this.fNode.style.height = Math.round( (vH-vContentH) * this.fRatioFreeSpace)+"px";
}
ScSiRuleFlexH.prototype.onLoad = function() {
	this.fNode = sc$(this.fId);
	if( ! this.fNode) return;
	this.fContainer = scPaLib.findNode(this.fPath, this.fNode);
	if( ! this.fContainer) return;
	scSiLib.addRule(this.fContainer, this);
	this.xRedraw();
}
ScSiRuleFlexH.prototype.loadSortKey = "Si3";
ScSiRuleFlexH.prototype.ruleSortKey = "3";

/** ### ScSiRuleEnsureVisible ######### */
function ScSiRuleEnsureVisible(pPathNode, pPathContainer) {
	this.fPathNode = pPathNode;
	this.fPathContainer = pPathContainer;
	this.fEnable = true;
	scOnLoads[scOnLoads.length] = this;
}
ScSiRuleEnsureVisible.prototype.enable = function(pState) {
	this.fEnable = pState;
}
ScSiRuleEnsureVisible.prototype.updateNode = function(pNode) {
	this.fEnable = true;
	this.fNode = pNode;
	if(!this.fNode) this.fEnable = false;
	this.fContainer = scPaLib.findNode(this.fPathContainer, this.fNode);
	if(!this.fContainer) this.fEnable = false;
	this.xEnsureVis();
}
ScSiRuleEnsureVisible.prototype.updateNodePath = function(pPathNode) {
	this.fEnable = true;
	if (typeof pPathNode != "undefined") this.fPathNode = pPathNode;
	this.fNode = scPaLib.findNode(this.fPathNode);
	if(!this.fNode) this.fEnable = false;
	this.fContainer = scPaLib.findNode(this.fPathContainer, this.fNode);
	if(!this.fContainer) this.fEnable = false;
	this.xEnsureVis();
}
ScSiRuleEnsureVisible.prototype.onResizedAnc = function(pOwnerNode, pEvent) {
	if(pEvent.phase===1 || pEvent.resizedNode === pOwnerNode) return;
	this.xEnsureVis();
}
ScSiRuleEnsureVisible.prototype.onResizedDes = function(pOwnerNode, pEvent) {
	if(pEvent.phase===1) return;
	this.xEnsureVis();
}
ScSiRuleEnsureVisible.prototype.xEnsureVis = function() {
	if (!this.fEnable) return;
	const vOffsetTop = scSiLib.getOffsetTop(this.fNode, this.fContainer) + this.fContainer.scrollTop;
	const vOffsetMiddle = vOffsetTop + this.fNode.offsetHeight / 2;
	const vMiddle = this.fContainer.clientHeight / 2;
	this.fContainer.scrollTop = Math.min(vOffsetMiddle - vMiddle, vOffsetTop);
}
ScSiRuleEnsureVisible.prototype.onLoad = function() {
	try {
		if (this.fPathNode) this.fNode = scPaLib.findNode(this.fPathNode);
		if(!this.fNode) this.fEnable = false;
		this.fContainer = scPaLib.findNode(this.fPathContainer, this.fNode);
		if(!this.fContainer) this.fEnable = false;
		else scSiLib.addRule(this.fContainer, this);
		this.xEnsureVis();
	} catch(e){
		console.error(`ERROR - ScSiRuleEnsureVisible.onLoad : ${e}`);
	}
}
ScSiRuleEnsureVisible.prototype.loadSortKey = "SiZ";
ScSiRuleEnsureVisible.prototype.ruleSortKey = "Z";

/** ### ScSiRuleResize ######### */
function ScSiRuleResize( pPathContainer, pResizeFunc) {
	this.fPathContainer = pPathContainer;
	this.xResizeFunc = pResizeFunc;
	scOnLoads[scOnLoads.length] = this;
}
ScSiRuleResize.prototype.onResizedAnc = function(pOwnerNode, pEvent) {
	if(pEvent.phase===1 || pEvent.resizedNode === pOwnerNode) return;
	this.xResizeFunc();
}
ScSiRuleResize.prototype.onResizedDes = function(pOwnerNode, pEvent) {
	if(pEvent.phase===1) return;
	this.xResizeFunc();
}
ScSiRuleResize.prototype.xResizeFunc = function() {
}
ScSiRuleResize.prototype.onLoad = function() {
	try {
		this.fContainer = scPaLib.findNode(this.fPathContainer, this.fNode);
		if( ! this.fContainer) return;
		scSiLib.addRule(this.fContainer, this);
		this.xResizeFunc();
	} catch(e){
		console.error(`ERROR - ScSiRuleResize.onLoad : ${e}`);
	}
}
ScSiRuleResize.prototype.loadSortKey = "SiZZ";
ScSiRuleResize.prototype.ruleSortKey = "ZZ";
