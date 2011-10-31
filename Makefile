
JS_MIN = uglifyjs
JS_MIN_FLAGS = --unsafe

build:
	${JS_MIN} ${JS_MIN_FLAGS} drag-drop.js > drag-drop.min.js

clean:
	rm -f drag-drop.min.js

