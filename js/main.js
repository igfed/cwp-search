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

var consultants = new Bloodhound({
  datumTokenizer: Bloodhound.tokenizers.whitespace,
  queryTokenizer: Bloodhound.tokenizers.whitespace,
  prefetch: '../external/app/tribal/data/cities-en.json'
});


$(function() {
	// Find current location
	var pos = getCoordinates();
	
	$('.typeahead').typeahead({
		hint: true,
		minLength: 3
	},
	{
		name: 'consultants',
		source: consultants
	});

});