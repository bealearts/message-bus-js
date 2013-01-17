
"use strict";

var selectedItem;

var onRenderItem = function (dataItem, itemRenderer) {};

var onSeleted = function (index, dataItem) {} ;


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

		newRenderer.setAttribute('height', itemWidth+'%');
		newRenderer.setAttribute('y', (itemWidth*index)+'%');
		newRenderer.addEventListener('click', function (event) { 
			onClick(event, data, item) 
		});
		
		content.appendChild(newRenderer);
		onRenderItem(item, newRenderer);
		
		// Select first
		if (index == 0 && !selectedItem)
		{
			select(newRenderer, data, item);
		}
		
		index++;
	});
		
}


function onClick(event, data, dataItem)
{
	select(event.currentTarget, data, dataItem);
}


function select(itemRenderer, data, dataItem)
{
	// Clear current selection
	if (selectedItem)
		selectedItem.setAttribute('class', '');
	
	selectedItem = itemRenderer;
	selectedItem.setAttribute('class', 'selected');
	
	// Find index
	var index = 0;
	while(index != data.length)
	{
		if (data[index] === dataItem)
			break;
		
		index++;
	}
	
	onSeleted(index, dataItem);
}
