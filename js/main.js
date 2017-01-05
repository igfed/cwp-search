// GLOBALS 
var modelUrl = 'https://search.investorsgroup.com:9000/api/cwpsearch?';
var $field = $('#FindAnAdvisor');
var allConsultants = {};
var lang = 'en';
if(window.location.href.indexOf('-fr.') > -1) {
    lang = 'fr';
}

// Process the local prefetched data
var suggestions = {};
	suggestions.locations = new Bloodhound({
		datumTokenizer: Bloodhound.tokenizers.whitespace,
		queryTokenizer: Bloodhound.tokenizers.whitespace,
		prefetch: 'data/cities.json'
	});
	suggestions.consultants = new Bloodhound({
		// datumTokenizer: Bloodhound.tokenizers.obj.whitespace("name"),
		datumTokenizer: Bloodhound.tokenizers.whitespace,
		queryTokenizer: Bloodhound.tokenizers.whitespace,
		prefetch: 'data/names.json'
	});
	suggestions.postalCode = new Bloodhound({
		datumTokenizer: Bloodhound.tokenizers.whitespace,
		queryTokenizer: Bloodhound.tokenizers.whitespace,
		prefetch: 'data/postal-code.json'
	});

// Get current location
function getCoordinates() {
	if (!navigator.geolocation){
		return;
	}
	function success(position) {
		var params = {};
		params.lang = lang;
		params.searchtype = 'con';
		params.geo = position.coords.latitude +','+ position.coords.longitude;

		getSearchResults(params);
	}
	function error() {
		console.log('Error with geolocation');
	}
	navigator.geolocation.getCurrentPosition(success, error);
}

// Get the results
function getSearchResults(params) {
	$('#results-container, #office-search').addClass('hide').html('');
	$.getJSON(modelUrl, params)
	.always()
	.done(function( data ) {
		var result = JSON.parse(data);
		allConsultants = shuffle(result);
		displaySearchResults('result-amount-template', allConsultants, 'results-container');
		paginateResults();
		$('html, body').animate({scrollTop: $('#office-search').offset().top}, 750);
	})
	.fail(function( result ) {
		console.log('Data could not be retrieved, please try again', result.status + ' ' + result.statusText);
	});

	if (params.city || params.Pcode || params.geo) {
		params.searchtype = 'office';
		params.name = '';

		$.getJSON(modelUrl, params)
		.always()
		.done(function( data ) {
			var result = JSON.parse(data);
			if (result.length > 0) {
				displaySearchResults('office-template', result, 'office-search');
			}
		})
		.fail(function( result ) {
			console.log('Data could not be retrieved, please try again', result.status + ' ' + result.statusText);
		});
	}
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

function paginateResults() {
	var result = allConsultants.slice(0, 5);
	allConsultants.splice(0,5);
	displaySearchResults('consultant-template', result, 'results-container');
	if (allConsultants.length > 0) {
		displaySearchResults('view-more-template', [], 'results-container');
	}
}
function parseSearchString() {
	var result = {};
	var search = $field.val();
	var postalCodeFormat = new RegExp(/[A-Za-z][0-9][A-Za-z] ?[0-9][A-Za-z][0-9]/);

	result.city = '';
	result.name = '';
	result.Pcode = '';
	result.geo = '';

	// Search in the language of the page
	result.lang = lang;
	// We only search consultants from this method
	result.searchtype = 'con';
	// Check if there is a postal code
	if (postalCodeFormat.test(search)) {
		var postalCode = search.match(postalCodeFormat)[0];
		if (postalCode.indexOf(' ') === -1) {
			postalCode = postalCode.match(/.{1,3}/g).join().replace(',', ' ');
		}
		result.Pcode = postalCode;
		search = search.replace(postalCodeFormat, ' ');
	}

	// Check the search string for a previously defined location
	var words = search.split(' ');
	for (i = 0; i < words.length; i++) {
		// Check each word for a city from the predefined list
		var normalizedTerm = words[i].toLowerCase();
		var city = suggestions.locations.get(normalizedTerm);
		if (city.length > 0) {
			result.city = city[0];
			words.splice(i, 1);
		}
	}

	// All remaining words should be a name
	if  (words.length > 0) {
		result.name = words.join(' ');
	}

	return result;
}

function displaySearchResults( templateID, json, destination ) {
	var template = document.getElementById(templateID).innerHTML;
	Mustache.parse(template);
	var rendered = Mustache.render(template, json);
	$('#'+destination).removeClass('hide').append(rendered);
	attachComponents();
}

function attachComponents(){
	$(document).foundation();
	$('[data-fetch-results]').on('click',function(e){
		e.preventDefault();
		$(this).remove();
		paginateResults();
	});
}
function sendGoogleAnalytics(params) {
	if (params.name !== '') {
		ga('send','event','Convert','Search','ConnectToAdvisor_Name?' + params.name, 0);
	} else if (params.city !== '') {
		ga('send','event','Convert','Search','ConnectToAdvisor_Location?' + params.city, 0);
	} else if (params.Pcode !== '') {
		ga('send','event','Convert','Search','ConnectToAdvisor_Pcode?' + params.Pcode, 0);
	}
}

//Init everything
$(function() {
	
	// Try to predetermine what results should show
	getCoordinates();

	// Setup the typeahead
	$('.typeahead').typeahead({
		highlight: true
	},
		{ name: 'locations', source: suggestions.locations, limit: 2 },
		{ name: 'consultants', source: suggestions.consultants, limit: 3 },
		{ name: 'postalCode', source: suggestions.postalCode, limit: 2 }
	)

	// Setup the form submission
	$('#find-an-advisor-search').submit(function(e){
		e.preventDefault();
		var params = parseSearchString();
		getSearchResults(params);
		//ga('send','event','Convert','Search','ConnectToAdvisor_Location?Toronto, ON', 0);
		sendGoogleAnalytics(params)
	});
});

//Lowercase text
// $(function textTransformLowercase(){
//      $('.search-ui').text(function (_, val) {
// 	    return val.toLowerCase();
// 	    $('.search-ui').addClass('capitalize');
//     });
// }());


