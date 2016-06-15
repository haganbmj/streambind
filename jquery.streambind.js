/**
 * Brendan Hagan 6/10/2016
 * Version: 0.0.1
 */

var streamBind = (function ($) {
	var config = {
		twitch_username: 'trihex',
		data_file: 'data/streamcontrol.json?callback=?',
		modifiers_file: 'data/streamcontrol_modifiers.json?callback=?'
	};

	var api = {
		twitch_api: 'https://api.twitch.tv/kraken/streams/'
	};

	var storedData = {
		modifiers: {},
		data: {
			_twitch: {},
			_streamcontrol: {}
		}
	};

	var debug = {
		doAnimation_triggers: 0,
		streamControl_polls: 0,
		twitch_api_polls: 0,
		failed_fetches: 0
	};


	$(document).ready(function () {
		initializeAnimations();

		$.when(jsonFetch(config.modifiers_file, bindTextModifiers))
			.then(poll(function () {
				jsonFetch(config.data_file, bindStreamControlResponse);
			}, 3000));

		/*poll(function () {
		 if ($("*[streamData='stream.viewers']").length > 0) {
		 jsonFetch(api.twitch_api + config.twitch_username, bindTwitchApiResponse);
		 }
		 }, 5000);*/
	});

	function jsonFetch(requestUrl, callback) {
		var request = new Request(
			requestUrl, {
				method: 'get',
				mode: 'cors'
			}
		);

		var fr = fetch(request)
			.then(function (response) {
				return response.json();
			})
			.then(function (result) {
				callback(result);
			})
			.catch(function (err) {
				++debug.failed_fetches;
				console.log(err);
			});

		return fr;
	}

	function poll(fn, interval) {
		interval = interval || 5000;

		$.when(fn())
			.then(
				function () {
					window.setTimeout(
						function () {
							poll(fn, interval);
						},
						interval
					);
				});
	}

	function storeJsonObject(obj, json) {
		if (json != null) {
			$.extend(obj, json);
			delete obj.undefined;
		}
	}

	function bindTextModifiers(json) {
		storeJsonObject(storedData.modifiers, json);
	}

	function bindStreamControlResponse(json) {
		++debug.streamControl_polls;
		if (json != null && json.timestamp != storedData.data.timestamp) {
			updateContent(storedData.data._streamcontrol, json);
		}
	}

	function bindTwitchApiResponse(json) {
		++debug.twitch_api_polls;
		if (!json.hasOwnProperty('stream')) {
			json.stream = {};
			json.stream.viewers = "Offline";
		} else {
			json.stream.viewers += " viewers";
		}

		delete json._links;

		updateContent(storedData.data._twitch, json);
	}

	function bindDomValue(key, value) {
		$('html').attr(key, value);
		$("*[streamData='" + key + "']").attr("streamValue", value);
	}

	function textModification(key, textValue) {
		if (storedData.modifiers[key] != null) {
			return storedData.modifiers[key].replace("{{replace}}", textValue);
		}
		return textValue;
	}

	function updateContent(oldJson = {}, newJson, prefix = "") {
		for (var key in newJson) {
			if (typeof newJson[key] == 'object') {
				updateContent(oldJson[key], newJson[key], prefix + key + ".");
			} else if (oldJson[key] == undefined || oldJson[key] != newJson[key]) {
				var evt = oldJson[key] == undefined ? "onLoad" : "onChange";

				doAnimation(
					key,
					"*[streamData='" + prefix + key + "']",
					textModification(key, newJson[key]),
					evt);

				bindDomValue(prefix + key, newJson[key]);
			}
		}

		if (prefix == "") {
			storeJsonObject(oldJson, newJson);
		}
	}


	function initializeAnimations() {
		var def = $.Deferred();
		def.done(bindAnimations)
			.done(function () {
				doAnimation(
					null,
					"*:not([streamData])",
					null,
					'onLoad');
			});
		def.resolve();
	}

	function animationHandler(targets, type, anim) {
		for (var i = 0; i < targets.length; i++) {
			$(targets[i]).unbind(type);
			$(targets[i]).bind(type, anim);
		}
	}

	function doAnimation(key, targets, newData, evt) {
		if (newData != undefined && $(targets).length > 0) {
			// only trigger a textModification if there's something to insert it into... duh.
			newData = textModification(key, newData);
		}
		$(targets).each(function () {
			++debug.doAnimation_triggers;
			if (
				$._data(this, "events") != undefined
				&& evt != undefined
				&& $.inArray(evt, $._data(this, "events"))
			) {
				$(this).trigger(evt, [newData]);
			}
		});
	}


	return {
		help: function () {
			return this;
		},
		anim: function (targets, type, animation) {
			animationHandler(targets, type, animation);
			return this;
		},
		print: function () {
			return storedData.data;
		},
		debug: function () {
			additionalDebugging = {
				lastTimestamp: storedData.data._streamcontrol.timestamp,
				textModifiers: storedData.modifiers,
				streamControlData: storedData.data._streamcontrol,
				twitchApiData: storedData.data._twitch
			};
			return $.extend({}, config, debug, additionalDebugging);
		}
	}
})(jQuery);


// Helper Functions
$.fn.fixFontSize = function () {
	if ($(this).is("[noFontFix]")) {
		return;
	}

	if (($(this).attr("desiredFontSize")) == undefined) {
		$(this).attr("desiredFontSize", $(this).css("font-size"));
	}

	$(this).css("font-size", $(this).attr("desiredFontSize"));

	while ($(this).hasOverflown()) {
		var currentFontSize = parseInt($(this).css("font-size"));
		var currentFontUnit = $(this).css("font-size").replace(currentFontSize, "").trim();

		$(this).css("font-size", (currentFontSize - 1) + currentFontUnit);
	}
};

$.fn.hasOverflown = function () {
	var res;
	var cont = $('<div>' + this.text() + '</div>')
		.css("display", "table")
		.css("z-index", "-1").css("position", "absolute")
		.css("font-family", this.css("font-family"))
		.css("font-size", this.css("font-size"))
		.css("font-weight", this.css("font-weight"))
		.appendTo('body');
	res = (cont.width() > this.width());
	cont.remove();
	return res;
};

$.fn.setVal = function (newData) {
	if ($(this).is("[streamData]")) {
		$(this).html(newData.toString()).fixFontSize();
	}
	return this;
};