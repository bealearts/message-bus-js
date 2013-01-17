
"use strict";

window.onload = function()
{
	MessageBus.receive(function(message, scope, identifier, namespace){
		if (identifier === 'Shape')
		{
			updateView(message);
		}
	}, null, 'Shape');
}



function updateView(shape)
{
	//console.log(shape);
	
	var shapeName = document.getElementById('shape-name');
	shapeName.textContent = shape.name;
}