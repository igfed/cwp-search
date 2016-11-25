var modelUrl = 'http://54.160.16.202:9000/api/cwpsearch?';
var query = {
		lang: 'en',
		searchtype: 'con',
		city: '',
		name: ''
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
	var result = {
		hasResults: false,
		lat: 0,
		long: 0
	};
	function success(position) {
		result = {
			hasResults: true,
			lat: position.coords.latitude,
			long: position.coords.longitude
		}
	}
	function error() {
		console.alert('Error with geolocation')
	}
	navigator.geolocation.getCurrentPosition(success, error);
	return result;
}

// Get the results
function getSearchResults(e) {
	e.preventDefault();
	query.name = $('#FindAnAdvisor').val();
	$.getJSON(modelUrl, query)
	.always()
	.done(function( data ) {
		var result = JSON.parse(data);
		displaySearchResults(result);
	})
	.fail(function( result ) {
		console.log('Data could not be retrieved, please try again', result.status + ' ' + result.statusText);
	});
}

function displaySearchResults( json ) {
	var template = document.getElementById('template').innerHTML;
	Mustache.parse(template);
	var rendered = Mustache.render(template, json);
	$('.office-search, .filter').removeClass('hide');
	$('#results-container').removeClass('hide').html(rendered);
}




//Init everything
$(function() {
	$('.typeahead').typeahead({
		highlight: true
	},
		{ name: 'locations', source: suggestions.locations, limit: 3, templates: {header: "Suggested Search"} },
		{ name: 'consultants', source: suggestions.consultants, limit: 3 },
		{ name: 'postalCode', source: suggestions.postalCode, limit: 3 }
	)
	.bind('typeahead:select', function(ev, suggestion) {
		console.log('Selection: ' + suggestion, ev);
	})
	.bind('typeahead:change', function(ev, suggestion) {
		console.log('Selection: ' + suggestion, ev);
		query = {
			lang: 'en',
			searchtype: 'con',
			city: 'Winnipeg'
		}
	});
	$('#siteSearch').submit(function(e){
		getSearchResults(e);
	});
});