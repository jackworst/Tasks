var model = {
	items: []
};

var findItem = function(id) {
	var theItem;
	$.each(model.items, function(i, item) {
		if (item.id === id) {
			theItem = item;
			return false;
		}
	});
	return theItem;
};

var addItem = function(newItem) {
	model.items.push(newItem);
};

var updateItem = function(id, newItem) {
	model.items = $.map(model.items, function(item) {
		return (item.id === id) ? newItem : item;
	});
};

var removeItem = function(id) {
	model.items = $.map(model.items, function(item) {
		return (item.id === id) ? null : item;
	});
};

var renderItem = function(item, expanded, editMode) {
	var el = $('<div class="item clearfix"/>').attr("data-id", item.id).addClass(item.done ? "done" : "pending");
	
	var toggleDone; 
	if (item.done) {
		toggleDone = $('<button class="undone"/>').text("undone");
	} else {
		toggleDone = $('<button class="done"/>').text("done");
	}
	
	var title;
	if (editMode) {
		title = $('<input type="text" class="title"/>').val(item.title);
	} else {
		title = $('<p class="title"/>').text(item.title);
	}
	
	if (expanded) {
		el.append($('<button class="collapse"/>').text("collapse"));
		el.append($('<button class="delete"/>').text("delete"));
		el.append($('<button class="edit"/>').text("edit"));
		el.append(toggleDone);
		el.append(title);
		if (editMode) {
			el.append($('<button class="save"/>').text("save"));
		}
	} else {
		el.append($('<button class="expand"/>').text("expand"));
		el.append(toggleDone);
		el.append(title);
	}
	
	if (expanded) {
		if (editMode) {
			el.append($('<textarea class="description"/>').val(item.description));
		} else {
			el.append($('<p class="description"/>').text(item.description));
		}
	}
	
	$("button.expand,button.collapse", el).click(function() {
		var expand = $(this).hasClass("expand");
		var url = getItemUrl({id: item.id, full: expand});
		$.getJSON(url, function(item) {
			updateItem(item.id, item);
			el.replaceWith(renderItem(item, expand));
		});
	});
	
	$("button.delete", el).click(function() {
		var url = deleteItemUrl({id: item.id});
		$.ajax({
			url: url,
			type: "POST",
			success: function() {
				removeItem(item.id);
				el.remove();
				updateCounter();
			}
		});
	});
	
	$("button.edit", el).click(function() {
		el.replaceWith(renderItem(findItem(item.id), true, true));
	});
	
	$("button.done,button.undone", el).click(function() {
		var url = setDoneUrl({id: item.id, done: $(this).hasClass("done")});
		$.ajax({
			url: url,
			type: "POST",
			success: function(item) {
				updateItem(item.id, item);
				el.replaceWith(renderItem(item));
			}
		});
	});
	
	$("button.save", el).click(function() {
		var url = updateItemUrl({id: item.id});
		$.ajax({
			url: url,
			type: "POST",
			data: {
				title: $(".title",el).val(),
				description: $(".description",el).val()
			},
			success: function(item) {
				updateItem(item.id, item);
				el.replaceWith(renderItem(item, true));
			}
		});
	});
	
	return el;
};

var renderItemsList = function() {
	var list = $('<div id="list"/>')
	$.each(model.items, function(i, item) {
		list.append(renderItem(item));
	});
	
	return list;
};

var updateCounter = function() {
	$("#counter").text("there are " + model.items.length + " items");
};
var updateItemsList = function(query) {
	$.getJSON(queryUrl({query: query || ""}), function(items) {
		model.items = items;
		$("#list").replaceWith(renderItemsList());
		updateCounter();
	});
}

$().ready(function() {
	updateItemsList();
	
	$("#find").click(function(){
		updateItemsList($("#query").val());
		return false;
	});
	$("#add").click(function(){
		var url = createItemUrl();
		$.ajax({
			url: url,
			type: "POST",
			data: {title: $("#query").val()},
			success: function(item) {
				addItem(item);
				$("#list").append(renderItem(item));
				updateCounter();
			}
		});
		return false;
	});
});