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

(function ($) {
    'use strict';

    $.fn.blockLink = function() {
        this.each(function() {
            var $blockLink = $(this),
                destination = $blockLink.find('a').attr('href');

            init();

            function init() {
                $blockLink.on('click', handleClick);
            }

            //-----

            function handleClick() {
                location = destination;
            }
        });

        return this;
    };

}(jQuery));

(function ($) {
    'use strict';

    $.fn.chooseDayOfWeek = function() {
        this.each(function() {
            var $container = $(this);

            init();

            function init() {
                var dow = new Date().getDay();

                $container.find('.day-' + dow).addClass('current-day');
            }
        });

        return this;
    };

}(jQuery));

(function ($) {

    $.fn.popupPlaceholder = function() {
        this.each(function() {
            var $input = $(this),
                $label = $input.parent('label');

            init();

            function init() {
                $input.on('change keyup focus blur mousedown', assessInputState);
                assessInputState();
            }

            //-----

            function assessInputState() {
                if ($input.is(':focus') || $input.val() !== '') {
                    $label.addClass('is-editing');
                } else {
                    $label.removeClass('is-editing');
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
        overlay = new OverlayModule();
        gui = new GuiModule(overlay);
        map = new MapModule();
        video = new VideoModule();
    }

    //-----

    function FormValidationModule(form, overlayReference) {
        var validationScript = '//cdnjs.cloudflare.com/ajax/libs/jquery-validate/1.15.0/jquery.validate.min.js',
            additionalScript = '//cdnjs.cloudflare.com/ajax/libs/jquery-validate/1.15.0/additional-methods.min.js',
            overlay = overlayReference;

        init();

        function init() {
            $.getScript(validationScript)
                .then(function() {
                    $.getScript(additionalScript);
                })
                .then(function() {
                    form.validate();
                });

            form.on('submit', handleSubmit);

            form.find('.outline-btn').on('click', function(event) {
                form.submit();
                return false;
            });
        }

        //-----

        function handleSubmit() {
            if (form.valid && form.valid()) {
                form.removeClass('server-error');
                form.addClass('submitting');

                //perform submission action
                //return true;
                //and on return:

                overlay.openOverlay('forms/success.html');
                return false;
            } else {
                return false;
            }
        }
    }

    function GuiModule(overlayReference) {
        var personnelLinkSelector = '.personnel a.underline-link[href^="#bio-"], .personnel a.outline-btn[href^="#bio-"]',
            $personnelLinks = $(personnelLinkSelector),
            $personnelDetails = $('.personnel .details, .personnel .block-link'),
            $personnelOverlayMarkup = $('.personnel .details, .personnel .block-link'),
            personnelDetailsOverlayClass = 'personnel-bio-overlay personnel',
            $personnelDetailsMarkup,
            personnelDetailsCarouselInited = false,
            overlay = overlayReference,
            formLocations = {
                event: '#event-modal',
                subscribe: '#subscribe-modal',
                appointment: '#appointment-modal',
                apply: '#apply-modal'
            };

        init();

        function init() {
            $(document).foundation();
            $('.block-link').blockLink();
            $('.day-of-week').chooseDayOfWeek();
            $('.info-toggle-small, .info-toggle').infoToggle();
            initSlider($('.js-homepage-carousel'));
            $(window).on('hashchange', handleOverlay);
            handleOverlay();
        }

        //-----

        function getPersonnelOverlayMarkup() {
            var $rendered,
                $container;

            if (!$personnelDetailsMarkup) {
                $personnelDetailsMarkup = $('<div></div>');
                $personnelDetailsMarkup.addClass(personnelDetailsOverlayClass);
                $personnelDetails.each(function(i) {
                    $rendered = $('<div></div>');
                    $container = $('<div></div>');
                    $rendered.addClass('carousel-slides');
                    $rendered.attr('personnel-token', $($personnelLinks[i]).attr('href'));
                    $container.append($(this).html());
                    $rendered.append($container);
                    $personnelDetailsMarkup.append($rendered);
                });
            }

            return $personnelDetailsMarkup;
        }

        function handleFormOverlayFromHash(event, hashRoot) {
            var fullHashFragment = '#' + hashRoot + '-',
                matchesHash = false;

            if (location.hash.indexOf(fullHashFragment) === 0) {
                overlay.openOverlay(
                    $(formLocations[hashRoot]).clone() /*+ "?id=" + location.hash.replace(fullHashFragment, '')*/,
                    handleFormOverlayOpen, handleOverlayClose, hashRoot !== 'subscribe');
                matchesHash = true;
            }

            return matchesHash;
        }

        function handleOverlay(event) {
            return handleFormOverlayFromHash(event, 'subscribe')
                || handleFormOverlayFromHash(event, 'event')
                || handleFormOverlayFromHash(event, 'appointment')
                || handleFormOverlayFromHash(event, 'apply')
                || handlePersonnelOverlay(event);
        }

        function handleFormOverlayOpen(event) {
            new FormValidationModule($('#modalOverlay form'), overlay);
            $('input[type=text], input[type=password], input[type=tel], input[type=email]')
                .popupPlaceholder();
            $('select, textarea')
                .popupPlaceholder();
        }

        function handlePersonnelOverlay(event) {
            var personnelLink = $personnelLinks.filter('[href="' + location.hash + '"]'),
                isPersonnel = false;

            if (!overlay.isOpen()) {
                if (personnelLink.length > 0) {
                    overlay.openOverlay(getPersonnelOverlayMarkup(),
                        handlePersonnelOverlayOpen, handleOverlayClose, true);
                    isPersonnel = true;
                }
            }

            return isPersonnel;
        }

        function handleOverlayClose(event) {
            var yPos;

            if ("pushState" in history)
                history.pushState("", document.title, location.pathname + location.search);
            else {
                yPos = $(document).scrollTop();
                location.hash = "";
                $(document).scrollTop(yPos);
            }
        }

        function handlePersonnelOverlayOpen(event) {
            var initialIndex = '0',
                newHash;

            if (personnelDetailsCarouselInited) {
                $personnelDetailsMarkup.slick('unslick');
            }
            $personnelDetailsMarkup.on('afterChange', function(event, slick, currentSlide) {
                newHash = $personnelDetailsMarkup
                    .find('[data-slick-index=' + currentSlide + ']')
                    .attr('personnel-token');
                location.hash = newHash;
            });
            initSlider($personnelDetailsMarkup, {
                dots: false,
                slidesToShow: 1,
                slidesToScroll: 1
            });
            personnelDetailsCarouselInited = true;
            initialIndex = $personnelDetailsMarkup
                .find('[href="' + location.hash + '"]')
                .parents('.carousel-slides')
                .attr('data-slick-index') | initialIndex;
            $personnelDetailsMarkup.slick('slickGoTo', initialIndex, true);
        }

        function initSlider(target, options) {
            var defaults = {
                    prevArrow: '<span type="button" class="carousel-prev"><img src="//www.investorsgroup.com/external/app/tribal/images/Arrow-MainArticle-Carousel-Green-L.svg"></span>',
                    nextArrow: '<span type="button" class="carousel-next"><img src="//www.investorsgroup.com/external/app/tribal/images/Arrow-MainArticle-Carousel-Green-R.svg"></span>',
                    speed: 1200,
                    dots: true,
                    slidesToShow: 2,
                    slidesToScroll: 2,
                    infinite: true,
                    responsive: [
                        {
                            breakpoint: 768,
                            settings: {
                                slidesToShow: 1,
                                slidesToScroll: 1,
                                infinite: true
                            }
                        }
                    ]
                };

            target.slick($.extend(defaults, options));
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
                        targetAddress = parentContainer.find('.map-address').html(),
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

    function OverlayModule() {
        var $overlay,
            $body = $('body'),
            overlaySizingDelay,
            currentInstance = {},
            isOpenFlag = false,
            $closeButton;

        init();

        return {
            openOverlay: openOverlay,
            isOpen: isOpen
        }

        function init() {
            $overlay = $('<div></div>');
            $overlay.attr('id', 'modalOverlay');
            $overlay.attr('class', 'reveal');
            $overlay.attr('data-reveal', true);
            $body.append($overlay);
            $overlay.on('open.zf.reveal', handleOverlayOpen);
            $(window).on('closed.zf.reveal', handleOverlayClose);
            $(window).on('resize', window.Foundation.util.throttle(delayedHandleOverlaySizing, 250));
            initCloseButton();
            new Foundation.Reveal($overlay);
        }

        //-----

        function delayedHandleOverlaySizing() {
            if (overlaySizingDelay) {
                window.clearTimeout(overlaySizingDelay);
            }

            window.setTimeout(overlaySizing, 250);
        }

        function handleOverlayClose(event) {
            isOpenFlag = false;
            if (currentInstance.close) {
                currentInstance.close(event);
            }
            overlaySizeCleanup();
            currentInstance = {};
        }

        function handleOverlayOpen(event) {
            isOpenFlag = true;
            $overlay.find('*').foundation();
            if (currentInstance.open) {
                currentInstance.open(event);
            }
            overlaySizing();
        }

        function initCloseButton() {
            var $innerSpan = $('<span></span>');

            $closeButton = $('<button data-close></button>');
            $closeButton.addClass('close-button');
            $closeButton.attr('aria-label', 'Close modal');
            $innerSpan.attr('aria-hidden', true);
            $innerSpan.html('&times;');
            $closeButton.append($innerSpan);
        }

        function isOpen() {
            return isOpenFlag;
        }

        function openOverlay(urlOrMarkup, openCallback, closeCallback, fullScreen) {
            currentInstance.open = openCallback;
            currentInstance.close = closeCallback;
            currentInstance.full = fullScreen;
            if (typeof urlOrMarkup === 'string') {
                openOverlayWithAjax(urlOrMarkup);
            } else {
                openOverlayWithMarkup(urlOrMarkup);
            }
        }

        function openOverlayWithAjax(url) {
            $.ajax(url).done(openOverlayWithMarkup);
        }

        function openOverlayWithMarkup(markup) {
            $overlay.html(markup);
            $overlay.append($closeButton);
            if (currentInstance.full) {
                $overlay.addClass('full');
            }
            $overlay.foundation('open');
        }

        function overlaySizeCleanup() {
            $overlay.removeClass('full');
            $overlay.removeClass('tour');
            $overlay.html('');
        }

        function overlaySizing() {
            var overlayHeight = $overlay.height(),
                windowHeight = $(window).height();

            if (overlayHeight > windowHeight) {
                $overlay.css({
                    top: 0
                });
                $overlay.addClass('full');
            }
        }
    }

    function VideoModule(serviceDependency) {
        var player,
            APIModules,
            videoPlayer,
            experienceModule,
            $resizeWrapper = $('.video-container-responsive'),
            $spinner = $('.video-spinner-container'),
            $placeholder = $('.js-video-play'),
            $playAnchor = $('.js-video-play-btn');

        init();

        function init() {
            window.onTemplateLoad = onTemplateLoad;
            window.onTemplateReady = onTemplateReady;
        }

        //-----

        function handleResize() {
            if (player.getModule(APIModules.EXPERIENCE).experience.type == "html"){
                var resizeWidth = resizeWrapper.innerWidth();
                var resizeHeight = resizeWrapper.innerHeight();
                player.getModule(APIModules.EXPERIENCE).setSize(resizeWidth, resizeHeight)
            }
        }

        function onTemplateLoad(experienceID) {
            player = brightcove.api.getExperience(experienceID);
            APIModules = brightcove.api.modules.APIModules;
        }

        function onTemplateReady(evt) {
            $spinner.hide();
            $placeholder.show();
            $playAnchor.on('click', playVideo)
            $(window).on('resize', handleResize);
            window.brightcove.createExperiences();
        }

        function playVideo(event) {
            event.preventDefault ? event.preventDefault() : (event.returnValue = false);
            $placeholder.hide();
            videoPlayer = player.getModule(APIModules.VIDEO_PLAYER);
            experienceModule = player.getModule(APIModules.EXPERIENCE);
            videoPlayer.play();
        }
    }

})();

$(function textTransformLowercase(){
     $('.consultant_name, .maps h3').text(function (_, val) {
    return val.toLowerCase();
    });
}());  

