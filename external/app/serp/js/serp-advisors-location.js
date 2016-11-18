$(function() {
	var $con = $("#location-find-advisor-container");
	var $itemsContainer = $con.find("#results-container");
	var templateString = $("#advisor-template").text();

	var doRandomization = true;

	// this will globally hold the randomized results
	// as items are rendered they are popped off the top of this array and eventually it will be empty
	var randomizedResults;

	var resultsPerPage = 10;

	// whether to apply "lazy-loading" to the consultant images
	var doLazyLoading = false;

	// use css transitions to make the cards fade in, in sequential order
	var effects = false;

	//var url = $con.data('searchAction') || 'data/winnipeg.json';
	var url = '/external/app/serp/data/cwpsearch_winnipeg.json';
	var query = $con.data('query') || '';
	var splitquery = query.split(",");

	var loadingTimeout = window.setTimeout(function() {
		// retrieve the results based on the data attribs
		renderLoading();
	}, 0);

	$con.on('showLoading', function() {
		$(this).addClass('loading');
	}).on('hideLoading', function() {
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

	if (query) {
		var splitQuery = {
			'c': splitquery[0],
			'p': splitquery[1]
		};

		$.getJSON(url, splitQuery)
			.done(initRendering)
			.fail(function() {
				window.alert('Data could not be retrieved, please try again');
			})
	}

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

	function initRendering(response) {

		window.clearTimeout(loadingTimeout);

		$con.trigger('hideLoading');

		if (doRandomization) {
			randomizedResults = shuffle(response.slice(0));
		} else {
			randomizedResults = response.results;
		}

		renderCards();
	}

	function transformResultData(origItem) {
		var transformed = {
			url: origItem.url
		};
		for (var key in origItem) {
			if (origItem.hasOwnProperty(key)) {
				//console.log(key + "origItem -> ", origItem[key]);
				if (key == 'associate') {
					if (!transformed['associates']) {
						transformed['associates'] = [];
					}
					if (element.value) {
						var associateArray = element.value.split('|');
						var associate = {
							name: associateArray[0],
							phone: associateArray[1],
							email: associateArray[2]
						};
						transformed['associates'].push(associate);
					}
				} else if (['Address', 'Ct_City', 'State'].indexOf(key) > -1) {
					// if the data is either address, city or province, process to see if they have multiple locations
					if (!transformed['locations']) {
						transformed['locations'] = [];
					}
					var splitItem = origItem[key].split('|');
					splitItem.forEach(function(item, index) {
						var itemData = transformed['locations'][index] || {};
						itemData[key] = item;
						transformed['locations'][index] = itemData;
					});
				} else {
					transformed[key] = origItem[key];
				}	
			}
		}

		return transformed;
	}

	function renderCards() {

		var $template = $(templateString);
		//console.log('randomizedResults ', randomizedResults);
		for (var key in randomizedResults) {
			if (randomizedResults.hasOwnProperty(key)) {
				//console.log(key + " -> ", randomizedResults[key].myInfo);
				
				// convert the source json into the format the cards are expecting
				var transformed = transformResultData(randomizedResults[key].myInfo);
				
				// populate the card template with the converted values
				var $card = populateCardTemplate(transformed, $template.clone());
				
				// use this to enable the cool effects
				if (effects) {
					$card.addClass('hide');
				}
		
				// insert into the target container
				$card.appendTo($itemsContainer);
		
				if (doLazyLoading) {
					// activate unveil on the new images
					$card.find('.advisor-photo img').unveil();
				}
		
				if (effects) {
					window.setTimeout(function() {
						$card.removeClass('hide');
					}, index * 100);
				}	
			}
		}

		if (randomizedResults.length) {
			$more.show();
		}
	}

	function populateCardTemplate(card, $template) {
		//console.log('card ', card);
		var $img = $template.find('.advisor-photo img');
		//$img.addClass(card.gender.toLowerCase());

		var csltPhotoSrc = card.photoUrl;
		if (doLazyLoading) {
			$img.attr({
					'data-src': csltPhotoSrc
				});
		} else {
			$img.attr({'src': csltPhotoSrc});
		}
		var $nameAddress = $template.find('.name-address');
		$nameAddress
			.find('.name a')
			.attr('href', card.ConsultantUrl)
			.html(card.FName + ' ' + card.LName)
			.end()
			.find('.title')
			.html(card.title);

		var $address = $template.find('.name-address address').detach();

		card.locations.forEach(function(location, index) {
			var $thisAddress = $address.clone();
			$thisAddress
				.find('.location')
				.html(location.Ct_City + ', ' + location.State);
			$thisAddress.appendTo($nameAddress);
		});
		
		var $contactInfo = $template.find('.contact').detach();
		//console.log('contact info: ', $contactInfo);
		var $thiscontactInfo = $contactInfo.clone();
		
		$thiscontactInfo
			.find('.street')
			.html(location.Address)
			.find('.phone')
			.attr('href', 'tel:' + stripExtension(card.Phone))
			.html(card.Phone)
			.find('.email')
			.attr({
				'href': 'mailto:' + card.Email,
				'title': card.Email
			});
		console.log('this contact info: ', $thiscontactInfo);
		$('.button.dropdown').after($thiscontactInfo);
		
		$template.find('.websiteLink a')
			.attr('href', card.ConsultantUrl);
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
});

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

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
