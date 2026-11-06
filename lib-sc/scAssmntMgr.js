

 
 
window.scAssmntMgr = {


	setMode : function(pElt, pMode){
		if(!pElt) return;
		pElt.style.display = "";
		pElt.style.visibility = "";
		if (pElt.fCurrentMode === "outOfView"){
			pElt.style.position = "";
			pElt.style.left = "";
			pElt.style.top = "";
		}
		switch(pMode) {
		case "collapsed" :
			pElt.style.display = "none";
			break;
		case "invisible" :
			pElt.style.visibility = "hidden";
			break;
		case "outOfView" :
			pElt.style.position = "absolute";
			pElt.style.left = "-10000px";
			pElt.style.top = "-10000px";
			break;
		case "enabled" :
			if(pElt.className.indexOf("buttonDisabled")>=0) pElt.className = pElt.className.replace("buttonDisabled", "");
			pElt.setAttribute("href", "#");
			break;
		case "disabled" :
			if(pElt.className.indexOf("buttonDisabled")<0) pElt.className = pElt.className+" buttonDisabled";
			pElt.removeAttribute("href");
			break;
		}
		pElt.fCurrentMode = pMode;
		if("scSiLib" in window) scSiLib.fireResizedNode(pElt);
	},

	isDisabled : function(pButton){
		return pButton==null || pButton.className.indexOf("buttonDisabled")>=0;
	},

	setToggleStatus : function(pButton, pOn){
		let vIdx;
		if(pButton==null) return;
		if(pOn){ 
			vIdx = pButton.className.lastIndexOf("toggleButtonOff");
			pButton.className = (vIdx>0 ? pButton.className.substring(0, vIdx) :  pButton.className) + " toggleButtonOn";
		} else {
			vIdx = pButton.className.lastIndexOf("toggleButtonOn");
			pButton.className = (vIdx>0 ? pButton.className.substring(0, vIdx) :  pButton.className) + " toggleButtonOff";
		}
	},

	isToggleOn : function(pButton){
		return pButton!=null && pButton.className.indexOf("toggleButtonOn")>=0;
	},

	addClass : function(pNode, pClass) {
		let vNewClassStr = pNode.className;
		let i = 1;
		const n = arguments.length;
		for (; i < n; i++) vNewClassStr += ' '+arguments[i];
		pNode.className = vNewClassStr;
		return scAssmntMgr;
	},

	delClass : function(pNode, pClass) {
		if (pClass !== '') {
			const vCurrentClasses = pNode.className.split(' ');
			const vNewClasses = [];
			let i = 0;
			const n = vCurrentClasses.length;
			for (; i < n; i++) {
				let vClassFound = false;
				let j = 1;
				const m = arguments.length;
				for (; j < m; j++) {
					if (vCurrentClasses[i] === arguments[j]) vClassFound = true;
				}
				if (!vClassFound) vNewClasses.push(vCurrentClasses[i]);
			}
			pNode.className = vNewClasses.join(' ');
		}
		return scAssmntMgr;
	},

	switchClass : function(pNode, pClassOld, pClassNew) {
		if (pClassOld && pClassOld !== '') {
			const vCurrentClasses = pNode.className.split(' ');
			const vNewClasses = [];
			let vClassFound = false;
			let i = 0;
			const n = vCurrentClasses.length;
			for (; i < n; i++) {
				if (vCurrentClasses[i] === pClassNew) return scAssmntMgr;
				if (vCurrentClasses[i] !== pClassOld) {
					vNewClasses.push(vCurrentClasses[i]);
				} else {
					if (pClassNew && pClassNew !== '') vNewClasses.push(pClassNew);
					vClassFound = true;
				}
			}
			if (pClassNew && pClassNew !== '' && !vClassFound) vNewClasses.push(pClassNew);
			pNode.className = vNewClasses.join(' ');
		}
		return scAssmntMgr;
	},

	/* === fonctions utilitaires edit ========================================== */
	editTranslate : function(pString){
		const vCharFrom = " ’«»".split("");
		const vCharTo = " \'\"\"".split("");
		for (let i = 0; i < vCharFrom.length; i++) {
			if (i < vCharTo.length) pString = pString.replaceAll(vCharFrom[i], vCharTo[i]);
			else  pString = pString.replaceAll(vCharFrom[i], "");
		}
		return pString;
	},

	/* === fonctions utilitaires gmcq ========================================== */
	/* Stylage par défaut des areas */
	gmcqHighlightDefault : {
		fillColor: '000000',
		fillOpacity: 0.1,
		strokeColor: 'CCCCCC',
		strokeOpacity: 0.5
	},
	gmcqHighlightRight : {
		fillColor: '00FF00',
		fillOpacity: 0.1,
		strokeColor: '00FF00',
		strokeOpacity: 1,
		alwaysOn: true
	},
	gmcqHighlightWrong : {
		fillColor: 'FF0000',
		fillOpacity: 0.1,
		strokeColor: 'FF0000',
		strokeOpacity: 1,
		alwaysOn: true
	},

	gmcqInitUi : function(pId){
		let i;
		let vSelectBox;
		try{
			const vMgr = window[pId];
			const vImg = scPaLib.findNodes("ide:" + pId + "_form/des:img")[0];
			vMgr.fImg = scPaLib.findNodes("ide:"+pId+"_form/des:img")[1];
			vMgr.fImg.width = vImg.width;
			vMgr.fImg.height = vImg.height;
			vMgr.fAreas = scPaLib.findNodes("ide:"+pId+"_form/des:area");
			vMgr.fInputs = scPaLib.findNodes("ide:"+pId+"_form/des:input");
			vMgr.fRows = scPaLib.findNodes("ide:"+pId+"_form/des:li");
			vMgr.fClass = scPaLib.findNode("ide:"+pId+"_form/des:ul").className.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
			if (vMgr.fFreeMarker){
				vMgr.fMarkerFrame = scPaLib.findNode("ide:"+pId+"_form/chi:div");
				if (vMgr.fSingleResp){
					vMgr.fMarker = scDynUiMgr.addElement("div", vMgr.fMarkerFrame, vMgr.fClass+"_zn", vMgr.fImg, {position:"absolute", width:"1px",height:"1px"});
					this.setMode(vMgr.fMarker, "invisible");
					vSelectBox = scDynUiMgr.addElement("span", vMgr.fMarker, vMgr.fClass+"_mk");
					this.xGmcqInitMarker(vSelectBox, vMgr);
				}
			} else {
				vMgr.fSelectBoxes = scPaLib.findNodes("ide:"+pId+"_form/chi:div/des:span");
				for(i = 0; i<vMgr.fSelectBoxes.length; i++){
					vSelectBox = vMgr.fSelectBoxes[i];
					this.setMode(vSelectBox, "invisible");
					this.xGmcqInitMarker(vSelectBox, vMgr);
				}
			}
			vMgr.fChoiceAsTooltip = (typeof vMgr.fTooltipOptions != "undefined");
			if (vMgr.fChoiceAsTooltip){
				this.setMode(scPaLib.findNode("ide:"+pId+"_form/des:ul"), "collapsed");
				for(i = 0; i<vMgr.fAreas.length; i++) {
					vMgr.fAreas[i].fOptOver = scTooltipMgr.xInitOpts(vMgr.fTooltipOptions);
					vMgr.fAreas[i].fOptFocus = scTooltipMgr.xInitOpts(vMgr.fTooltipOptions);
					vMgr.fAreas[i].fOptFocus.FIX = [0,0];
					vMgr.fAreas[i].fOptFocus.FIXTYPE = "dom";
					vMgr.fAreas[i].fOptFocus.FIXID = vMgr.fImg;
					vMgr.fAreas[i].fOptFocus.HPOS = "center";
					vMgr.fAreas[i].fOptFocus.VPOS = "belowElement";
					vMgr.fAreas[i].fOpt = vMgr.fAreas[i].fOptOver;
				}
				vMgr.fLabels = scPaLib.findNodes("ide:"+pId+"_form/des:li/chi:label");
			}
		} catch(e) {scCoLib.error("ERROR - scAssmntMgr.initGmcqUi :"+e);}
	},
	
	gmcqHighlight : function(pMgr){
		try{
			scMapMgr.maphighlight(pMgr.fImg, scMapMgr.extend(this.gmcqHighlightDefault, {alwaysOn:(pMgr.fHighlight === "always"),neverOn:(pMgr.fHighlight === "never")}));
		} catch(e) {scCoLib.error("ERROR - scAssmntMgr.gmcqHighlight :"+e);}
	},
	
	gmcqUpdateUi : function(pId){
		let i;
		try{
			const vMgr = window[pId];
			if (vMgr.fFreeMarker){
				if (vMgr.fSingleResp){
					this.setMode(vMgr.fMarker,"invisible");
					for(i = 0; i<vMgr.fInputs.length; i++){
						const vInput = vMgr.fInputs[i];
						if (vInput.checked){
							vMgr.fMarker.style.left = vInput.fMarker.x+"px";
							vMgr.fMarker.style.top = vInput.fMarker.y+"px";
							this.setMode(vMgr.fMarker,"visible");
						}
					}
				}
			} else {
				for(i = 0; i<vMgr.fSelectBoxes.length; i++) this.setMode(vMgr.fSelectBoxes[i], sc$(pId+"_"+i).checked ? "visible" : "invisible");
			}
			if (vMgr.fChoiceAsTooltip){
				for(i = 0; i<vMgr.fAreas.length; i++){
					const vArea = vMgr.fAreas[i];
					if (vArea.ttId) {
						const vTt = sc$(vArea.ttId);
						if (vTt) vTt.parentNode.removeChild(vTt);
					}
					const xHasContent = function (pElt) {
						if (scDynUiMgr.readStyle(pElt, "display") === "none") return false;
						if (pElt.nodeType === 3 || pElt.nodeName.toLowerCase() === "img" || pElt.nodeName.toLowerCase() === "object") return true;
						for (let i = 0; i < pElt.childNodes.length; i++) {
							if (xHasContent(pElt.childNodes[i])) return true;
						}
						return false;
					};
					if (xHasContent(vMgr.fLabels[i])){
						const vLbl = vMgr.fLabels[i].innerHTML.replace(/id="[^"]*"/g, "");
						scTooltipMgr.xMakeTt(vArea, vLbl, "" , vMgr.fClass, "");
						vArea.onmouseover = function (pEvt) {
							this.fOpt = this.fOptOver;
							scTooltipMgr.showTooltip(this,pEvt);
							return false;
						};
						vArea.onfocus = function (pEvt) {
							this.fOpt = this.fOptFocus;
							scTooltipMgr.showTooltip(this,pEvt);
							return false;
						};
					}
				}
			}
		} catch(e) {scCoLib.error("ERROR - scAssmntMgr.gmcqUpdateUi :"+e);}
	},
	
	gmcqSetSolution : function(pId, pShow){
		try{
			const vMgr = window[pId];
			for(let i=0; i<vMgr.fAreas.length; i++){
				const vArea = vMgr.fAreas[i];
				const vRowClass = vMgr.fRows[i].className;
				if (pShow){
					vArea.maphighlight = (vRowClass.indexOf("assmntSolCheck")>=0 || vRowClass.indexOf("assmntSolRight")>=0 ? this.gmcqHighlightRight : this.gmcqHighlightWrong);
				} else vArea.maphighlight = null;
			}
			this.gmcqHighlight(vMgr);
		} catch(e) {scCoLib.error("ERROR - scAssmntMgr.gmcqSetSolution :"+e);}
	},
	
	xGmcqInitMarker : function(pElt, pMgr){
		const vBkImg = scDynUiMgr.readStyle(pElt, "backgroundImage");
		if (!vBkImg || vBkImg === "none"){
			pElt.style.position = "absolute";
			pElt.style.width = "40px";
			pElt.style.height = "40px";
			pElt.style.top = "50%";
			pElt.style.left = "50%";
			pElt.style.marginTop = "-20px";
			pElt.style.marginLeft = "-20px";
			pElt.style.backgroundImage = 'url("'+scServices.scLoad.resolveDestUri("/lib-sc/assmntDhtmlTransf/"+(pMgr.fFreeMarker?"mark":"select")+".gif")+'")';
		}
	},
	
	/* === fonctions utilitaires imgGap ========================================== */
	/* Stylage par défaut des areas */
	imgGapHighlightDefault : {
		fillColor: '000000',
		fillOpacity: 0.1,
		strokeColor: 'CCCCCC',
		strokeOpacity: 0.5
	},
	imgGapHighlightRight : {
		fillColor: '00FF00',
		fillOpacity: 0.1,
		strokeColor: '00FF00',
		strokeOpacity: 1,
		alwaysOn: true
	},
	imgGapHighlightWrong : {
		fillColor: 'FF0000',
		fillOpacity: 0.1,
		strokeColor: 'FF0000',
		strokeOpacity: 1,
		alwaysOn: true
	},
	imgGapInitUi : function(pId){
		try{
			const vMgr = window[pId];
			vMgr.fImg = scPaLib.findNodes("ide:"+pId+"_form/des:img")[1];
			vMgr.fAreas = scPaLib.findNodes("ide:"+pId+"_form/des:area");
			vMgr.fInputs = scPaLib.findNodes("ide:"+pId+"_form/des:input");
		} catch(e) {scCoLib.error("ERROR - scAssmntMgr.imgGapInitUi :"+e);}
	},
	
	imgGapHighlight : function(pMgr){
		try{
			scMapMgr.maphighlight(pMgr.fImg, scMapMgr.extend(this.imgGapHighlightDefault, {alwaysOn:(pMgr.fHighlight === "always"),neverOn:(pMgr.fHighlight === "never")}));
		} catch(e) {scCoLib.error("ERROR - scAssmntMgr.imgGapHighlight :"+e);}
	},
	
	imgGapSetSolution : function(pId, pShow){
		try{
			const vMgr = window[pId];
			for(let i=0; i<vMgr.fAreas.length; i++){
				const vArea = vMgr.fAreas[i];
				const vInput = vMgr.fInputs[i];
				if (pShow){
					vArea.maphighlight = (vMgr.getSolIdx(vInput.name)>-1 ? this.imgGapHighlightRight : this.imgGapHighlightWrong);
				} else vArea.maphighlight = null;
			}
			this.imgGapHighlight(vMgr);
		} catch(e) {scCoLib.error("ERROR - scAssmntMgr.imgGapSetSolution :"+e);}
	}
	
}
