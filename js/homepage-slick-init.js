$(function() {
    $('.responsive').slick({
        prevArrow: '<a type="button" data-role="none" Title="Previous" class="rotatingNavPrev"></a>',
        nextArrow: '<a type="button" data-role="none" Title="Next" class="rotatingNavNext"></a>',
        dots: false,
        infinite: true,
        speed: 300,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 6000,
        responsive: [{
            breakpoint: 1024,
            settings: {
                slidesToShow: 1,
                slidesToScroll: 1,
                infinite: true,
                dots: false
            }
        }, {
            breakpoint: 640,
            settings: {
                slidesToShow: 1,
                slidesToScroll: 1,
                infinite: true,
                dots: false
            }
        }, {
            breakpoint: 639,
            settings: {
                slidesToShow: 1,
                slidesToScroll: 1,
                infinite: true,
                dots: false
            }
        }]
    });
    $('.slick_video').slick({
        //prevArrow: '<a type="button" data-role="none" Title="Previous" class="videoNavPrev"></a>',
        //nextArrow: '<a type="button" data-role="none" Title="Next" class="videoNavNext"></a>',
        dots: false,
        //infinite: true,
        //speed: 300,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
        fade: true,
        asNavFor: '.slick_video_text'
    });

    $('.slick_video_text').slick({
        dots: true,
        //infinite: true,
        //speed: 300,
        slidesToShow: 3,
        slidesToScroll: 1,
        arrows: false,
        asNavFor: '.slick_video',
        centerMode: true,
        focusOnSelect: true
    });
});