// GLOBALS
var modelUrl = 'http://54.160.16.202:9000/api/cwpsearch?';
var $field = $('#FindAnAdvisor');

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
		params.lang = 'en';
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
		displaySearchResults('consultant-template', result, 'results-container');
	})
	.fail(function( result ) {
		console.log('Data could not be retrieved, please try again', result.status + ' ' + result.statusText);
	});

	if (params.city || params.Pcode) {
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

function parseSearchString() {
	var result = {};
	var search = $field.val();
	var postalCodeFormat = new RegExp(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/);

	result.city = '';
	result.name = '';
	result.Pcode = '';
	result.geo = '';

	// Search in english
	result.lang = 'en';
	// We only search consultants from this method
	result.searchtype = 'con';
	// Check if there is a postal code
	if (postalCodeFormat.test(search)) {
		result.Pcode = search.match(postalCodeFormat)[0];
		search = search.replace(postalCodeFormat, ' ');
	}

	// Check the search string for a previously defined location
	var words = search.split(' ');
	for (i = 0; i < words.length; i++) {
		// Check each word for a city from the predefined list
		var city = suggestions.locations.get(words[i]);
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
	$('#'+destination).removeClass('hide').html(rendered);
	attachComponents();
}

function attachComponents(){
	$(document).foundation();
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
	$('#siteSearch').submit(function(e){
		e.preventDefault();
		var params = parseSearchString();
		getSearchResults(params);
	});
});
