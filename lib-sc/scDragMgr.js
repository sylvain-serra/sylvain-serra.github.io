


window.scDragMgr = {
	fIsRtl : document.documentElement.getAttribute("dir") === "rtl",
	fStartListeners: [],
	fStopListeners: [],



	makeContainer: function (pKey, pCatchment, pContainer, pIfEmpty, pImage) {
		this.dragdrop.makeContainer(pKey, pCatchment, pContainer, pIfEmpty, pImage);
		return this;
	},




	setMode: function (pContainer, pMode, pMax) {
		this.dragdrop.setMode(pContainer, pMode, pMax);
		return this;
	},



	setResizeOnDragOut: function (pContainer, pMode) {
		this.dragdrop.setResizeOnDragOut(pContainer, pMode);
		return this;
	},


	setDragOverClass: function (pContainer, pClass) {
		this.dragdrop.setDragOverClass(pContainer, pClass);
		return this;
	},




	getContainers: function (pKey, pRootNode) {
		return this.dragdrop.getContainers(pKey, pRootNode);
	},


	getLabels: function (pContainer) {
		return this.dragdrop.getLabels(pContainer);
	},



	repopulateContainers: function (pKey) {
		this.dragdrop.repopulateContainers(pKey);
		return this;
	},


	makeDraggableLabel: function (pKey, pLabel, pHandle) {
		this.dragdrop.makeDraggableLabel(pKey, pLabel, pHandle);
		return this;
	},


	setCallback: function (pLabel, pfunction) {
		this.dragdrop.setCallback(pLabel, pfunction);
		return this;
	},


	setDraggable: function (pLabel, pIsDraggable) {
		this.dragdrop.setDraggable(pLabel, pIsDraggable);
		return this;
	},


	setConstraintBox: function (pLabel, pNode) {
		this.dragdrop.setConstraintBox(pLabel, pNode);
		return this;
	},


	setDragClass: function (pLabel, pClass) {
		this.dragdrop.setDragClass(pLabel, pClass);
		return this;
	},


	saveLabelPos: function (pLabel) {
		return this.dragdrop.saveLabelPos(pLabel);
	},


	addStartListener: function (pFunc) {
		this.fStartListeners.push(pFunc)
	},


	addStopListener: function (pFunc) {
		this.fStopListeners.push(pFunc)
	}
};

scDragMgr.helpers = {

	addClass : function(pNode, pClass) {
		let vNewClassStr = pNode.className;
		let i = 1;
		const n = arguments.length;
		for (; i < n; i++) vNewClassStr += ' '+arguments[i];
		pNode.className = vNewClassStr;
		return scDragMgr.helpers;
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
		return scDragMgr.helpers;
	},

	switchClass : function(pNode, pClassOld, pClassNew) {
		if (pClassOld && pClassOld !== '') {
			const vCurrentClasses = pNode.className.split(' ');
			const vNewClasses = [];
			let vClassFound = false;
			let i = 0;
			const n = vCurrentClasses.length;
			for (; i < n; i++) {
				if (vCurrentClasses[i] === pClassNew) return scDragMgr.helpers;
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
		return scDragMgr.helpers;
	},

	isMouseInside : function(pDragEvent, pContainter) {
		if(pContainter.fArea){
			switch(pContainter.shape.toLowerCase()){
				case "circle":
					return (pDragEvent.transformedMouseOffset.insideCircle(pContainter.centerPosition, pContainter.radius));
				case "poly":
					return (pDragEvent.transformedMouseOffset.insidePoly(pContainter.pointsPosition));
				case "rect":
					return (pDragEvent.transformedMouseOffset.insideBox(pContainter.topLeftPosition, pContainter.bottomRightPosition));
			}
		} else return (pDragEvent.transformedMouseOffset.inside(pContainter.topLeftPosition, pContainter.bottomRightPosition));
	},

	isTouchEvent : function(event) {
		return event.type === "touchstart" || event.type === "touchmove" || event.type === "touchend" || event.type === "touchcancel";
	},

	map : function(array, func) {
		let i = 0;
		const n = array.length;
		for (; i < n; i++) func(array[i]);
	},

	nextItem : function(item, nodeName) {
		if (item == null) return;
		let next = item.nextSibling;
		while (next != null) {
			if (next.nodeName === nodeName) return next;
			next = next.nextSibling;
		}
		return null;
	},

	previousItem : function(item, nodeName) {
		let previous = item.previousSibling;
		while (previous != null) {
			if (previous.nodeName === nodeName) return previous;
			previous = previous.previousSibling;
		}
		return null;
	},

	moveBefore : function(item1, item2) {
		const parent = item1.parentNode;
		parent.removeChild(item1);
		parent.insertBefore(item1, item2);
	},

	moveAfter : function(item1, item2) {
		const parent = item1.parentNode;
		parent.removeChild(item1);
		parent.insertBefore(item1, item2 ? scDragMgr.helpers.nextItem(item2, item2.nodeName) : null);
	},

	isEltContainedByNode: function(pElt, pContainer) {
		let vElt = pElt;
		let vFound = false;
		if (vElt) {
			while (vElt.parentNode && !vFound) {
				vElt = vElt.parentNode;
				vFound = vElt === pContainer;
			}
		}
		return(vFound);
	}
}


scDragMgr.events = {

	fix : function(event) {
		if (!event) event = window.event;
		if (event.target.nodeType === 3) event.target = event.target.parentNode;
		return event;
	},

	register : function(element, type, func) {
		element.addEventListener(type, func, false);
	},

	unregister : function(element, type, func) {
		if (element.removeEventListener) {
			element.removeEventListener(type, func, false);
		} else if (element.detachEvent) {
			if (element._listeners && element._listeners[type] && element._listeners[type][func]) {
				element.detachEvent('on' + type, element._listeners[type][func]);
			}
		}
	}
}


scDragMgr.coordinates = {

	create : function(x, y) {
		return new _scDragMgrCoordinate(this, x, y);
	},

	origin : function() {
		return this.create(0, 0);
	},

	topLeftPosition : function(element) {
		let left = parseInt(scDragMgr.css.readStyle(element, "left"));
		left = isNaN(left) ? 0 : left;
		let top = parseInt(scDragMgr.css.readStyle(element, "top"));
		top = isNaN(top) ? 0 : top;
		return this.create(left, top);
	},

	bottomRightPosition : function(element) {
		return this.topLeftPosition(element).plus(this._size(element));
	},

	topLeftOffset : function(element) {
		let offset = this._offset(element);
		let parent = element.offsetParent;
		while (parent) {
			offset = offset.plus(this._offset(parent));
			if (parent.tagName.toLowerCase()!=="body") offset = offset.minus(this._scroll(parent));
			parent = parent.offsetParent;
		}
		return offset;
	},

	topRightOffset : function(element) {
		return this.topLeftOffset(element).plus(this.create(element.offsetWidth, 0));
	},

	bottomRightOffset : function(element) {
		return this.topLeftOffset(element).plus(this.create(element.offsetWidth, element.offsetHeight));
	},

	bottomLeftOffset : function(element) {
		return this.topLeftOffset(element).plus(this.create(0, element.offsetHeight));
	},

	scrollOffset : function() {
		if (window.pageXOffset) {
			return this.create(window.pageXOffset, window.pageYOffset);
		} else if (document.documentElement) {
			return this.create(document.body.scrollLeft + document.documentElement.scrollLeft, document.body.scrollTop + document.documentElement.scrollTop);
		} else if (document.body.scrollLeft >= 0) {
			return this.create(document.body.scrollLeft, document.body.scrollTop);
		} else {
			return this.create(0, 0);
		}
	},

	clientSize : function() {
		if (window.innerHeight >= 0) {
			return this.create(window.innerWidth, window.innerHeight);
		} else if (document.documentElement) {
			return this.create(document.documentElement.clientWidth, document.documentElement.clientHeight);
		} else if (document.body.clientHeight >= 0) {
			return this.create(document.body.clientWidth, document.body.clientHeight);
		} else {
			return this.create(0, 0);
		}
	},

	/**
	 * mouse coordinate relative to the window (technically the
	 * browser client area) i.e. the part showing your page
	 */
	mousePosition : function(event) {
		event = scDragMgr.events.fix(event);

		let eventPositionElement = event;
		if (scDragMgr.helpers.isTouchEvent(event)) {

			if (event.type==="touchend") {
				eventPositionElement=event.changedTouches[0];
			} else {
				eventPositionElement=event.touches[0];
			}
		}
		return this.create(eventPositionElement.clientX, eventPositionElement.clientY);
	},

	/**
	 * mouse coordinate relative to the document
	 */
	mouseOffset : function(event) {
		let eventPositionElement = event;
		event = scDragMgr.events.fix(event);
		if (scDragMgr.helpers.isTouchEvent(event)) {
			if (event.type==="touchend") {
				eventPositionElement=event.changedTouches[0];
			} else {
				eventPositionElement=event.touches[0];
			}
		}
		if (eventPositionElement.pageX >= 0 || eventPositionElement.pageX < 0) {
			return this.create(eventPositionElement.pageX, eventPositionElement.pageY);
		} else if (eventPositionElement.clientX >= 0 || eventPositionElement.clientX < 0) {
			return this.mousePosition(event).plus(this.scrollOffset());
		}
	},

	_size : function(element) {
		return this.create(element.offsetWidth, element.offsetHeight);
	},

	_offset : function(element) {
		return this.create(element.offsetLeft,element.offsetTop);
	},

	_scroll : function(element) {
		return this.create(element.scrollLeft,element.scrollTop);
	}
}

function _scDragMgrCoordinate(factory, x, y) {
	this.factory = factory;
	this.x = isNaN(x) ? 0 : x;
	this.y = isNaN(y) ? 0 : y;
}

_scDragMgrCoordinate.prototype = {

	toString : function() {
		return "(" + this.x + "," + this.y + ")";
	},

	toHash : function() {
		return {"x":this.x,"y":this.y}
	},

	clone : function() {
		return this.factory.create(this.x, this.y);
	},

	plus : function(that) {
		return this.factory.create(this.x + that.x, this.y + that.y);
	},

	minus : function(that) {
		return this.factory.create(this.x - that.x, this.y - that.y);
	},

	min : function(that) {
		return this.factory.create(Math.min(this.x , that.x), Math.min(this.y , that.y));
	},

	max : function(that) {
		return this.factory.create(Math.max(this.x , that.x), Math.max(this.y , that.y));
	},

	constrainTo : function (one, two) {
		const min = one.min(two);
		const max = one.max(two);
		return this.max(min).min(max);
	},

	distance : function (that) {
		return Math.sqrt(Math.pow(this.x - that.x, 2) + Math.pow(this.y - that.y, 2));
	},

	reposition : function(element) {
		element.style["top"] = this.y + "px";
		element.style["left"] = this.x + "px";
	},


	insideBox : function(pTL, pBR) {
		return (this.x >= pTL.x) && (this.x <= pBR.x) &&(this.y >= pTL.y) && (this.y <= pBR.y);
	},


	insideCircle : function(pCR, pRad) {
		return (this.distance(pCR) <= pRad);
	},


	insidePoly : function(pPts) {
		for (let c = false, i = -1, l = pPts.length, j = l - 1; ++i < l; j = i)
			((pPts[i].y <= this.y && this.y < pPts[j].y) || (pPts[j].y <= this.y && this.y < pPts[i].y))
			&& (this.x < (pPts[j].x - pPts[i].x) * (this.y - pPts[i].y) / (pPts[j].y - pPts[i].y) + pPts[i].x)
			&& (c = !c);
		return c;
	},

	inside : function(pTL, pBR) {
		return this.insideBox(pTL, pBR);
	}
}


scDragMgr.css = {

	readStyle : function(element, property, defaultVal) {
		defaultVal = typeof(defaultVal) != "undefined" ? defaultVal : null;
		try {
			if (element.style[property]) {
				return element.style[property];
			} else if (element.currentStyle) {
				return element.currentStyle[property];
			} else if (document.defaultView && document.defaultView.getComputedStyle) {
				const style = document.defaultView.getComputedStyle(element, null);
				const prop = property.replace(/([A-Z])/g, "-$1").toLowerCase();
				if (style[prop]) return style[prop];
				else return style.getPropertyValue(prop);
			} else {
				return defaultVal;
			}
		} catch (e) {
			return defaultVal;
		}
	}
}


scDragMgr.drag = {

	createSimpleGroup : function(element, handle) {
		handle = handle ? handle : element;
		const group = this.createGroup(element);
		group.setHandle(handle);
		group.transparentDrag();
		group.onTopWhileDragging();
		group.disableSelection();
		return group;
	},

	createGroup : function(element) {
		const group = new _scDragMgrDragGroup(this, element);
		element.fStylePosBase = scDragMgr.css.readStyle(element, 'position');
		element.fStylePosDrag = 'relative';
		element.style["position"] = element.fStylePosDrag;
		return group;
	},

	constraints : function() {
		return this._constraintFactory;
	},

	_createEvent : function(type, event, group) {
		return new _scDragMgrDragEvent(type, event, group);
	}
}

function _scDragMgrDragGroup(factory, element) {
	this.factory = factory;
	this.element = element;
	this._handle = null;
	this._draggable = true;
	this._thresholdDistance = 0;
	this._transforms = [];
	this._listeners = [];
	this._listeners['draginit'] = [];
	this._listeners['dragstart'] = [];
	this._listeners['dragmove'] = [];
	this._listeners['dragend'] = [];
}

_scDragMgrDragGroup.prototype = {
	/*
	 * TODO:
	 *   - unregister(type, func)
	 *   - move custom event listener stuff into Event library
	 *   - keyboard nudging of "selected" group
	 */

	setHandle : function(handle) {
		const events = scDragMgr.events;

		this._handle = handle;
		handle.scDragMgrDragGroup = this;
		events.register(handle, 'mousedown', this._dragInit);
		handle.onmousedown = function() { return false }

		events.register(handle, 'touchstart', this._dragInit);
		handle.ontouchstart = function() { return false }

		events.register(handle, 'keydown', this._keydown);

		if (this.element !== handle) events.unregister(this.element, 'mousedown', this._dragInit);
		if (this.element !== handle) events.unregister(this.element, 'touchstart', this._dragInit);
	},

	register : function(type, func) {
		this._listeners[type].push(func);
	},

	addTransform : function(transformFunc) {
		this._transforms.push(transformFunc);
	},

	verticalOnly : function() {
		this.addTransform(this.factory.constraints().vertical());
	},

	horizontalOnly : function() {
		this.addTransform(this.factory.constraints().horizontal());
	},

	setThreshold : function(thresholdDistance) {
		this._thresholdDistance = thresholdDistance;
	},

	transparentDrag : function(opacity) {
		opacity = typeof(opacity) != "undefined" ? opacity : 0.75;
		const originalOpacity = scDragMgr.css.readStyle(this.element, "opacity", "");
		this.register('dragstart', function(dragEvent) {
			const element = dragEvent.group.element;
			element.style.opacity = opacity;
			element.style.filter = 'alpha(opacity=' + (opacity * 100) + ')';
		})
		this.register('dragend', function(dragEvent) {
			const element = dragEvent.group.element;
			element.style.opacity = originalOpacity;
			element.style.filter = 'alpha(opacity=100)';
		})
	},

	onTopWhileDragging : function(zIndex) {
		zIndex = typeof(zIndex) != "undefined" ? zIndex : 100000;
		const originalZIndex = scDragMgr.css.readStyle(this.element, "zIndex", "");
		this.register('dragstart', function(dragEvent) {
			dragEvent.group.element.style.zIndex = zIndex;
		})
		this.register('dragend', function(dragEvent) {
			dragEvent.group.element.style.zIndex = originalZIndex;
		})
	},

	setDraggable : function(draggable) {
		this._draggable = draggable;
	},

	disableSelection : function() {
		this.element.onselectstart = function() {return false;}
		this.element.unselectable = "on";
		this.element.style.MozUserSelect = "none";
	},

	_keydown : function(event) {
		try {
			event = scDragMgr.events.fix(event);
			if (event.target === this.scDragMgrDragGroup._handle){
				const vLabel = this.scDragMgrDragGroup.element;
				if (event.keyCode === 13 && scDragMgr.getContainers(this.fKey).length>0) {
					scDragMgr.keyboard.selectLabel(vLabel);
				} else if (event.keyCode === 39 && vLabel.parentNode.fCatchment.fDropMode === "ordered") { // NEXT
					scDragMgr.keyboard.moveLabelDown(vLabel);
				} else if (event.keyCode === 37 && vLabel.parentNode.fCatchment.fDropMode === "ordered") { // PREV
					scDragMgr.keyboard.moveLabelUp(vLabel);
				}
			}
		} catch(e) {scCoLib.log("_scDragMgrDragGroup._keydown: " + e);}
	},

	_dragInit : function(event) {
		try{
			event = scDragMgr.events.fix(event);
			const group = scDragMgr.scDragMgrDragGroup = this.scDragMgrDragGroup;
			const dragEvent = group.factory._createEvent('draginit', event, group);
			if (group._draggable) {
				if (scDragMgr.helpers.isTouchEvent(event)) {
					event.stopPropagation();
					event.preventDefault();
				}
				group._isThresholdExceeded = false;
				group._initialMouseOffset = dragEvent.mouseOffset;
				group._grabOffset = dragEvent.mouseOffset.minus(dragEvent.topLeftOffset);
				scDragMgr.events.register(document, 'mousemove', group._drag);
				scDragMgr.events.register(document, 'touchmove', group._drag);
				document.onmousemove = function() { return false };
				scDragMgr.events.register(document, 'mouseup', group._dragEnd);
				scDragMgr.events.register(document, 'touchend', group._dragEnd);
				scDragMgr.events.register(document, 'touchcancel', group._dragEnd);
				group._notifyListeners(dragEvent);
				for (let i=0; i<scDragMgr.fStartListeners.length; i++) try{scDragMgr.fStartListeners[i](group);}catch(e){}
			}
		} catch(e) {scCoLib.log("_scDragMgrDragGroup._dragInit: " + e);}
	},

	_drag : function(event) {
		try{
			event = scDragMgr.events.fix(event);
			const coordinates = scDragMgr.coordinates;
			const group = this.scDragMgrDragGroup || scDragMgr.scDragMgrDragGroup;
			if (!group) return;
			if (scDragMgr.helpers.isTouchEvent(event)) {
				event.stopPropagation();
				event.preventDefault();
			}
			const dragEvent = group.factory._createEvent('dragmove', event, group);
			let newTopLeftOffset = dragEvent.mouseOffset.minus(group._grabOffset);
			if (!group._isThresholdExceeded) {
				const distance = dragEvent.mouseOffset.distance(group._initialMouseOffset);
				if (distance < group._thresholdDistance) return;
				group._isThresholdExceeded = true;
				group._notifyListeners(group.factory._createEvent('dragstart', event, group));
			}
			for (let i=0; i<group._transforms.length; i++) {
				const transform = group._transforms[i];
				newTopLeftOffset = transform(newTopLeftOffset, dragEvent);
			}
			const dragDelta = newTopLeftOffset.minus(dragEvent.topLeftOffset);
			const newTopLeftPosition = dragEvent.topLeftPosition.plus(dragDelta);
			newTopLeftPosition.reposition(group.element);
			dragEvent.transformedMouseOffset = newTopLeftOffset.plus(group._grabOffset);
			group._notifyListeners(dragEvent);
			const errorDelta = newTopLeftOffset.minus(coordinates.topLeftOffset(group.element));
			if (errorDelta.x !== 0 || errorDelta.y !== 0) {
				coordinates.topLeftPosition(group.element).plus(errorDelta).reposition(group.element);
			}
		} catch(e) {scCoLib.log("_scDragMgrDragGroup._drag: " + e);}
	},

	_dragEnd : function(event) {
		try{
			event = scDragMgr.events.fix(event);
			const group = this.scDragMgrDragGroup || scDragMgr.scDragMgrDragGroup;
			const dragEvent = group.factory._createEvent('dragend', event, group);
			if (scDragMgr.helpers.isTouchEvent(event)) {
				event.stopPropagation();
				event.preventDefault();
			}
			group._notifyListeners(dragEvent);
			for (let i=0; i<scDragMgr.fStopListeners.length; i++) try{scDragMgr.fStopListeners[i](group);}catch(e){}
			if(this.scDragMgrDragGroup) this.scDragMgrDragGroup = null;
			if(scDragMgr.scDragMgrDragGroup) scDragMgr.scDragMgrDragGroup = null;
			scDragMgr.events.unregister(document, 'mousemove', group._drag);
			document.onmousemove = null;
			scDragMgr.events.unregister(document, 'mouseup', group._dragEnd);
			document.mouseup = null;
			scDragMgr.events.unregister(document, 'touchmove', group._drag);
			scDragMgr.events.unregister(document, 'touchend', group._dragEnd);
			scDragMgr.events.unregister(document, 'touchcancel', group._dragEnd);
		} catch (e){scCoLib.log("_scDragMgrDragGroup._dragEnd: " + e);}
	},

	_notifyListeners : function(dragEvent) {
		try{
			const listeners = this._listeners[dragEvent.type];
			for (let i=0; i<listeners.length; i++) {
				listeners[i](dragEvent);
			}
		} catch(e) {scCoLib.log("_scDragMgrDragGroup._notifyListeners: " + e);}
	}
}

function _scDragMgrDragEvent(type, event, group) {
	this.type = type;
	this.group = group;
	this.mousePosition = scDragMgr.coordinates.mousePosition(event);
	this.mouseOffset = scDragMgr.coordinates.mouseOffset(event);
	this.transformedMouseOffset = this.mouseOffset;
	this.topLeftPosition = scDragMgr.coordinates.topLeftPosition(group.element);
	this.topLeftOffset = scDragMgr.coordinates.topLeftOffset(group.element);
	this.bottomRightPosition = scDragMgr.coordinates.bottomRightPosition(group.element);
	this.bottomRightOffset = scDragMgr.coordinates.bottomRightOffset(group.element);
}

_scDragMgrDragEvent.prototype = {
	toString : function() {
		return "mouse: " + this.mousePosition + this.mouseOffset + " - " +	"xmouse: " + this.transformedMouseOffset + " - " +	"left,top: " + this.topLeftPosition + this.topLeftOffset;
	}
}

scDragMgr.drag._constraintFactory = {

	vertical : function() {
		return function(coordinate, dragEvent) {
			const x = dragEvent.topLeftOffset.x;
			return coordinate.x !== x ? coordinate.factory.create(x, coordinate.y) : coordinate;
		}
	},

	horizontal : function() {
		return function(coordinate, dragEvent) {
			const y = dragEvent.topLeftOffset.y;
			return coordinate.y !== y ? coordinate.factory.create(coordinate.x, y) : coordinate;
		}
	}
}


scDragMgr.dragdrop = {


	fFirstCatchments : {},
	fLastCatchments : {},



	makeContainer : function (pKey, pCatchment, pContainer, pIfEmpty, pImage) {
		try {
			let vKey = (typeof pKey != "undefined") ? pKey : 'defaultKey';
			vKey = (vKey.length === 0) ? 'defaultKey' : vKey;
			if (typeof pCatchment.fKey != "undefined") {
				scCoLib.log("dragdrop.makeContainer: "+pCatchment.id+" is already init.");
				return
			}

			pCatchment.fKey = vKey;
			pCatchment.fResizeOnDragOut = false;
			pCatchment.fUpdatable = true;
			pCatchment.onDragOver = new Function(); // public dragover  event (for styles etc)
			pCatchment.onDragOut = new Function(); //public dragout event (for styles etc)
			pCatchment.xUpdateGui = this._UpdateGui;
			pCatchment.xIsDropable = this._IsDropable;
			pCatchment.xOnDragOver = this._onDragOver;
			pCatchment.xOnDragOut = this._onDragOut;
			if (pCatchment.tagName.toLowerCase()==="area"){
				if (typeof pImage == "undefined") {
					scCoLib.log("dragdrop.makeContainer: area catchment without an image.");
					return
				}
				pCatchment.fArea = true;
				pCatchment.fImage = pImage
				const vCoods = pCatchment.coords.split(",");
				switch(pCatchment.shape.toLowerCase()){
					case "circle":
						pCatchment.centerDelta = scDragMgr.coordinates.create(scCoLib.toInt(vCoods[0]),scCoLib.toInt(vCoods[1]));
						pCatchment.radius = scCoLib.toInt(vCoods[2]);
						break;
					case "poly":
						pCatchment.pointsDelta = new Array(vCoods.length/2);
						pCatchment.pointsPosition = new Array(vCoods.length/2);
						for (let i = 0; i < pCatchment.pointsDelta.length; i++){
							pCatchment.pointsDelta[i] = scDragMgr.coordinates.create(scCoLib.toInt(vCoods[2*i]),scCoLib.toInt(vCoods[2*i+1]));
						}
						break;
					case "rect":
						pCatchment.topLeftDelta = scDragMgr.coordinates.create(scCoLib.toInt(vCoods[0]),scCoLib.toInt(vCoods[1]));
						pCatchment.bottomRightDelta = scDragMgr.coordinates.create(scCoLib.toInt(vCoods[2]),scCoLib.toInt(vCoods[3]));
				}
			}


			if (typeof this.fFirstCatchments[pCatchment.fKey] == "undefined") {
				this.fFirstCatchments[pCatchment.fKey] = this.fLastCatchments[pCatchment.fKey] = pCatchment;
				pCatchment.fPreviousCatchment = null;
				pCatchment.fNextCatchment = null;
			} else {
				pCatchment.fPreviousCatchment = this.fLastCatchments[pCatchment.fKey];
				pCatchment.fNextCatchment = null;
				this.fLastCatchments[pCatchment.fKey].fNextCatchment = pCatchment;
				this.fLastCatchments[pCatchment.fKey] = pCatchment;
			}

			if (typeof pContainer != "undefined") {
				pContainer.fDelaultDisplay = scDragMgr.css.readStyle(pContainer, "display");
				pContainer.fCatchment = pCatchment;
				pCatchment.fContainer = pContainer;
				this.setMode(pContainer, "ordered", -1);
				this.setDragOverClass(pContainer, "");
			}

			if (pIfEmpty && typeof pIfEmpty != "undefined") {
				pIfEmpty.fDelaultDisplay = scDragMgr.css.readStyle(pIfEmpty, "display");
				pCatchment.fIfEmpty = pIfEmpty;
			}
			pCatchment.fIsEmpty = pCatchment.xUpdateGui();

			scDragMgr.events.register(pCatchment, 'keydown', this._keydown);
		} catch (e) {
			scCoLib.log("dragdrop.makeContainer: " + e);
		}
	},


	setMode : function(pContainer, pMode, pMax) {
		try {
			if  (typeof pContainer.fCatchment != "undefined") {
				const vCatchment = pContainer.fCatchment;
				vCatchment.fDropMode = pMode;
				vCatchment.fMaxLabels = pMax;
				switch(vCatchment.fDropMode.toLowerCase()){
					case "ordered":
						vCatchment.xOnDragPostProcess = this._onDragSort;
						vCatchment.xOnDragEndPostProcess = this._onDropReposition;
						break;
					case "append":
						vCatchment.xOnDragPostProcess = new Function();
						vCatchment.xOnDragEndPostProcess = this._onDropReposition;
						break;
					case "inBulk":
						vCatchment.xOnDragPostProcess = new Function();
						vCatchment.xOnDragEndPostProcess = new Function();
				}
			}
		} catch (e) {
			scCoLib.log("dragdrop.setMode: " + e);
		}
	},


	setResizeOnDragOut : function(pContainer, pMode) {
		try {
			pContainer.fCatchment.fResizeOnDragOut = pMode;
		} catch (e) {
			scCoLib.log("dragdrop.setResizeOnDragOut: " + e);
		}
	},


	setDragOverClass : function(pContainer, pClass) {
		if (pClass) pContainer.fCatchment.fDragOverClass = pClass;
		else pContainer.fCatchment.fDragOverClass = "";
	},



	getContainers : function(pKey, pRootNode) {
		try {
			const vContainers = [];
			let vCatchment = scDragMgr.dragdrop.fFirstCatchments[pKey];
			while (vCatchment != null) {
				if (pRootNode){
					if (scDragMgr.helpers.isEltContainedByNode(vCatchment, pRootNode)) vContainers.push(vCatchment.fContainer);
				} else vContainers.push(vCatchment.fContainer);
				vCatchment = vCatchment.fNextCatchment;
			}
			return vContainers;
		} catch (e) {
			scCoLib.log("dragdrop.getContainers: " + e);
		}
	},


	getLabels : function(pContainer) {
		try {
			const vLabels = [];
			if  (typeof pContainer != "undefined") {
				let vChild = pContainer.firstChild;
				while (vChild != null) {
					if  (vChild.fIsDraggable) vLabels.push(vChild);
					vChild = vChild.nextSibling;
				}
			}
			return (vLabels);
		} catch (e) {
			scCoLib.log("dragdrop.getLabels: " + e);
		}
	},


	countLabels : function(pContainer) {
		try {
			let vCount = 0;
			if  (typeof pContainer != "undefined") {
				let vChild = pContainer.firstChild;
				while (vChild != null) {
					if  (vChild.fIsDraggable) vCount++;
					vChild = vChild.nextSibling;
				}
			}
			return (vCount)
		} catch (e) {
			scCoLib.log("dragdrop.countLabels: " + e);
		}
	},



	repopulateContainers : function (pKey) {
		try {
			let vCatchment = scDragMgr.dragdrop.fFirstCatchments[pKey];
			while (vCatchment != null) {
				this._emptyLabels(vCatchment.fContainer);
				vCatchment = vCatchment.fNextCatchment;
			}
			vCatchment = scDragMgr.dragdrop.fFirstCatchments[pKey];
			while (vCatchment != null) {
				this._populate(vCatchment.fContainer);
				vCatchment = vCatchment.fNextCatchment;
			}
		} catch (e) {
			scCoLib.log("dragdrop.repopulateContainers: " + e);
		}
	},


	makeDraggableLabel : function(pKey, pLabel, pHandle) {
		try {
			let vKey = (typeof pKey != "undefined") ? pKey : 'defaultKey';
			vKey = (vKey.length === 0) ? 'defaultKey' : vKey;
			if (typeof pLabel.fKey != "undefined") {
				scCoLib.log("dragdrop.makeDraggableLabel: "+pLabel.id+" is already init.");
				return
			}
			pLabel.fIsDraggable = true;

			if (pLabel.parentNode.fCatchment && pLabel.parentNode.fCatchment.xUpdateGui) {
				pLabel.parentNode.fCatchment.xUpdateGui();
			}
			pHandle = pHandle ? pHandle : pLabel;
			const vGroup = scDragMgr.drag.createGroup(pLabel);
			vGroup.setHandle(pHandle);
			vGroup.transparentDrag();
			vGroup.setThreshold(4);
			vGroup.onTopWhileDragging();
			vGroup.disableSelection();
			vGroup.register('dragstart', this._onDragStart);
			vGroup.register('dragmove', this._onDragMove);
			vGroup.register('dragend', this._onDragEnd);
			pLabel.fStartParent = null;
			pLabel.fLastParent = null;
			pLabel.fKey = vKey;
			pLabel.fGroup = vGroup;
			pLabel.xDropCallback = new Function();
		} catch (e) {
			scCoLib.log("dragdrop.makeDraggableLabel: " + e);
		}
	},


	setConstraintBox : function(pLabel, pNode) {
		try {
			const vCoords = scDragMgr.coordinates;
			const vMaxTopLeft = vCoords.topLeftOffset(pNode);
			const vMaxBottomRight = vCoords.bottomRightOffset(pNode).minus(vCoords._size(pLabel));
			pLabel.fGroup.addTransform(function(pCoordinate, pDragEvent) {
				return pCoordinate.constrainTo(vMaxTopLeft, vMaxBottomRight);
			})
		} catch (e) {
			scCoLib.log("dragdrop.setConstraintBox: " + e);
		}
	},


	setCallback : function(pLabel, pfunction) {
		try {
			pLabel.xDropCallback = pfunction;
		} catch (e) {
			scCoLib.log("dragdrop.setCallback: " + e);
		}
	},


	setDraggable : function (pLabel, pIsDraggable) {
		try {
			pLabel.fGroup.setDraggable(pIsDraggable);
			const vStyle = pLabel.style;
			if(vStyle["position"]) vStyle["position"] = (pIsDraggable ? (pLabel.fStylePosDrag ? pLabel.fStylePosDrag : 'relative') : (pLabel.fStylePosBase ? pLabel.fStylePosBase : 'static'));
			if(scDragMgr.keyboard.fEnabled){
				if (pIsDraggable) pLabel.fGroup._handle.setAttribute("tabindex", "0");
				else pLabel.fGroup._handle.removeAttribute("tabindex");
			}
		} catch (e) {
			scCoLib.log("dragdrop.setDraggable: " + e);
		}
	},


	setDragClass : function(pLabel, pClass) {
		if (pClass) pLabel.fDragClass = pClass;
		else pLabel.fDragClass = "";
	},


	saveLabelPos : function (pLabel) {
		try {
			let vRetVal = '"x":' + pLabel.offsetLeft;
			vRetVal += ',"y":'+pLabel.offsetTop;
			return vRetVal;
		} catch (e) {
			scCoLib.log("dragdrop.saveLabelPos: " + e);
		}
	},



	_emptyLabels : function(pContainer) {
		if  (typeof pContainer != "undefined") {
			let vChild = pContainer.firstChild;
			while (vChild != null) {
				if  (vChild.fIsDraggable) {
					const vNextChild = vChild.nextSibling;
					pContainer.removeChild(vChild);
					vChild = vNextChild;
				} else vChild = vChild.nextSibling;
			}
		}
	},


	_populate : function(pContainer) {
		if  (typeof pContainer != "undefined" && pContainer.labelsToAdd) {
			let i = 0;
			const n = pContainer.labelsToAdd.length;
			for (; i < n; i++) {
				if (pContainer.labelsToAdd[i] && pContainer.labelsToAdd[i].label) {
					const vLabel = pContainer.labelsToAdd[i].label;
					pContainer.appendChild(vLabel);
					if (pContainer.fCatchment.fDropMode === 'inBulk') {
						scDragMgr.coordinates.create((pContainer.labelsToAdd[i].x ? pContainer.labelsToAdd[i].x : 0), (pContainer.labelsToAdd[i].y ? pContainer.labelsToAdd[i].y : 0)).reposition(vLabel);
					} else scDragMgr.coordinates.create(0, 0).reposition(vLabel);
				}
			}
			pContainer.fCatchment.fUpdatable = true;
			pContainer.fCatchment.xUpdateGui();
			pContainer.labelsToAdd = null;
		}
	},


	_UpdateCatchments : function(pKey, pForce) {
		let vCatchment = scDragMgr.dragdrop.fFirstCatchments[pKey];
		while (vCatchment != null) {
			if (pForce || vCatchment.fUpdatable){
				if(vCatchment.fArea){
					const vImgtopLeftPosition = scDragMgr.coordinates.topLeftOffset(vCatchment.fImage);
					switch(vCatchment.shape.toLowerCase()){
						case "circle":
							vCatchment.centerPosition = vImgtopLeftPosition.plus(vCatchment.centerDelta);
							break;
						case "poly":
							for (let i = 0; i < vCatchment.pointsDelta.length; i++) vCatchment.pointsPosition[i] = vImgtopLeftPosition.plus(vCatchment.pointsDelta[i]);
							break;
						case "rect":
							vCatchment.topLeftPosition = vImgtopLeftPosition.plus(vCatchment.topLeftDelta);
							vCatchment.bottomRightPosition = vImgtopLeftPosition.plus(vCatchment.bottomRightDelta);
					}
				} else {
					vCatchment.topLeftPosition = scDragMgr.coordinates.topLeftOffset(vCatchment);
					vCatchment.bottomRightPosition = scDragMgr.coordinates.bottomRightOffset(vCatchment);
				}
				vCatchment.fUpdatable = false;
			}
			vCatchment = vCatchment.fNextCatchment;
		}
	},


	_UpdateGui : function() {
		let vHasItems = false;
		if  (typeof this.fContainer != "undefined") {
			let vChild = this.fContainer.lastChild;
			while (vChild != null && !vHasItems) {
				if  (vChild.fIsDraggable) {
					vHasItems = true;
				}
				vChild = vChild.previousSibling;
			}
			if (typeof this.fIfEmpty != "undefined") {
				if (typeof this.fContainer != "undefined" && this.fContainer !== this) this.fContainer.style["display"] = (!vHasItems ? "none" : this.fContainer.fDelaultDisplay);
				this.fIfEmpty.style["display"] = (vHasItems ? "none" : this.fIfEmpty.fDelaultDisplay);
			}
		}
		scDragMgr.dragdrop._UpdateCatchments(this.fKey);
		return vHasItems;
	},


	_IsDropable : function(pDragEvent) {
		return( this.fMaxLabels === -1 || scDragMgr.dragdrop.countLabels(this.fContainer) < this.fMaxLabels || pDragEvent.group.element.parentNode.fCatchment === this );
	},

	_onDragOver : function(pDragEvent) {
		const vItem = pDragEvent.group.element;
		const vCurrentCatchment = vItem.parentNode.fCatchment;
		vCurrentCatchment.onDragOut();
		scDragMgr.helpers.delClass(vCurrentCatchment, vCurrentCatchment.fDragOverClass);
		vCurrentCatchment.fContainer.removeChild(vItem);
		vCurrentCatchment.fUpdatable = true;
		vCurrentCatchment.xUpdateGui();
		this.fContainer.appendChild(vItem);
		this.fContainer.fCatchment.fUpdatable = true;
		vItem.fLastContainer = this.fContainer;
		this.xUpdateGui();
		this.onDragOver();
		scDragMgr.helpers.addClass(this, this.fDragOverClass);
	},

	_onDragOut : function(pDragEvent) {
		const vItem = pDragEvent.group.element;
		const vCurrentContainer = vItem.parentNode;
		const vCurrentCatchment = vCurrentContainer.fCatchment;
		vCurrentCatchment.onDragOut()
		scDragMgr.helpers.delClass(vCurrentCatchment, vCurrentCatchment.fDragOverClass);
		vItem.fLastContainer = null;
		if (! vCurrentCatchment.fResizeOnDragOut){

			if (scCoLib.isIE){

				vCurrentCatchment.style.height = (vCurrentCatchment.offsetHeight - scCoLib.toInt(vCurrentCatchment.currentStyle.borderTopWidth) - scCoLib.toInt(vCurrentCatchment.currentStyle.borderBottomWidth))+"px";
				vCurrentCatchment.style.width = (vCurrentCatchment.offsetWidth - scCoLib.toInt(vCurrentCatchment.currentStyle.borderLeftWidth) - scCoLib.toInt(vCurrentCatchment.currentStyle.borderRightWidth))+"px";
			} else {
				vCurrentCatchment.style.height = (vCurrentCatchment.clientHeight!==""?vCurrentCatchment.clientHeight+"px":"");
				vCurrentCatchment.style.width = (vCurrentCatchment.clientWidth!==""?vCurrentCatchment.clientWidth+"px":"");
			}
		}
		if (vCurrentContainer !== vItem.fStartContainer) {
			vCurrentCatchment.fContainer.removeChild(vItem);
			vCurrentCatchment.fUpdatable = true;
			vCurrentCatchment.xUpdateGui();
			if (vItem.fStartPrevSibling) vItem.fStartContainer.insertBefore(vItem, vItem.fStartPrevSibling ? scDragMgr.helpers.nextItem(vItem.fStartPrevSibling, vItem.fStartPrevSibling.nodeName) : null);
			else if (vItem.fStartNextSibling) vItem.fStartContainer.insertBefore(vItem, vItem.fStartNextSibling);
			else vItem.fStartContainer.appendChild(vItem);
			vItem.fStartContainer.fCatchment.fUpdatable = true;
		} else {
			if (vItem.fStartPrevSibling) scDragMgr.helpers.moveAfter(vItem, vItem.fStartPrevSibling);
			else if (vItem.fStartNextSibling) scDragMgr.helpers.moveBefore(vItem, vItem.fStartNextSibling);
		}
		vItem.fStartContainer.fCatchment.xUpdateGui();
	},

	_onDropReposition : function(pDragEvent) {
		const vItem = pDragEvent.group.element;
		scDragMgr.coordinates.create(0, 0).reposition(vItem);
	},


	_onDragSort : function(pDragEvent) {
		let vThreshold, vThresholdLeft, vThresholdRight;
		const vHelpers = scDragMgr.helpers;
		const vItem = pDragEvent.group.element;
		let vMoveTo = null;
		const vCoordinates = scDragMgr.coordinates;
		const vXmouse = pDragEvent.transformedMouseOffset;
		let vPrevious = vHelpers.previousItem(vItem, vItem.nodeName);
		while (vPrevious != null) {
			if(scDragMgr.fIsRtl){
				vThresholdLeft = vCoordinates.bottomLeftOffset(vPrevious);
				vThresholdRight = vCoordinates.bottomRightOffset(vPrevious);
				if(vHelpers.previousItem(vPrevious, vItem.nodeName)){
					if (vXmouse.y <= vThresholdLeft.y && vXmouse.x >= vThresholdLeft.x && vXmouse.x < vThresholdRight.x) {
						vMoveTo = vPrevious;
					}
				} else {
					if (vXmouse.y <= vThresholdLeft.y && vXmouse.x >= vThresholdLeft.x) {
						vMoveTo = vPrevious;
					}
				}
			} else {
				vThreshold = vCoordinates.bottomRightOffset(vPrevious);
				if (vXmouse.y <= vThreshold.y && vXmouse.x <= vThreshold.x) {
					vMoveTo = vPrevious;
				}
			}
			vPrevious = vHelpers.previousItem(vPrevious, vItem.nodeName);
		}
		if (vMoveTo != null) {
			vHelpers.moveBefore(vItem, vMoveTo);
			vItem.fForceDropCallback = true;
			return;
		}
		let vNext = vHelpers.nextItem(vItem, vItem.nodeName);
		while (vNext != null) {
			if(scDragMgr.fIsRtl){
				vThresholdLeft = vCoordinates.topLeftOffset(vNext);
				vThresholdRight = vCoordinates.topRightOffset(vNext);
				if (vHelpers.nextItem(vNext, vItem.nodeName)){
					if (vThresholdLeft.y <= vXmouse.y && vThresholdRight.x >= vXmouse.x && vThresholdLeft.x < vXmouse.x) {
						vMoveTo = vNext;
					}
				} else {
					if (vThresholdLeft.y <= vXmouse.y && vThresholdRight.x >= vXmouse.x) {
						vMoveTo = vNext;
					}
				}
			} else {
				vThreshold = vCoordinates.topLeftOffset(vNext);
				if (vThreshold.y <= vXmouse.y && vThreshold.x <= vXmouse.x) {
					vMoveTo = vNext;
				}
			}
			vNext = vHelpers.nextItem(vNext, vItem.nodeName);
		}
		if (vMoveTo != null) {
			vHelpers.moveBefore(vItem, vHelpers.nextItem(vMoveTo, vItem.nodeName));
			vItem.fForceDropCallback = true;
		}
	},


	_onDragStart : function(pDragEvent) {
		const vItem = pDragEvent.group.element;

		scDragMgr.dragdrop._UpdateCatchments(vItem.fKey, true);

		vItem.fStartContainer = vItem.parentNode;
		vItem.fStartPrevSibling = scDragMgr.helpers.previousItem(vItem, vItem.nodeName);
		vItem.fStartNextSibling = scDragMgr.helpers.nextItem(vItem, vItem.nodeName);
		vItem.fLastContainer = vItem.fStartContainer;
		scDragMgr.helpers.addClass(vItem, vItem.fDragClass);
		vItem.parentNode.fCatchment.onDragOver();


		if (scTooltipMgr) scTooltipMgr.hideTooltip(true);

		scDragMgr.helpers.addClass(vItem.parentNode.fCatchment, vItem.parentNode.fCatchment.fDragOverClass);
	},

	_onDragMove : function(pDragEvent) {
		const vItem = pDragEvent.group.element;


		let vIsOutside = true;
		let vCatchment = scDragMgr.dragdrop.fFirstCatchments[vItem.fKey];
		while (vCatchment != null) {
			if (scDragMgr.helpers.isMouseInside(pDragEvent, vCatchment) && vCatchment.xIsDropable(pDragEvent)) {
				vIsOutside = false;
				break;
			}
			vCatchment = vCatchment.fNextCatchment;
		}

		if (vIsOutside) {
			if (vItem.fLastContainer != null) {
				vItem.fLastContainer.fCatchment.xOnDragOut(pDragEvent);
			}

		} else if (vCatchment && (vItem.fLastContainer == null || vCatchment !== vItem.fLastContainer.fCatchment)) {
			vCatchment.xOnDragOver(pDragEvent);
		}
		if (vCatchment) vCatchment.xOnDragPostProcess(pDragEvent, vCatchment);
	},

	_onDragEnd : function(pDragEvent) {
		const vItem = pDragEvent.group.element;
		scDragMgr.helpers.delClass(vItem, vItem.fDragClass);
		vItem.parentNode.fCatchment.onDragOut();
		scDragMgr.helpers.delClass(vItem.parentNode.fCatchment, vItem.parentNode.fCatchment.fDragOverClass);

		let vCatchment = scDragMgr.dragdrop.fFirstCatchments[vItem.fKey];
		while (vCatchment != null) {
			if (! vCatchment.fResizeOnDragOut){
				vCatchment.style.height="";
				vCatchment.style.width="";
			}
			vCatchment = vCatchment.fNextCatchment;
		}
		if (vItem.fForceDropCallback || vItem.fStartContainer !== vItem.parentNode) {
			try{
				vItem.xDropCallback();
			} catch (e){
				scCoLib.log("dragdrop._onDragEnd: " + e);
			}
		}
		vItem.parentNode.fCatchment.xOnDragEndPostProcess(pDragEvent);
	},

	_keydown : function(event) {
		try {
			event = scDragMgr.events.fix(event);
			if (event.target === this && this.fContainer){
				if ( event.keyCode === 13){
					scDragMgr.keyboard.insertCurrentLabel(this.fContainer);
				}
			}
		} catch(e) {scCoLib.log("dragdrop._keydown: " + e);}
	},
}


scDragMgr.keyboard = {
	fEnabled : true,

	enable: function (pYes){
		this.fEnabled = (!!pYes);
		for (let vKey in scDragMgr.dragdrop.fFirstCatchments){
			let vCatchment = scDragMgr.dragdrop.fFirstCatchments[vKey];
			while (vCatchment != null) {
				vCatchment.removeAttribute("tabindex");
				const vLabels = scDragMgr.dragdrop.getLabels(vCatchment.fContainer);
				for (let j = 0, n = vLabels.length; j < n; j++) {
					vLabels[j].fGroup._handle.removeAttribute("data-selected");
					if (this.fEnabled) vLabels[j].fGroup._handle.setAttribute("tabindex", "0");
					else vLabels[j].fGroup._handle.removeAttribute("tabindex");
				}
				vCatchment = vCatchment.fNextCatchment;
			}
		}
	},

	moveLabelUp: function (pLabel){
		if (pLabel.previousElementSibling){
			pLabel.parentNode.insertBefore(pLabel, pLabel.previousElementSibling);
			try{
				pLabel.xDropCallback();
			} catch (e){
				scCoLib.log("scDragMgr.keyboard.moveLabelUp.xDropCallback: " + e);
			}
			pLabel.focus();
		}
	},

	moveLabelDown: function (pLabel){
		if (pLabel.nextElementSibling){
			pLabel.parentNode.insertBefore(pLabel, pLabel.nextElementSibling.nextElementSibling);
			try{
				pLabel.xDropCallback();
			} catch (e){
				scCoLib.log("scDragMgr.keyboard.moveLabelDown.xDropCallback: " + e);
			}
			pLabel.focus();
		}
	},

	selectLabel: function (pLabel){
		try {
			if (!this.fEnabled) return;
			if (this.fCurrentLabel) pLabel.fGroup._handle.removeAttribute("data-selected");
			this.fCurrentLabel = pLabel;
			pLabel.fGroup._handle.setAttribute("data-selected", "true");
			let vCatchment = scDragMgr.dragdrop.fFirstCatchments[pLabel.parentNode.fCatchment.fKey];
			while (vCatchment != null) {
				vCatchment.setAttribute("tabindex", "0");
				const vLabels = scDragMgr.dragdrop.getLabels(vCatchment.fContainer);
				for (let i = 0, n = vLabels.length; i < n; i++) {
					vLabels[i].fGroup._handle.removeAttribute("tabindex");
				}
				vCatchment = vCatchment.fNextCatchment;
			}
			pLabel.parentNode.fCatchment.focus();
		} catch(e) {scCoLib.log("scDragMgr.keyboard.selectLabel: " + e);}
	},

	insertCurrentLabel: function (pContainer){
		try {
			if (!this.fEnabled || !this.fCurrentLabel) return;
			const vOldContainer = this.fCurrentLabel.parentNode;
			pContainer.appendChild(this.fCurrentLabel);
			if (pContainer.fCatchment.fDropMode === 'inBulk') {
				scDragMgr.coordinates.create((this.fCurrentLabel.x ? this.fCurrentLabel.x : 0), (this.fCurrentLabel.y ? this.fCurrentLabel.y : 0)).reposition(this.fCurrentLabel);
			} else scDragMgr.coordinates.create(0, 0).reposition(this.fCurrentLabel);
			pContainer.fCatchment.fUpdatable = true;
			pContainer.fCatchment.xUpdateGui();
			vOldContainer.fCatchment.fUpdatable = true;
			vOldContainer.fCatchment.xUpdateGui();
			let vCatchment = scDragMgr.dragdrop.fFirstCatchments[pContainer.fCatchment.fKey];
			while (vCatchment != null) {
				vCatchment.removeAttribute("tabindex");
				const vLabels = scDragMgr.dragdrop.getLabels(vCatchment.fContainer);
				let i = 0;
				const n = vLabels.length;
				for (; i < n; i++) {
					vLabels[i].fGroup._handle.removeAttribute("tabindex");
					if (vLabels[i].fGroup._draggable) vLabels[i].fGroup._handle.setAttribute("tabindex", "0");
				}
				vCatchment = vCatchment.fNextCatchment;
			}
			this.fCurrentLabel.focus();
			this.fCurrentLabel.fGroup._handle.removeAttribute("data-selected");

			if (this.fCurrentLabel.fForceDropCallback || vOldContainer !== pContainer) {
				try{
					this.fCurrentLabel.xDropCallback();
				} catch (e){
					scCoLib.log("scDragMgr.keyboard.insertCurrentLabel.xDropCallback: " + e);
				}
			}
			this.fCurrentLabel = null;
		} catch(e) {scCoLib.log("scDragMgr.keyboard.insertCurrentLabel: " + e);}
	}
}