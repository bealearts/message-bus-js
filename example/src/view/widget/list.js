
"use strict";

var selectedItem;

var onRenderItem = function (dataItem, itemRenderer) {};


window.onload = function()
{
	MessageBus.receive(function(message){
		if (Array.isArray(message))
		{
			updateRenderers(message);
		}
	}, null, 'Array');
}


function updateRenderers(data)
{
	var content = document.getElementById('content');
	var itemRenderer = document.getElementById('itemRenderer');

	var index = 0;
	var itemWidth = 100/data.length;
	
	data.forEach(function (item) {
		var newRenderer = itemRenderer.cloneNode(true);
		;
		newRenderer.setAttribute('height', itemWidth+'%');
		newRenderer.setAttribute('y', (itemWidth*index)+'%');
		newRenderer.addEventListener('click', onClick);
		
		content.appendChild(newRenderer);
		onRenderItem(item, newRenderer);
		
		index++;
	});
}


function onClick(event)
{
	// Clear current selection
	if (selectedItem)
		selectedItem.setAttribute('class', '');
	
	selectedItem = event.currentTarget;
	selectedItem.setAttribute('class', 'selected');
}
