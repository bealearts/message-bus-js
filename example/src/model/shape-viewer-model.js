
"use strict;"

importScripts('../../../src/message-bus.js');
importScripts('domain.js');



var shapes = [
	new Shape('Star', '../images/star-icon.png', 'images/star.png'),
	new Shape('Globe', '../images/globe-icon.png', 'images/globe.png'),
	new Shape('Rose', '../images/rose-icon.png', 'images/rose.png'),
	new Shape('Arrow', '../images/arrow-icon.png', 'images/arrow.png')
];


MessageBus.send(shapes);



MessageBus.receive(function (message, scope, identifier) {
	if (identifier === 'SELECTED-SHAPE-INDEX')
	{
		MessageBus.send(shapes[message]);
	}
}, null, 'SELECTED-SHAPE-INDEX');



//console.log('Im a worker');