var modelUrl = 'http://54.160.16.202:9000/api/cwpsearch?';
var $field = $('#FindAnAdvisor');
var query = {
		lang: 'en',
		searchtype: 'con',
		city: '',
		name: '',
		Pcode: '',
		geo: ''
	}
// Process the local prefetched data
var suggestions = {};
	suggestions.locations = new Bloodhound({
		datumTokenizer: Bloodhound.tokenizers.whitespace,
		queryTokenizer: Bloodhound.tokenizers.whitespace,
		prefetch: '../external/app/tribal/data/cities.json'
	});
	suggestions.consultants = new Bloodhound({
		// datumTokenizer: Bloodhound.tokenizers.obj.whitespace("name"),
		datumTokenizer: Bloodhound.tokenizers.whitespace,
		queryTokenizer: Bloodhound.tokenizers.whitespace,
		prefetch: '../external/app/tribal/data/names.json'
	});
	suggestions.postalCode = new Bloodhound({
		datumTokenizer: Bloodhound.tokenizers.whitespace,
		queryTokenizer: Bloodhound.tokenizers.whitespace,
		prefetch: '../external/app/tribal/data/postal-code.json'
	});

// Get current location
function getCoordinates() {
	if (!navigator.geolocation){
		// output.innerHTML = "<p>Geolocation is not supported by your browser</p>";
		return;
	}
	function success(position) {
		var params = query;
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
	$.getJSON(modelUrl, params)
	.always()
	.done(function( data ) {
		var result = JSON.parse(data);
		displaySearchResults(result);
	})
	.fail(function( result ) {
		console.log('Data could not be retrieved, please try again', result.status + ' ' + result.statusText);
	});
}

function parseSearchString() {
	var result = query;
	var search = $field.val();
	result.geo = '';
	var postalCodeFormat = new RegExp(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/);

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

function displaySearchResults( json ) {
	var template = document.getElementById('template').innerHTML;
	Mustache.parse(template);
	var rendered = Mustache.render(template, json);
	$('.filter').removeClass('hide'); // .office-search, to be added after office module worked on.
	$('#results-container').removeClass('hide').html(rendered);
}




//Init everything
$(function() {
	// Try to predetermine what results should show
	getCoordinates();

	// Setup the typeahead
	$('.typeahead').typeahead({
		highlight: true
	},
		{ name: 'locations', source: suggestions.locations, limit: 3, templates: {header: "Suggested Search"} },
		{ name: 'consultants', source: suggestions.consultants, limit: 3 },
		{ name: 'postalCode', source: suggestions.postalCode, limit: 3 }
	)

	// Setup the form submission
	$('#siteSearch').submit(function(e){
		e.preventDefault();
		var params = parseSearchString();

		getSearchResults(params);
	});
});
