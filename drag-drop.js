/**
 * DragDrop.js
 *
 * A JavaScript micro-framework for adding drag-and-drop functionality
 * to elements for advanced UI development.
 *
 * @author     James Brumond
 * @version    0.2.1-beta
 * @copyright  Copyright 2011 James Brumond
 * @license    Dual licensed under MIT and GPL
 */

(function() {
	
	var
	
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
	 *   DragDrop.bind ( element[, options ]);
	 *   DragDrop.unbind ( reference );
	 *
	 * @access  public
	 */
	DragDrop = (function() {
		var self = { },
		
		// Determine the events to bind to
		events = (touchEvents ?
			{
				start: 'touchstart',
				move: 'touchmove',
				end: 'touchend'
			} : {
				start: 'mousedown',
				move: 'mousemove',
				end: 'mouseup'
			}
		),
		
		// Elements already bound
		bindings = [ ],
		
		// Check if a given binding (element/anchor pair) already exists
		bindingExists = function(element, anchor) {
			for (var i = 0, c = bindings.length; i < c; i++) {
				if (bindings.element === element && bindings.anchor === anchor) {
					return true;
				}
			}
			return false;
		},
		
		// Do something with a given binding's given event stack
		withBindingEvent = function(reference, event, func) {
			if (bindings[reference._id] && bindings[reference._id].events[event]) {
				func(bindings[reference._id].events[event]);
			}
		},
		
		// Parse the arguments of DragDrop.bind
		parseOptions = function(element, options) {
			options = options || { };
			options.element = element;
			options.anchor = options.anchor || element;
			options.boundingBox = options.boundingBox || null;
			return options;
		},
		
		// The next binding ID to use
		nextBinding = 1,

	// ------------------------------------------------------------------
	//  A constructor for a resource type used in referencing bindings
		
		BindingReference = function() {
			this._id = nextBinding++;
		};
		
		BindingReference.prototype.unbind = function() {
			return DragDrop.unbind(this);
		};
		
		BindingReference.prototype.bindEvent = function(event, func) {
			return DragDrop.bindEvent(this, event, func);
		};
		
		BindingReference.prototype.unbindEvent = function(event, func) {
			return DragDrop.unbindEvent(this, event, func);
		};
		
		BindingReference.prototype.invokeEvent = function(event, source) {
			return DragDrop.invokeEvent(this, event, source);
		};
		
	// ----------------------------------------------------------------------------
	//  Public Functions
		
		// Make an element draggable
		self.bind = function(element, options) {
			options = parseOptions(element, options);
			if (isObject(options.element)) {
				// Check to make sure the elements aren't already bound
				if (! bindingExists(options.element, options.anchor)) {
					// Initialize the binding object
					var reference = new BindingReference();
					var binding = {
						element: options.element,
						anchor: options.anchor,
						dragging: false,
						event: null,
						shouldUnbind: false,
						boundingBox: options.boundingBox,
						events: {
							dragstart: Callstack(options.dragstart),
							dragend: Callstack(options.dragend),
							drag: Callstack(options.drag)
						}
					};
					// Bind the first event
					binding.event = Events.bind(binding.anchor, events.start, function(e) {
						// Make sure it's a left click
						if ((window.event && e.button === 1) || e.button === 0) {
							// Make sure everyone knows the element is being dragged
							binding.dragging = true;
							addClass(binding.element, dragClass);
							// Start calculating movement
							var startX = getPos(binding.element, 'left');
							var startY = getPos(binding.element, 'top');
							var tempEvents = [ ];
							// Bind the movement event
							tempEvents.push(Events.bind(document, events.move, function(e2) {
								// Find all needed offsets
								var offsetX = e2.clientX - e.clientX;
								var offsetY = e2.clientY - e.clientY;
								var offsetWidth = binding.element.offsetWidth;
								var offsetHeight = binding.element.offsetHeight;
								// Find the new positions
								var posX = startX + offsetX;
								var posY = startY + offsetY;
								// Enforce any bounding box
								if (options.boundingBox) {
									var box = options.boundingBox;
									// Bound inside offset parent
									if (box === 'offsetParent') {
										
									}
									// Manual bounding box
									else if (typeof box === 'object') {
										posX = Math.min((box.x.max - offsetWidth), Math.max(box.x.min, posX));
										posY = Math.min((box.y.max - offsetHeight), Math.max(box.y.min, posY));
									}
								}
								// Move the element
								binding.element.style.left = posX + 'px';
								binding.element.style.top = posY + 'px';
								// Call any "drag" events
								binding.events.drag.call(
									binding.element, new DragEvent('drag', e2)
								);
								return stopEvent(e2);
							}));
							// Bind the release event
							tempEvents.push(Events.bind(document, events.end, function(e2) {
								// Unbind move and end events
								for (var i = 0, c = tempEvents.length; i < c; i++) {
									Events.unbind(tempEvents[i]);
								}
								// Clean up...
								binding.dragging = false;
								removeClass(binding.element, dragClass);
								if (binding.shouldUnbind) {
									DragDrop.unbind(binding.element, binding.anchor);
								}
								// Call any "dragend" events
								binding.events.dragend.call(
									binding.element, new DragEvent('dragend', e2)
								);
								return stopEvent(e2);
							}));
							// Avoid text selection problems
							document.body.focus();
							tempEvents.push(Events.bind(document, 'selectstart', false));
							tempEvents.push(Events.bind(binding.anchor, 'dragstart', false));
							// Call any "dragstart" events
							binding.events.dragstart.call(
								binding.element, new DragEvent('dragstart', e)
							);
							return stopEvent(e);
						}
					});
					// Add the binding to the list
					bindings[reference._id] = binding;
					return reference;
				}
			}
		};
		
		// Remove an element's draggableness
		self.unbind = function(reference) {
			if (reference instanceof BindingReference) {
				var id = reference._id;
				if (bindings[id]) {
					if (bindings[id].dragging) {
						bindings[id].shouldUnbind = true;
					} else {
						Events.unbind(bindings[id].event);
						bindings[id] = null;
					}
				}
			}
		};
		
		// Bind a drag event
		self.bindEvent = function(reference, event, func) {
			withBindingEvent(reference, event, function(stack) {
				stack.push(func);
			});
		};
		
		// Unbind a drag event
		self.unbindEvent = function(reference, event, func) {
			withBindingEvent(reference, event, function(stack) {
				stack.remove(func);
			});
		};
		
		// Manually invoke a drag event
		self.invokeEvent = function(reference, event, source) {
			withBindingEvent(reference, event, function(stack) {
				stack.call(
					bindings[reference._id].element,
					new DragEvent(event, source)
				);
			});
		};
		
		return self;
	}()),
	
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
	
	// Check for a non-null object
	isObject = function(value) {
		return !! (value && typeof value === 'object');
	},
	
	/**
	 * A stackable function
	 *
	 * @access  private
	 * @param   function  an initial function
	 * @return  function
	 */
	Callstack = function(func) {
		var stack = [ ];
		var result = function() {
			var ret;
			for (var i = 0, c = stack.length; i < c; i++) {
				ret = stack[i].apply(this, arguments);
			}
			return ret;
		};
		result.push = function() {
			stack.push.apply(stack, arguments);
		};
		result.remove = function() {
			var args = Array.prototype.slice.call(arguments);
			var result = [ ];
			OUTER: for (var i = 0, c1 = stack.length; i < c1; i++) {
				for (var j = 0, c2 = args.length; j < c2; j++) {
					if (stack[i] === args[j]) {
						continue OUTER;
					}
				}
				result.push(stack[i]);
			}
			stack = result;
		};
		if (typeof func === 'function') {
			stack.push(func);
		}
		return result;
	},
	
	/**
	 * Custom event constructor
	 *
	 * @access  private
	 * @param   string    type
	 * @param   object    original event object
	 */
	DragEvent = function DragEvent(type, original) {
		this.type = type;
		this.originalEvent = original;
		this.altKey = original.altKey || false;
		this.ctrlKey = original.ctrlKey || false;
		this.shiftKey = original.shiftKey || false;
		this.timestamp = original.timestamp || (+new Date);
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
				return function() { };
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
				return function() { };
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
