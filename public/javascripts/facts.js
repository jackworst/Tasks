var myOwnerId = "web";

var model = {
	items : {}
};

var decodeFact = function(fact) {
	var eq = fact.indexOf("=");
	var at = fact.indexOf("@");
	var keyTokens = fact.substring(0, at).split("-");

	var hiFact = {
		owner : keyTokens[0],
		item : keyTokens[1],
		property : keyTokens[2],
		timestamp : new Date(parseInt(fact.substring(at + 1, eq))),
		// set sequence here and in java constructor too?
		value : fact.substring(eq + 1, fact.length)
	};

	return hiFact;
};

var extractTimestamp = function(timestampedValue) {
	var eq = timestampedValue.indexOf("=");
	return timestampedValue.substring(1, eq);
};

var encodeFact = function(hiFact) {
	return encodeFactKey(hiFact) + encodeFactTimestampedValue(hiFact);
};

var encodeFactKey = function(hiFact) {
	return hiFact.owner + "-" + hiFact.item + "-" + hiFact.property;
};

var encodeFactTimestampedValue = function(hiFact) {
	return "@" + hiFact.timestamp.getTime() + "=" + hiFact.value;
};

var handleFacts = function(facts) {
	$.each(facts, function(i, fact) {
		handleFact(fact);
	});
};

var handleFact = function(fact) {
	handleHiFact(decodeFact(fact));
};

var handleHiFact = function(hiFact) {
	var key = hiFact.owner + "-" + hiFact.item + "-" + hiFact.property;
	var oldData = localStorage[key];
	var oldHiFact = oldData && decodeFact(key + oldData);

	if (oldHiFact) {
		if (hiFact.timestamp > oldHiFact.timestamp) {
			// replace value and timestamp of existing entry owner-item-property
			oldHiFact.value = hiFact.value;
			oldHiFact.timestamp = hiFact.timestamp;
			localStorage[key] = encodeFactTimestampedValue(oldHiFact);
			// console.log("updated", key);
			updateModelWithHiFact(oldHiFact);
		}
	} else {
		// add new entry owner-item-property
		hiFact.sequence = new Date().getTime();
		localStorage[key] = encodeFactTimestampedValue(hiFact);
		// console.log("added", key);
		updateModelWithHiFact(hiFact);
	}
};

var updateModelWithHiFact = function(hiFact) {
	var ownerItem = hiFact.owner + "-" + hiFact.item;
	if (!model.items[ownerItem]) {
		model.items[ownerItem] = {};
	}
	model.items[ownerItem][hiFact.property] = hiFact.value;
};

var listItems = function() {
	var div = $('<div/>');
	$.each(model.items, function(i, item) {
		var itemEl = $('<dl/>').append($('<h3/>').text(i));
		$.each(item, function(k, v) {
			itemEl.append($('<dt/>').text(k));
			itemEl.append($('<dd/>').text(v));
		});
		div.append(itemEl).append('<hr/>');
	});
	$("body").append('<hr/>').append(div);
};

$().ready(function() {
	var sendSequence = localStorage.sendSequence || -1;
	var newSendSequence = new Date().getTime();
	var factsToSend = [];
	for ( var i = 0; i < localStorage.length; i++) {
		var key = localStorage.key(i);
		// FIXME: use other keynames, whitelist based!
		if (key !== "sequence" && key !== "sendSequence") {
			var oldData = localStorage[key];
			var oldHiFact = oldData && decodeFact(key + oldData);
			updateModelWithHiFact(oldHiFact);
			if (parseInt(extractTimestamp(oldData), 10) > sendSequence) {
				factsToSend.push(key + oldData);
			}
		}
	}
	
	//factsToSend.push("ed-obj2-blupi@410000=br");
	console.log("facts up", factsToSend);

	var sync = syncUrl({
		owner : myOwnerId,
		sequence : localStorage.sequence || -1
	});
	$.ajax({
		url : sync,
		type : 'POST',
		data : {
			facts : factsToSend
		},
		success : function(result) {
			var newSequence = result[0];
			var facts = result[1];
			console.log("facts down", localStorage.sequence, facts)
			handleFacts(facts);
			localStorage.sequence = newSequence;
			localStorage.sendSequence = newSendSequence;
			
			listItems();
		}
	});
});
