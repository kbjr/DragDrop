(function() {

	$.fn.dragdrop = function(opts) {
		opts = opts || { };
		
		var bindings = [ ];
		this.each(function() {
			var options = $.extend({ }, opts);
			if (typeof options.anchor === 'string') {
				options.anchor = $(options.anchor, this)[0];
			}
			bindings.push(DragDrop.bind(this, options));
		});

		return {
			unbind: function() {
				for (var i = 0, c = bindings.length; i < c; i++) {
					DragDrop.unbind(bindings[i]);
				}
			}
		};
	};

}());
