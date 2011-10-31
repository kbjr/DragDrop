/**
 * DragDrop.js
 *
 * A JavaScript micro-framework for adding drag-and-drop functionality
 * to elements for advanced UI development.
 *
 * @author     James Brumond
 * @version    0.1.2-beta
 * @copyright  Copyright 2011 James Brumond
 * @license    Dual licensed under MIT and GPL
 */

(function() {
	
	var
	
	// When an error occurs, should the error be thrown?
	throwErrors = true,
	
	// Is this a touch device?
	touchEvents = (function() {
		var ret, elem = document.createElement('div');
		ret = ('ontouchstart' in elem);
		elem = null;
		return ret;
	}()),
	
	// A class to add when an element is being dragged
	dragClass = 'drag',
	
	/**
	 * The DragDrop namespace
	 *
	 * Example:
	 * 
	 *   DragDrop.bind(elem[, anchor]);
	 *   DragDrop.unbind(elem[, anchor]);
	 *
	 * @access  public
	 */
	DragDrop = (new (function() {
		
		var
		
		// Scoped reference to this
		self = this,
		
		// Determine the events to bind to
		events = (function() {
			if (touchEvents) {
				return {
					start: 'touchstart',
					move: 'touchmove',
					end: 'touchend'
				};
			} else {
				return {
					start: 'mousedown',
					move: 'mousemove',
					end: 'mouseup'
				};
			}
		}()),
		
		// Elements already bound
		bound = [ ],
		
		// Check if the given elements are already bound
		getBinding = function(elem, anchor) {
			for (var i = 0, c = bound.length; i < c; i++) {
				if (bound[i].elem === elem && bound[i].anchor === anchor) {
					return [i, bound[i]];
				}
			}
			return false;
		};
		
	// ----------------------------------------------------------------------------
	//  Public Functions
		
		// Make an element draggable
		this.bind = function(elem, anchor) {
			if (typeof elem === 'object' && elem) {
				anchor = anchor || elem;
				// Check to make sure the elements aren't already bound
				if (! getBinding(elem, anchor)) {
					// Initialize the binding object
					var binding = {
						elem: elem,
						anchor: anchor,
						dragging: false,
						event: null,
						shouldUnbind: false
					};
					// Bind the first event
					binding.event = Events.bind(anchor, events.start, function(e) {
						// Make sure it's a left click
						if ((window.event && e.button === 1) || e.button === 0) {
							// Make sure everyone knows the element is being dragged
							binding.dragging = true;
							addClass(elem, dragClass);
							// Start calculating movement
							var
							posX = getPos(elem, 'left'),
							posY = getPos(elem, 'top'),
							tempEvents = [ ];
							// Bind the movement event
							tempEvents.push(Events.bind(document, events.move, function(e2) {
								var
								offsetX = e2.clientX - e.clientX,
								offsetY = e2.clientY - e.clientY;
								// Move the element
								elem.style.left = (posX + offsetX) + 'px';
								elem.style.top = (posY + offsetY) + 'px';
								
								return stopEvent(e2);
							}));
							// Bind the release event
							tempEvents.push(Events.bind(document, events.end, function(e2) {
								for (var i = 0, c = tempEvents.length; i < c; i++) {
									Events.unbind(tempEvents[i]);
								}
								binding.dragging = false;
								removeClass(elem, dragClass);
								if (binding.shouldUnbind) {
									DragDrop.unbind(elem, anchor);
								}
								
								return stopEvent(e2);
							}));
							// Avoid text selection problems
							document.body.focus();
							tempEvents.push(Events.bind(document, 'selectstart', false));
							tempEvents.push(Events.bind(anchor, 'dragstart', false));
							
							return stopEvent(e);
						}
					});
					// Add the binding to the list
					bound.push(binding);
				}
			}
			
			// Handle bad parameters
			else if (throwErrors) {
				var type = typeof elem;
				type = (type === 'object') ? 'NULL' : '"' + type + '"';
				throw new TypeError('DragDrop.bind: argument 1 expects type "object", ' + type + ' given.');
			}
		};
		
		// Remove an element's draggableness
		this.unbind = function(elem, anchor) {
			if (typeof elem === 'object' && elem) {
				var binding = getBinding(elem, anchor), index;
				if (binding) {
					index = binding[0];
					binding = binding[1];
					if (binding.dragging) {
						binding.shouldUnbind = true;
					} else {
						Events.unbind(binding.event);
						arrayRemove(bound, index);
					}
				}
			}
			
			// Handle bad parameters
			else if (throwErrors) {
				var type = typeof elem;
				type = (type === 'object') ? 'NULL' : '"' + type + '"';
				throw new TypeError('DragDrop.unbind: argument 1 expects type "object", ' + type + ' given.');
			}
		};
		
	})()),
	
// ----------------------------------------------------------------------------
//  Helper Functions
	
	// Array Remove - By John Resig (MIT Licensed)
	arrayRemove = function(array, from, to) {
		var rest = array.slice((to || from) + 1 || array.length);
		array.length = from < 0 ? array.length + from : from;
		return array.push.apply(array, rest);
	},
	
	// Get the position of an element
	getPos = function(elem, from) {
		var pos = parseFloat(getStyle(elem, from));
		return (isNaN(pos) ? 0 : pos);
	},
	
	// Get a style property from an element
	getStyle = function(elem, prop) {
		if (elem.currentStyle) {
			return elem.currentStyle[prop];
		} else if (window.getComputedStyle) {
			return document.defaultView.getComputedStyle(elem, null).getPropertyValue(prop);
		} else if (elem.style) {
			return elem.style[prop];
		}
	},
	
	// Stop an event
	stopEvent = function(evt) {
		if (evt.preventDefault) {
			evt.preventDefault();
		}
		if (evt.stopPropagation) {
			evt.stopPropagation();
		}
		evt.returnValue = false;
		return false;
	},
	
	// Regular expressions for matching classnames
	cnRegexes = { },

	// Remove a class from an element
	removeClass = function(elem, cn) {
		if (! cnRegexes[cn]) {
			cnRegexes[cn] = new RegExp('(^|\\s)+' + cn + '(\\s|$)+');
		}
		elem.className = elem.className.replace(cnRegexes[cn], ' ');
	},
	
	// Add a class to an element
	addClass = function(elem, cn) {
		removeClass(elem, cn);
		elem.className += ' ' + cn;
	},
	
	/**
	 * A namespace with functions for event binding
	 *
	 * Example:
	 *
	 *   Bind
	 *    var evt = Events.bind(obj, 'event', function() { ... });
	 *
	 *   Unbind
	 *    Events.unbind(evt);
	 *     -OR-
	 *    evt.unbind();
	 *
	 * @access  private
	 */
	Events = (function() {
	
		var
	
		// Bind an event
		bindEvent = (function() {
			if (document.addEventListener) {
				return function(obj, event, func) {
					obj.addEventListener(event, func, false);
				};
			} else if (document.attachEvent) {
				return function(obj, event, func) {
					obj.attachEvent('on' + event, func);
				};
			} else {
				return function() {
					if (throwErrors) {
						throw new Error('DragDrop->Events->bindEvent: Could not bind event. No event binder found.');
					}
				};
			}
		}()),
	
		// Unbind an event
		unbindEvent = (function() {
			if (document.removeEventListener) {
				return function(obj, event, func) {
					obj.removeEventListener(event, func, false);
				};
			} else if (document.detachEvent) {
				return function(obj, event, func) {
					obj.detachEvent('on' + event, func);
				};
			} else {
				return function() {
					if (throwErrors) {
						throw new Error('DragDrop->Events->unbindEvent: Could not unbind event. No event unbinder found.');
					}
				};
			}
		}());
		
		// Build the return value
		return {
			bind: function(obj, event, func) {
				var oldFunc = (func === false) ? function(e) {
					return stopEvent(e);
				} : func;
				func = function(e) {
					return oldFunc.call(obj, e || window.event);
				};
				bindEvent(obj, event, func);
				var ret = function() {
					unbindEvent(obj, event, func);
				};
				ret.unbind = function() {ret();};
				return ret;
			},
			unbind: function(unbinder) {
				unbinder();
			}
		};
	
	}());
	
// ----------------------------------------------------------------------------
//  Expose
	
	window.DragDrop = DragDrop;
	
}());
