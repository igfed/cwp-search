$(function() {
	var $con = $("#location-find-advisor-container");
	var $itemsContainer = $con.find("#results-container");
	var templateString = $("#advisor-template").text();

	// this will globally hold the randomized results
	// as items are rendered they are popped off the top of this array and eventually it will be empty
	var randomizedResults;

	var resultsPerPage = 10;

	var url = $con.data('searchAction') || 'data/winnipeg.json';
	var query = $con.data('query') || '';
	var splitquery = query.split(",");

	$con.on('showLoading', function() {
		$(this).addClass('loading');
	}).on('hideLoading', function() {
		window.console.log('hiding loading');
		$(this).removeClass('loading');
		$itemsContainer.find('.advisor-card.placeholder').remove();
	});

	var $more = $con.find('.more-container');
	$more.on('click', '.more-button', function(event) {
		event.stopPropagation();
		event.preventDefault();

		$more.hide();

		renderCards();
	});

	// retrieve the results based on the data attribs
	renderLoading();

	function renderLoading() {
		$con.trigger('showLoading');
		for (var i = 0; i < 3; i++) {
			var $template = $(templateString);
			var randomGender = getRandomInt(0, 1) == 0 ? 'm' : 'f';
			$template.clone()
				.appendTo($itemsContainer)
				.find('.team').remove().end()
				.addClass('placeholder')
				.find('.advisor-photo img').addClass(randomGender);
		}

	}

	window.console.log(query);
	if (query) {
		$.getJSON(url, {
			'c': splitquery[0],
			'p': splitquery[1]
		})
			.done(ajaxSuccess)
			.fail(function() {
				window.alert('Data could not be retrieved, please try again');
			})
	}

	function parseResult(unparsedItem) {
		var parsed = {
			url: unparsedItem.url
		};
		unparsedItem.meta_tags.forEach(function(element) {
			if (element.name == 'associate') {
				if (!parsed['associates']) {
					parsed['associates'] = [];
				}
				if (element.value) {
					var associateArray = element.value.split('|');
					var associate = {
						name: associateArray[0],
						phone: associateArray[1],
						email: associateArray[2]
					};
					parsed['associates'].push(associate);
				}
			} else {
				parsed[element.name] = element.value;
			}
		});
		return parsed;
	}

	function ajaxSuccess(response) {

		$con.trigger('hideLoading');
		var results = response.results;
		randomizedResults = shuffle(results.slice(0));

		renderCards();


		//parsedResults = [];
		//
		//for (var i = 0; i < random.length; i++) {
		//	var item = random[i];
		//	var details = {
		//		url: item.url
		//	};
		//	item.meta_tags.forEach(function(element) {
		//		if (element.name == 'associate') {
		//			if (!details['associates']) {
		//				details['associates'] = [];
		//			}
		//			if (element.value) {
		//				var associateArray = element.value.split('|');
		//				var associate = {
		//					name: associateArray[0],
		//					phone: associateArray[1],
		//					email: associateArray[2]
		//				};
		//				details['associates'].push(associate);
		//			}
		//		} else {
		//			details[element.name] = element.value;
		//		}
		//	});
		//	parsedResults.push(details);
		//}
		//
		//function nextSetOfResults(parsedResults) {
		//	//console.log("parsedResults before splice " + parsedResults.length);
		//	var slicedResults = parsedResults.splice(0, 10);
		//	//console.log("parsedResults after splice " + parsedResults.length);
		//	if (parsedResults.length > 0) {
		//		$moreButton.show();
		//		$(".location-find-advisor-container").append("<a href=\"#\" class=\"nextresultset_anchor\"><%stf_morecards%><br /><div id=\"triangledown\"></div></a>");
		//	}
		//	return slicedResults;
		//}
		//
		//parsethedata(parsedResults);

		//var debounced = $.noop;
		//var tester = $('#orange');
		//var win = $(window);

		//var viewport = {
		//    top : win.scrollTop(),
		//};
		//viewport.bottom = $(document).height() - $(window).height() - $(window).scrollTop();
		//console.log('bottom ' + viewport.bottom);
		//$('<h1 id="st" style="position: fixed; right: 25px; bottom: 25px;"></h1>').insertAfter('body');
		//$(window).scroll(function () {
		//      var st = $(window).scrollTop();
		//      var scrollBottom = $(document).height() - $(window).height() - $(window).scrollTop();
		//      $('#st').replaceWith('<h1 id="st" style="position: fixed; right: 25px; bottom: 25px;">scrollTop: ' + st + '<br>scrollBottom: ' + scrollBottom + '</h1>');
		//});
		//var check = function(){

		//var visible = tester.isOnScreen(0.1, 0.1);
		//console.log(visible);
		//if(visible){
		//    tester.fadeTo(500, 1);
		//    $(window).off('scroll', debounced);
		//}
		//}
		//debounced = check.debounce(50);
		//$(window).on('scroll', debounced);

		//function parsethedata(parsedResults) {
		//	nextSetOfResults(parsedResults).forEach(function(item) {
		//		//console.log("nextSefofResults");
		//		var $thisTemplate = $(templateString);
		//		var $img = $thisTemplate.find('.advisor-photo img')
		//			.attr({
		//				'data-src': 'http://www.investorsgroup.com/' + item.photo,
		//				src: item.gender == 'M' ? maleSilhouette : femaleSilhouette
		//			});
		//		$thisTemplate.find('.advisor-details .name-address')
		//			.find('.name a')
		//			.attr('href', item.url)
		//			.html(item.name)
		//			.end()
		//			.find('.title')
		//			.html(item.title)
		//			.end()
		//			.find('address .street')
		//			.html(item.address).end()
		//			.find('address .location')
		//			.html(item.city + ', ' + item.province);
		//		$thisTemplate.find('.advisor-details .contact')
		//			.find('.phone')
		//			.attr('href', 'tel:' + stripExtension(item.phoneNumber))
		//			.html(item.phoneNumber)
		//			.end()
		//			.find('.email')
		//			.attr({
		//				'href': 'mailto:' + item.email,
		//				'title': item.email
		//			});
		//		$thisTemplate.find('.advisor-details .websiteLink a')
		//			.attr('href', item.url);
		//		var $team = $thisTemplate.find('.team');
		//		if (!item.associates || !item.associates.length) {
		//			$team.remove();
		//		} else {
		//			$team.find('.title').attr('href', item.teamURL);
		//			var $teamList = $team.find('.team-list');
		//			var $teamItem = $teamList.find('li').detach();
		//			item.associates.forEach(function(associate) {
		//				var $teamMember = $teamItem.clone();
		//				$teamMember.find('.name a').html(associate.name).attr('href', item.teamURL);
		//				$teamMember.find('.phone')
		//					.html(associate.phone)
		//					.attr('href', 'tel:' + stripExtension(associate.phone));
		//				$teamMember.find('.email')
		//					.html(associate.email)
		//					.attr('href', 'mailto:' + associate.email);
		//				$teamMember.appendTo($teamList);
		//			})
		//		}
		//		$thisTemplate.appendTo($itemsContainer);
		//	});
		//
		//	$itemsContainer.find('.advisor-photo img').unveil();
		//}
	}

	function renderCards() {

		var $template = $(templateString);
		// the splice function alters the cardSet array, which updates
		randomizedResults.splice(0, resultsPerPage).forEach(function(item, index) {

			// convert the source json into the format the cards are expecting
			var parsed = parseResult(item);

			// populate the card template with the converted values
			var $card = populateCardTemplate(parsed, $template.clone());
			$card.addClass('hide');

			// insert into the target container
			$card.appendTo($itemsContainer);

			// activate unveil on the new images
			$card.find('.advisor-photo img').unveil();

			window.setTimeout(function() {
				$card.removeClass('hide');
			}, index * 100);

		});

		if (randomizedResults.length) {
			$more.show();
		}
	}

	function populateCardTemplate(card, $template) {

		var $img = $template.find('.advisor-photo img')
			.addClass(card.gender.toLowerCase())
			.attr({
				'data-src': 'http://www.investorsgroup.com/' + card.photo
			});
		$template.find('.advisor-details .name-address')
			.find('.name a')
			.attr('href', card.url)
			.html(card.name)
			.end()
			.find('.title')
			.html(card.title)
			.end()
			.find('address .street')
			.html(card.address)
			.end()
			.find('address .location')
			.html(card.city + ', ' + card.province);
		$template.find('.advisor-details .contact')
			.find('.phone')
			.attr('href', 'tel:' + stripExtension(card.phoneNumber))
			.html(card.phoneNumber)
			.end()
			.find('.email')
			.attr({
				'href': 'mailto:' + card.email,
				'title': card.email
			});
		$template.find('.advisor-details .websiteLink a')
			.attr('href', card.url);
		var $team = $template.find('.team');
		if (!card.associates || !card.associates.length) {
			$team.remove();
		} else {
			$team.find('.title').attr('href', card.teamURL);
			var $teamList = $team.find('.team-list');
			var $teamItem = $teamList.find('li').detach();
			card.associates.forEach(function(associate) {
				var $teamMember = $teamItem.clone();
				$teamMember.find('.name a').html(associate.name).attr('href', card.teamURL);
				$teamMember.find('.phone')
					.html(associate.phone)
					.attr('href', 'tel:' + stripExtension(associate.phone));
				$teamMember.find('.email')
					.html(associate.email)
					.attr('href', 'mailto:' + associate.email);
				$teamMember.appendTo($teamList);
			})
		}

		return $template;

		function stripExtension(phonenumber) {
			var myRe = /[^\s]+/;
			return myRe.exec(phonenumber);
		}
	}


	// Production steps of ECMA-262, Edition 5, 15.4.4.18
	// Reference: http://es5.github.io/#x15.4.4.18
	if (!Array.prototype.forEach) {
		Array.prototype.forEach = function(callback, thisArg) {
			var T, k;
			if (this == null) {
				throw new TypeError(' this is null or not defined');
			}
			// 1. Let O be the result of calling ToObject passing the |this| value as the argument.
			var O = Object(this);
			// 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
			// 3. Let len be ToUint32(lenValue).
			var len = O.length >>> 0;
			// 4. If IsCallable(callback) is false, throw a TypeError exception.
			// See: http://es5.github.com/#x9.11
			if (typeof callback !== "function") {
				throw new TypeError(callback + ' is not a function');
			}
			// 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
			if (arguments.length > 1) {
				T = thisArg;
			}
			// 6. Let k be 0
			k = 0;
			// 7. Repeat, while k < len
			while (k < len) {
				var kValue;
				// a. Let Pk be ToString(k).
				//   This is implicit for LHS operands of the in operator
				// b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
				//   This step can be combined with c
				// c. If kPresent is true, then
				if (k in O) {
					// i. Let kValue be the result of calling the Get internal method of O with argument Pk.
					kValue = O[k];
					// ii. Call the Call internal method of callback with T as the this value and
					// argument list containing kValue, k, and O.
					callback.call(T, kValue, k, O);
				}
				// d. Increase k by 1.
				k++;
			}
			// 8. return undefined
		};
	}
	function shuffle(array) {
		var currentIndex = array.length, temporaryValue, randomIndex;
		// While there remain elements to shuffle...
		while (0 !== currentIndex) {
			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;
			// And swap it with the current element.
			temporaryValue = array[currentIndex];
			array[currentIndex] = array[randomIndex];
			array[randomIndex] = temporaryValue;
		}
		return array;
	}

	Function.prototype.debounce = function(threshold) {
		var callback = this;
		var timeout;
		return function() {
			var context = this, params = arguments;
			window.clearTimeout(timeout);
			timeout = window.setTimeout(function() {
				callback.apply(context, params);
			}, threshold);
		};
	};
	$.fn.isOnScreen = function(x, y) {

		if (x == null || typeof x == 'undefined') x = 1;
		if (y == null || typeof y == 'undefined') y = 1;

		var win = $(window);

		var viewport = {
			top: win.scrollTop(),
			left: win.scrollLeft()
		};
		viewport.right = viewport.left + win.width();
		viewport.bottom = viewport.top + win.height();

		var height = this.outerHeight();
		var width = this.outerWidth();

		if (!width || !height) {
			return false;
		}

		var bounds = this.offset();
		bounds.right = bounds.left + width;
		bounds.bottom = bounds.top + height;

		var visible = (!(viewport.right < bounds.left || viewport.left > bounds.right || viewport.bottom < bounds.top || viewport.top > bounds.bottom));

		if (!visible) {
			return false;
		}

		var deltas = {
			top: Math.min(1, ( bounds.bottom - viewport.top ) / height),
			bottom: Math.min(1, ( viewport.bottom - bounds.top ) / height),
			left: Math.min(1, ( bounds.right - viewport.left ) / width),
			right: Math.min(1, ( viewport.right - bounds.left ) / width)
		};

		return (deltas.left * deltas.right) >= x && (deltas.top * deltas.bottom) >= y;

	};

	function getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
});
