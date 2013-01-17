
"use strict";

window.onload = function()
{
	MessageBus.receive(function(message, scope, identifier, namespace){
		if (identifier === 'Shape')
		{
			updateView(message);
			updateImage(message);
		}
	}, null, 'Shape');
}



function updateView(shape)
{
	var shapeName = document.getElementById('shape-name');
	shapeName.textContent = shape.name;
}


function updateImage(shape)
{	
	var shapeImage = document.getElementById('shape-image');
	shapeImage.src = shape.mainURL;
}