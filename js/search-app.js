(function ($) {
    'use strict';

    $.fn.infoToggle = function() {
        this.each(function() {
            var $reveal = $(this),
                $revealContent = $reveal.find('.info-toggle-content'),
                $revealTrigger = $reveal.find('.info-toggle-trigger'),
                fixedHeight = false,
                setAria = $reveal.attr('info-toggle-aria') === 'true';

            init();

            function init() {
                $revealTrigger.on('click', handleRevealToggle);
                $(window).on('resize', resizeHandler);

                setRevealContentHeight();
            }

            //-----

            function handleRevealToggle() {
                setRevealContentHeight();
                $reveal.toggleClass('active');
                window.setTimeout(setRevealContentHeight);
                if ($reveal.hasClass('active')) {
                    scrollToTarget();
                }
            }

            function resizeHandler() {
                if (fixedHeight) {
                    $revealContent.css({height: 'auto'});
                }
            }

            function scrollToTarget() {
                $('html, body').animate({scrollTop: $reveal.offset().top}, 500);
            }

            function setRevealContentHeight() {
                var finalHeight;

                if ($reveal.hasClass('active')) {
                    finalHeight = $revealContent[0].scrollHeight;
                    fixedHeight = true;
                } else {
                    finalHeight = 0;
                    fixedHeight = false;
                }
                $revealContent.css({height: finalHeight});

                if (setAria) {
                    $revealContent.attr('aria-hidden', !fixedHeight);
                }
            }
        });

        return this;
    };

}(jQuery));





(function() {
    'use strict';

    var gui,
        map,
        video,
        overlay;

    init();

    function init() {

        gui = new GuiModule(overlay);
        map = new MapModule();

    }

    //-----

   

    function GuiModule(overlayReference) {


        init();

        function init() {
            $(document).foundation();

            $('.info-toggle-small, .info-toggle').infoToggle();

   
        }

      
    }

    function MapModule() {
        var mapDeferred,
            maps = [],
            geocoder,
            directionLinkClass = '.outline-btn',
            mapLinkBase = 'https://www.google.ca/maps?q=',
            directionLinkBase = 'https://www.google.ca/maps/dir//';

        init();

        function init() {
            window.handleMapInit = handleMapInit;
            mapDeferred = jQuery.Deferred();
            initMaps();
        }

        //-----

        function geocodeAddress(address, map) {
            geocoder.geocode({'address': address}, function(results, status) {
                if (status === 'OK') {
                    setAddressOnMap(results[0].geometry.location, map);
                } else {
                    if (window.console) {
                        window.console.warn('no match found for entry\'s address: must provide the following attributes');
                        window.console.warn('on the .map-icon element instead, with manually determined values:');
                        window.console.warn('data-lat, data-lng');
                    }
                }
            });
        }

        function handleMapInit() {
            if (mapDeferred) mapDeferred.resolve();
        }

        function initMaps() {
            mapDeferred.then(function() {
                geocoder = new google.maps.Geocoder();

                $('.map-container').each(function() {
                    var mapContainer = $(this),
                        parentContainer = $(mapContainer.parents('.row').get(0)),
                        mapAnchor = parentContainer.find('a:not(' + directionLinkClass + ')'),
                        directionAnchor = parentContainer.find(directionLinkClass),
                        icon = mapContainer.find('.map-icon'),
                        targetLocation = {
                            lat: parseFloat(icon.attr('data-lat')),
                            lng: parseFloat(icon.attr('data-lng'))
                        },
                        targetAddress = parentContainer.find('h3').html(),
                        targetString,
                        zoom = icon.attr('data-zoom') ? parseInt(icon.attr('data-zoom')) : 15,
                        map = new google.maps.Map(icon.get(0), {
                            zoom: zoom,
                            mapTypeId: 'roadmap',
                            disableDefaultUI: true,
                            draggable: false,
                            scrollwheel: false,
                            panControl: false,
                            maxZoom: zoom,
                            minZoom: zoom
                        });

                    if (targetLocation.lat && targetLocation.lng) {
                        targetString = targetLocation.lat + ',' + targetLocation.lng;
                        setAddressOnMap(targetLocation, map);
                    } else {
                        targetString = targetAddress;
                        geocodeAddress(targetAddress, map);
                    }
                    mapAnchor.attr('href', mapLinkBase + targetString);
                    directionAnchor.attr('href', directionLinkBase + targetString);

                    maps.push(map);
                });
            });
        }

        function setAddressOnMap(location, map) {
            map.setCenter(location);

            $(window).on('resize', function() {
                map.setCenter(location);
            });
        }
    }

   

})();
