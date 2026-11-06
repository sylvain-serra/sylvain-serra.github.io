/* === Opale Aurora menu manager =============================================== */
window.outMgr = {
	fMnuPath: "ide:menu",
	fOutPath: "ide:menu/des:ul.mnu",
	fClsOut: "tplOut",
	fClsOffUp: "btnOff",
	fClsOffDown: "btnOff",

	fOut: null,
	fTglBtn: null,
	fUrlOutline: null,

	fCls: "mnu",
	fClsTgl: "btnOutTgl",
	fResPrefix: "/skin/img/mnu",
	fOverflowMethod: "hidden",

	fCounterExcludes : {},
	fCounterMaxDepth : 1000,
	fCounterFormat : "1",
	fCounterSuffix : ". ",

	fWheelScrollFactor: 5,

	fStrings: ["défilement haut", "Faire défiler le menu vers le haut",
		/*02*/      "défilement bas", "Faire défiler le menu vers le bas",
		/*04*/      "Masquer le plan", "Afficher le plan",
		/*06*/      "Masquer / afficher le plan", "",
		/*08*/      "Ouvrir le menu \'%s\'", "Fermer le menu \'%s\'"],


	/* === Public ============================================================= */
	init: function () {
		try {
			let vLbl;
			let i;
			this.fIsLocal = window.location.protocol == "file:";
			const vMnu = scPaLib.findNode(this.fMnuPath);
			this.fOut = scPaLib.findNode(this.fOutPath);
			if (!this.fOut || !vMnu) return;
			this.fMnuFra = this.fOut.parentNode;
			this.fFilterIsClosed = scPaLib.compileFilter("ul.mnu_closed");
			this.fFilterIsBranch = scPaLib.compileFilter(".type_b");

			// Init
			const vSubLbls = scPaLib.findNodes("des:li.type_b/chi:div", this.fOut);
			for (i = 0; i < vSubLbls.length; i++) {
				vLbl = vSubLbls[i];
				this.xAddToggleBtn(vLbl, vLbl.firstChild.textContent, scPaLib.findNode("nsi:ul", vLbl));
			}
			if ("scormMgr" in window) {
				const vLbls = scPaLib.findNodes("des:li/chi:div", this.fOut);
				for (i = 0; i < vLbls.length; i++) {
					vLbl = vLbls[i];
					const vLnk = scPaLib.findNode("chi:a.item", vLbl);
					scormMgr.buildSeenBtn(vLbl, vLnk ? vLnk.href : scCoLib.hrefBase(), scPaLib.findNode("chi:.item", vLbl).textContent);
				}
			}

			// Init Scroll
			let vVisRule = null;
			if ("ScSiRuleEnsureVisible" in window) new ScSiRuleEnsureVisible("ide:menu/des:.sel_yes/chi:div", "anc:ul.mnu");
			this.fOut.className = this.fOut.className.replace("static", "");
			this.fOut.style.overflow = this.fOverflowMethod;
			const vBd = dom.newBd(this.fMnuFra);
			this.fSrlUp = vBd.elt("div", this.fCls + "SrlUpFra " + this.fClsOffUp, this.fOut).currentUp();
			this.fSrlUpBtn = tplMgr.addBtn(this.fSrlUp, this.fCls + "SrlUpBtn", this.fStrings[0], this.fStrings[1]);
			this.fSrlUpBtn.setAttribute("aria-hidden", "true");
			this.fSrlDwn = vBd.elt("div", this.fCls + "SrlDwnFra " + this.fClsOffDown, this.fOut).currentUp();
			this.fSrlDwnBtn = tplMgr.addBtn(this.fSrlDwn, this.fCls + "SrlDwnBtn", this.fStrings[2], this.fStrings[3]);
			this.fSrlDwnBtn.setAttribute("aria-hidden", "true");

			scOnLoads[scOnLoads.length] = this;
		} catch (e) {
			console.error(`ERROR - outMgr.init : ${e}`);
		}
	},

	declareOutline: function (pUrl) {
		this.fUrlOutline = pUrl;
	},

	onLoad: function () {
		try {
			// Init Scroll up button
			this.fSrlUp.ontouchstart = function () {
				this.fIsTouched = true;
			}
			this.fSrlUp.onclick = function () {
				this.fIsTouched = false;
			}
			this.fSrlUp.onmouseover = function () {
				if (this.fIsTouched) return;
				if (outMgr.scrollTask.fSpeed >= 0) {
					outMgr.scrollTask.fSpeed = -2;
					scTiLib.addTaskNow(outMgr.scrollTask);
				}
			}
			this.fSrlUp.onmouseout = function () {
				if (this.fIsTouched) return;
				outMgr.scrollTask.fSpeed = 0;
			}
			this.fSrlUpBtn.onclick = function () {
				outMgr.scrollTask.step(-20);
				return false;
			}
			// Init Scroll down button
			this.fSrlDwn.ontouchstart = function () {
				this.fIsTouched = true;
			}
			this.fSrlDwn.onclick = function () {
				this.fIsTouched = false;
			}
			this.fSrlDwn.onmouseover = function () {
				if (this.fIsTouched) return;
				if (outMgr.scrollTask.fSpeed <= 0) {
					outMgr.scrollTask.fSpeed = 2;
					scTiLib.addTaskNow(outMgr.scrollTask);
				}
			}
			this.fSrlDwn.onmouseout = function () {
				if (this.fIsTouched) return;
				outMgr.scrollTask.fSpeed = 0;
			}
			this.fSrlDwnBtn.onclick = function () {
				outMgr.scrollTask.step(20);
				return false;
			}
			// Init scroll manager
			this.scrollTask.checkBtn();
			scSiLib.addRule(this.fOut, this.scrollTask);
			this.fOut.onscroll = function () {
				outMgr.scrollTask.checkBtn()
			};
			this.fOut.onmousewheel = function () {
				outMgr.scrollTask.step(Math.round(-event.wheelDelta / (scCoLib.isIE ? 60 : 40) * outMgr.fWheelScrollFactor))
			}; //IE, Safari, Chrome, Opera.
			if (this.fOut.addEventListener) this.fOut.addEventListener('DOMMouseScroll', function (pEvent) {
				outMgr.scrollTask.step(pEvent.detail * outMgr.fWheelScrollFactor)
			}, false);
		} catch (e) {
			console.error(`ERROR - outMgr.init : ${e}`);
		}
	},
	openAll: function () {
		for (let i = 0; i < this.fSubs.length; i++) {
			const vSub = this.fSubs[i];
			if (scPaLib.checkNode(this.fFilterIsClosed, vSub)) this.xAutoToggleItem(vSub.fTglBtn);
		}
	},

	getOutline: async function () {
		if (!this.fOutlineSrc){
			try{
				const vReq = await fetch(this.fUrlOutline);
				if (!vReq.ok) throw new Error(`Status: ${vReq.status}`);
				this.fOutlineSrc = JSON.parse(await vReq.text());
				const iOutlineSetup = function (pItem, pCounter) {
					if (pItem.children) {
						const vDepth = pCounter!==null ? (pCounter==="" ? 1 : pCounter.split(".").length) : null;
						let counter = 0;
						for (let i = 0; i < pItem.children.length; i++) {
							pItem.children[i].parent = pItem;
							if (pCounter !== null){
								if (!outMgr.fCounterExcludes[pItem.children[i].source] && vDepth <= outMgr.fCounterMaxDepth){
									counter++;
									pItem.children[i].counter = pCounter + outMgr.xConvertCounter(counter, vDepth-1);
								}
							}
							iOutlineSetup(pItem.children[i], pCounter === null || outMgr.fCounterExcludes[pItem.children[i].source] || vDepth > outMgr.fCounterMaxDepth ? null : pCounter + outMgr.xConvertCounter(counter, vDepth-1) + ".");
						}
					}
				};
				iOutlineSetup(this.fOutlineSrc.module, "");
				return this.fOutlineSrc
			} catch (e) {
				console.error(`ERROR - outMgr.getOutline : ${e}`);
				return null;
			}
		} else return this.fOutlineSrc;
	},

	getProgress: async function () {
		const vOutlineSrc = await this.getOutline();
		const vOutline = vOutlineSrc.module;
		const vProgress = {'count': 0};
		const vCurrentUrl = window.location.href;
		const vCurrentPage = vCurrentUrl.substring(vCurrentUrl.lastIndexOf("/") + 1);
		const iOutlineWalker = function (pNode) {
			for (let i = 0; i < pNode.length; i++) {
				const vNode = pNode[i];
				vProgress.count++;
				if (vNode.url.substring(vNode.url.lastIndexOf("/") + 1) === vCurrentPage) {
					vProgress.cur = vProgress.count;
					vProgress.currentUrl = vNode.url;
				}
				if (vNode.children) iOutlineWalker(vNode.children);
			}
		};
		iOutlineWalker(vOutline.children);
		return vProgress;
	},

	addCounters: function (pCounterFormat) {
		if (this.fAddCounters) return;
		this.fCounterFormat = pCounterFormat;
		this.fAddCounters = true;
		const iMenuWalker = function (pUl, pPrefix) {
			const vLis = scPaLib.findNodes("chi:li", pUl);
			const vDepth = pPrefix!==null ? (pPrefix==="" ? 1 : pPrefix.split(".").length) : null;
			let counter = 0;
			for (let i = 0; i < vLis.length; i++) {
				const vSource = vLis[i].classList[vLis[i].classList.length-1];
				const vLbl = scPaLib.findNode("chi:div/chi:.item/chi:span", vLis[i]);
				const vBd = dom.newBd(vLbl);
				if (pPrefix !== null){
					if (!outMgr.fCounterExcludes[vSource] && vDepth <= outMgr.fCounterMaxDepth){
						counter++;
						vBd.elt("span", "counter", vLbl.firstChild).text(pPrefix + outMgr.xConvertCounter(counter, vDepth-1) + outMgr.fCounterSuffix);
					}
				}
				if (scPaLib.checkNode(".type_b", vLis[i]) && scPaLib.findNode("chi:ul", vLis[i])) iMenuWalker(scPaLib.findNode("chi:ul", vLis[i]), pPrefix === null && outMgr.fCounterExcludes[vSource] || vDepth > outMgr.fCounterMaxDepth ? null : pPrefix + outMgr.xConvertCounter(counter, vDepth-1) + ".");
			}
		}
		iMenuWalker(this.fOut, "");
	},

	loadSortKey: "AZ",

	/* === Callbacks ========================================================== */
	sToggleItem: function () {
		try {
			if (tplMgr.isNoAjax()) return false;
			outMgr.xToggleItem(this, false).then(function () {
				outMgr.scrollTask.checkBtn()
			});
		} catch (e) {
		}
		return false;
	},

	/* === Private ============================================================ */
	xAutoToggleItem: function (pBtn) {
		this.xToggleItem(pBtn, true);
	},

	xBuildSub: async function (pBtn) {
		await outMgr.xInitOutline();
		if (!pBtn.fUl) {
			const vLbl = pBtn.fLbl;
			const vBd = dom.newBd(vLbl.parentNode);
			pBtn.fUl = vBd.elt("ul", "sub mnu_open").current();
			pBtn.fUl.fTglBtn = pBtn;
			let vLi, vDiv, vLnk, vType, vCls, vHasMath;
			const vChildren = vLbl.fSrc.children;
			for (let i = 0; i < pBtn.fLbl.fSrc.children.length; i++) {
				const vChi = vChildren[i];
				vType = vChi.children ? "b" : "l";
				vCls = "sel_no type_" + vType + " " + vChi.source + " dpt_" + (scPaLib.findNodes("anc:ul.sub", pBtn).length + 1) + " " + vChi.className;
				vBd.elt("li", vCls);
				vDiv = vBd.elt("div", "lbl " + vCls).current();
				vDiv.fSrc = vChi;
				vLnk = vBd.elt("a", "item").current();
				vLnk.href = scServices.scLoad.getRootUrl() + "/" + vChi.url;
				vLnk.target = "_self";
				const vLbl = vBd.elt("span").current();
				vLbl.innerHTML = vChi.label;
				if (this.fAddCounters && vChi.counter){
					vBd.elt("span", "counter", vLbl.firstChild).text(vChi.counter + outMgr.fCounterSuffix).up();
				}
				vBd.up();
				if (vType === "b") outMgr.xAddToggleBtn(vDiv, vChi.label);
				if ("scormMgr" in window) scormMgr.buildSeenBtn(vDiv, vLnk.href, vChi.label);
				vHasMath = vHasMath || vChi.label.indexOf("<math>") >= 0 || vChi.label.indexOf("\\(") >= 0;
				vBd.up().up().up();
			}
			if (("mathjaxMgr" in window) && vHasMath) {
				if (mathjaxMgr.fActive) mathjaxMgr.typeset(pBtn.fUl);
				else  mathjaxMgr.init();
			}
			if ("scormMgr" in window) scormMgr.updateMenu();
		}
	},

	xAddToggleBtn: function (pParent, pLabel, pSub) {
		const vBd = dom.newBd(pParent);
		vBd.elt("span").current().innerHTML = pLabel;
		const VLabelText = vBd.current().textContent;
		vBd.current().parentNode.removeChild(vBd.current());
		pParent.fTglBtn = tplMgr.addBtn(pParent, "tgle_" + (pSub ? "o" : "c"), (pSub ? "v" : ">"), (pSub ? this.fStrings[9].replace("%s", VLabelText) : this.fStrings[8]).replace("%s", VLabelText), pParent.firstChild);
		pParent.fTglBtn.setAttribute("aria-label", pParent.fTglBtn.title);
		pParent.fTglBtn.onclick = this.sToggleItem;
		pParent.fTglBtn.fLbl = pParent;
		if (pSub) pParent.fTglBtn.fUl = pSub;
		pParent.fTglBtn.fLblText = VLabelText;
	},

	xInitOutline: async function () {
		try {
			const vOutlineSrc = await outMgr.getOutline();
			outMgr.fOutline = vOutlineSrc.module;
			const iOutlineWalker = function (pNode, pSrc) {
				const vChildren = scPaLib.findNodes("chi:li/chi:div.lbl", pNode);
				for (let i = 0; i < vChildren.length; i++) {
					const vChild = vChildren[i];
					vChild.fSrc = pSrc.children[i];
					if (scPaLib.checkNode(outMgr.fFilterIsBranch, vChild)) iOutlineWalker(scPaLib.findNode("nsi:ul", vChild), pSrc.children[i]);
				}
			};
			iOutlineWalker(outMgr.fOut, outMgr.fOutline);
		} catch (e) {
			console.error(`ERROR - outMgr.xInitOutline : ${e}`);
		}
	},

	xToggleItem: async function (pBtn) {
		if (!pBtn) return;
		const vStatus = pBtn.className;
		await this.xBuildSub(pBtn);
		const vUl = pBtn.fUl;
		if (!vUl) return;
		if (vStatus === "tgle_c") {
			pBtn.className = "tgle_o";
			pBtn.innerHTML = "<span>v</span>";
			pBtn.title = this.fStrings[9].replace("%s", pBtn.fLblText);
			pBtn.setAttribute("aria-label", pBtn.title);
			vUl.className = vUl.className.replace("mnu_closed", "mnu_open");
			vUl.style.display = "";
			vUl.fClosed = false;
		} else {
			pBtn.className = "tgle_c";
			pBtn.innerHTML = "<span>></span>";
			pBtn.title = this.fStrings[8].replace("%s", pBtn.fLblText);
			pBtn.setAttribute("aria-label", pBtn.title);
			vUl.className = vUl.className.replace("mnu_open", "mnu_closed");
			vUl.style.display = "none";
			vUl.fClosed = true;
			const vOpendSubMnus = scPaLib.findNodes("des:ul.mnu_open", vUl);
			for (let j = 0; j < vOpendSubMnus.length; j++) this.xAutoToggleItem(vOpendSubMnus[j].fTglBtn);
		}
	},

	xToggleMnu: function (pDontResize, pDontMemorize) {
		if (this.fMnuCollapse) return this.xOpenMnu(pDontResize, pDontMemorize);
		else return this.xCloseMnu(pDontResize, pDontMemorize);
	},

	xConvertCounter(pCount, pDepth){
		const sFormatters = {
			"1" : function(pNum){return pNum},
			"A" : function(pNum){return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(pNum-1)},
			"a" : function(pNum){return sFormatters["A"](pNum).toLowerCase()},
			"I" : function(pNum){
				const romanValues = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};
				let roman = "";
				for (let key in romanValues) {
					while (pNum >= romanValues[key]) {
						roman += key;
						pNum -= romanValues[key];
					}
				}
				return roman;
			},
			"i" : function(pNum){return sFormatters["I"](pNum).toLowerCase()},
		};
		let vFormat = this.fCounterFormat.charAt(pDepth) || this.fCounterFormat.charAt(this.fCounterFormat.length-1) || "1";
		if (!sFormatters[vFormat]) vFormat = "1";
		return sFormatters[vFormat](pCount);
	},

	/* === Tasks ============================================================== */
	/** outMgr.scrollTask : menu scroll timer & size task */
	scrollTask: {
		fSpeed: 0,
		execTask: function () {
			try {
				if (this.fSpeed === 0) return false;
				outMgr.fOut.scrollTop += this.fSpeed;
				return true;
			} catch (e) {
				this.fSpeed = 0;
				return false;
			}
		},
		step: function (pPx) {
			try {
				outMgr.fOut.scrollTop += pPx;
			} catch (e) {
			}
		},
		checkBtn: function () {
			const vScrollTop = outMgr.fOut.scrollTop;
			const vBtnUpOff = outMgr.fSrlUp.className.indexOf(outMgr.fClsOffUp);
			if (vScrollTop <= 0) {
				if (vBtnUpOff < 0) outMgr.fSrlUp.className += " " + outMgr.fClsOffUp;
			} else {
				if (vBtnUpOff >= 0) outMgr.fSrlUp.className = outMgr.fSrlUp.className.substring(0, vBtnUpOff);
			}

			const vContentH = scSiLib.getContentHeight(outMgr.fOut);
			const vBtnDownOff = outMgr.fSrlDwn.className.indexOf(outMgr.fClsOffDown);
			if (vContentH - vScrollTop <= outMgr.fOut.offsetHeight) {
				if (vBtnDownOff < 0) outMgr.fSrlDwn.className += " " + outMgr.fClsOffDown;
			} else {
				if (vBtnDownOff >= 0) outMgr.fSrlDwn.className = outMgr.fSrlDwn.className.substring(0, vBtnDownOff);
			}
		},
		onResizedAnc: function (pOwnerNode, pEvent) {
			if (pEvent.phase === 2) this.checkBtn();
		},
		ruleSortKey: "checkBtn"
	}
};