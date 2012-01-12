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
		timestamp : parseInt(fact.substring(at + 1, eq)),
		value : fact.substring(eq + 1, fact.length)
	};

	return hiFact;
};

var encodeFact = function(hiFact) {
	return encodeFactKey(hiFact) + encodeFactTimestampedValue(hiFact);
};

var encodeFactKey = function(hiFact) {
	return hiFact.owner + "-" + hiFact.item + "-" + hiFact.property;
};

var encodeFactTimestampedValue = function(hiFact) {
	return "@" + hiFact.timestamp + "=" + hiFact.value;
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
			log("updated", key);
			updateModelWithHiFact(oldHiFact);
		}
	} else {
		// add new entry owner-item-property
		localStorage[key] = encodeFactTimestampedValue(hiFact);
		log("added", key);
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

var iterateFacts = function(cb) {
	for ( var i = 0; i < localStorage.length; i++) {
		var key = localStorage.key(i);
		if (key.charAt(0) === "-") {
			var fact = key + localStorage[key];
			cb(fact, decodeFact(fact));
		}
	}
};

var sync = function(doneCb) {
	// update model and determine facts to be pushed
	var pushSequence = localStorage.pushSequence || -1;
	var newPushSequence = new Date().getTime();
	var factsToPush = [];
	iterateFacts(function(fact, hiFact) {
		updateModelWithHiFact(hiFact);
		if (hiFact.timestamp >= pushSequence) {
			factsToPush.push(fact);
		}
	});

	// push our facts and pull and handle the server's facts (incl. model
	// update)
	var sync = syncUrl({
		owner : myOwnerId,
		sequence : localStorage.pullSequence || -1
	});
	$.ajax({
		url : sync,
		type : 'POST',
		data : {
			facts : factsToPush
		},
		success : function(response) {
			var newPullSequence = response[0];
			var facts = response[1];
			handleFacts(facts);
			localStorage.pushSequence = newPushSequence;
			localStorage.pullSequence = newPullSequence;
			log("facts pushed", factsToPush);
			log("facts pulled", facts);
			doneCb();
		}
	});
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

var log = function() {
	if (window.console) {
		console.log(arguments);
	} else {
		alert($.map(arguments, JSON.stringify).join(", "));
	}
};

$().ready(function() {
	sync(function() {
		listItems();
	});
});
