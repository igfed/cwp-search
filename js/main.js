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


// Process the data
var consultants = new Bloodhound({
  // datumTokenizer: Bloodhound.tokenizers.obj.whitespace("name"),
  datumTokenizer: Bloodhound.tokenizers.whitespace,
  queryTokenizer: Bloodhound.tokenizers.whitespace,
  prefetch: '../external/app/tribal/data/names.json'
});
var locations = new Bloodhound({
  datumTokenizer: Bloodhound.tokenizers.whitespace,
  queryTokenizer: Bloodhound.tokenizers.whitespace,
  prefetch: '../external/app/tribal/data/cities.json'
});
var postalCode = new Bloodhound({
  datumTokenizer: Bloodhound.tokenizers.whitespace,
  queryTokenizer: Bloodhound.tokenizers.whitespace,
  prefetch: '../external/app/tribal/data/postal-code.json'
});

$(function() {
	$('.typeahead').typeahead({ highlight: true },
		{ name: 'consultants', source: consultants },
		{ name: 'locations', source: locations },
		{ name: 'postalCode', source: postalCode}
	);
});