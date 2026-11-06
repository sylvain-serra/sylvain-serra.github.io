window.mapMgr = {
	fPathMapImages : "ide:content/des:div.map_base",
	fOptions : {
		fill: true,
		fillColor: '000000',
		fillOpacity: 0.2,
		stroke: true,
		strokeColor: 'ff0000',
		strokeOpacity: 1,
		strokeWidth: 1,
		alwaysOn: false,
		neverOn: false,
		groupBy: false,
		wrapClass: true,
		shadow: false,
		shadowX: 0,
		shadowY: 0,
		shadowRadius: 6,
		shadowColor: '000000',
		shadowOpacity: 0.8,
		shadowPosition: 'outside',
		shadowFrom: false
	},
	init : function(){
		if ("scTooltipMgr" in window) {
			scTooltipMgr.addShowListener(this.sTtShow);
			scTooltipMgr.addHideListener(this.sTtHide);
		}
		scCoLib.addEventsHandler(this);
	},
	onLoad : function(){
		try{
			this.fMapImages = scPaLib.findNodes(this.fPathMapImages);
			for (let i=0; i<this.fMapImages.length; i++){
				const vMapImage = this.fMapImages[i];
				if (scPaLib.checkNode(".map_highlight_on", vMapImage)){
					vMapImage.fHighlightImage = scPaLib.findNode("chi:img.map_empty", vMapImage);
				}
				vMapImage.fInitWidth = vMapImage.fLastWidth = vMapImage.clientWidth;
				vMapImage.fSizeRatio = vMapImage.clientHeight / vMapImage.clientWidth;
				vMapImage.fAreas = scPaLib.findNodes("chi:map/chi:area", vMapImage);
				vMapImage.fCoords = [];
				for (let j=0; j< vMapImage.fAreas.length; j++) {
					vMapImage.fCoords[j] = vMapImage.fAreas[j].coords.split(",");
					vMapImage.fAreas[j].fHighlightImage = vMapImage.fHighlightImage;
					vMapImage.fAreas[j].addEventListener("click", function(){
						console.log("area clicked")
					});
				}
				const vBackImage = scPaLib.findNode("chi:img.map_img", vMapImage);
				vBackImage.style.width = "100%";
				vBackImage.style.height = "auto";
				scSiLib.addRule(vMapImage, {
					onResizedDes : function(pOwnerNode, pEvent) {},
					onResizedAnc : function(pOwnerNode, pEvent) {
						if(pEvent.phase==1) {
							mapMgr.xRedrawMap(pOwnerNode);
						}
					}
				});
				if (vMapImage.fHighlightImage){
					vMapImage.fHighlightImage.maphighlight = this.fOptions
					scMapMgr.maphighlight(vMapImage.fHighlightImage);
				}
				mapMgr.xRedrawMap(vMapImage);
			}
		} catch (e){
			console.error("mapMgr.onLoad ERROR : "+e);
		}
	},
	/** Tooltip lib show callback: this = function */
	sTtShow: function (pNode) {
		if (pNode && pNode.fHighlightImage) {
			pNode.maphighlight = JSON.parse(pNode.fHighlightImage.getAttribute("data-maphighlight-tooltip"));
			scMapMgr.maphighlight(pNode.fHighlightImage);
		}
	},
	/** Tooltip lib hide callback: this = function */
	sTtHide: function (pNode) {
		if (pNode && pNode.fHighlightImage) {
			pNode.maphighlight = null;
			scMapMgr.maphighlight(pNode.fHighlightImage);
		}
	},
	xRedrawMap : function(pMap){
		const vAvailableWidth = pMap.parentElement.clientWidth;
		if (pMap.fInitWidth >= vAvailableWidth && vAvailableWidth != pMap.fLastWidth){
			const vZoomRatio = vAvailableWidth / pMap.fInitWidth;
			const vWidth = vAvailableWidth;
			const vHeight = vAvailableWidth * pMap.fSizeRatio;

			pMap.style.width = `${vWidth}px`;
			pMap.style.height = `${vHeight}px`;
			if (pMap.fHighlightImage){
				pMap.fHighlightImage.parentNode.style.backgroundRepeat = "no-repeat";
				pMap.fHighlightImage.parentNode.style.width = vWidth + "px";
				pMap.fHighlightImage.parentNode.style.height = vHeight + "px";
				pMap.fHighlightImage.parentNode.parentNode.style.height = vHeight + "px";
				scPaLib.findNode("psi:canvas", pMap.fHighlightImage).style.width = vWidth + "px";
				scPaLib.findNode("psi:canvas", pMap.fHighlightImage).style.height = vHeight + "px";
				pMap.fHighlightImage.style.width = vWidth + "px";
				pMap.fHighlightImage.style.height = vHeight + "px";
				scMapMgr.maphighlight(pMap.fHighlightImage, scMapMgr.extend());
				pMap.fHighlightImage.parentNode.style.backgroundSize = vWidth + "px " + vHeight + "px";
			}
			for (let i in pMap.fAreas) {
				const vNewCoords = [];
				for(j = 0; j < pMap.fCoords[i].length; j++) vNewCoords[j] = pMap.fCoords[i][j]*vZoomRatio;
				pMap.fAreas[i].coords = vNewCoords.join(",");
			}

		}
	},
	onLoadSortKey : "Z"
}
