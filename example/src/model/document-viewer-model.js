
"use strict;"

importScripts('../../../src/message-bus.js');
importScripts('domain.js');



var shapes = [
	new Shape('Star', '../images/star-icon.png'),
	new Shape('Globe', '../images/globe-icon.png'),
	new Shape('Rose', '../images/rose-icon.png'),
	new Shape('Arrow', '../images/arrow-icon.png')
];


MessageBus.send(shapes);


//console.log('Im a worker');