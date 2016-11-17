$(document).ready(function(){
	$('a.languageToggle').click(function(event){
		event.preventDefault();
		$url = location.pathname;
		$pageID = $('meta[name=id]').attr('content');
		if($pageID == '3'){
			$pageID = 'default';
		}
		$lang = 'en';
		$findinURL = $url.indexOf("/fr/");
		if($findinURL === -1){
			$lang = 'fr';
		}
		window.location = "/" + $lang + "/" + $pageID + ".aspx";
	});
});
 