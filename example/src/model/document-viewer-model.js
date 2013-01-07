
"use strict;"

importScripts('../../../src/message-bus.js');


MessageBus.send("Worker");

setTimeout(function (){
	MessageBus.send("Worker");
}, 1000);

//console.log('Im a worker');