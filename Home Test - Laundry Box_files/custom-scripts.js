/*
 * Custom Scripts — Laundry Box Home
 * Loaded with defer. Mobile-focused enhancements only — no dependencies
 * apart from jQuery + slick (already loaded by the page bundle).
 *
 *  1. Ensure a correct viewport meta tag (some WP plugins inject competing ones).
 *  2. Close the mobile burger menu after a nav link tap.
 *  3. Sync hero slick slider responsive image visibility on resize/orientation.
 *  4. Track download-button clicks via dataLayer (if GTM is loaded).
 *  5. Rehydrate the hero slick slider — the saved-page HTML already has
 *     slick-initialized classes baked in, so the page bundle's init helper
 *     skips initialization. We strip the leftover slick DOM and re-init.
 *  6. Rehydrate the pricing Swiper (.mySwiperPricing) — the page bundle
 *     defers Swiper init until a user input event, which feels broken.
 *     We init it on DOMContentLoaded if window.Swiper is available.
 */
(function () {
    'use strict';

    var LOG_TAG = '[laundrybox]';
    if (window.console && console.log) {
        console.log(LOG_TAG, 'custom-scripts loaded');
    }

    // -- 1. Viewport meta safety ------------------------------------------------
    function ensureViewport() {
        var meta = document.querySelector('meta[name="viewport"]');
        var content = 'width=device-width, initial-scale=1, viewport-fit=cover';
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('name', 'viewport');
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
    }

    // -- 2. Close burger menu after tapping a link ------------------------------
    function bindMobileMenuClose() {
        var dropdown = document.querySelector('.elementor-nav-menu--dropdown');
        var toggle = document.querySelector('.elementor-menu-toggle');

        // Clear saved-page inline width on the dropdown (was 1860px → mobile overflow)
        if (dropdown) dropdown.style.width = '';

        if (!dropdown || !toggle) return;

        dropdown.addEventListener('click', function (evt) {
            var link = evt.target.closest('a.elementor-item, a.elementor-sub-item');
            if (!link) return;
            // Submenu parent triggers — let them open their submenu instead of closing.
            if (link.classList.contains('has-submenu')) return;
            if (toggle.getAttribute('aria-expanded') === 'true') {
                toggle.click();
            }
        });
    }

    // -- 3. Hero responsive image swap ------------------------------------------
    function syncHeroResponsiveImages() {
        var isMobile = window.matchMedia('(max-width: 820px)').matches;
        document.querySelectorAll('.HeroSlider .fPic').forEach(function (img) {
            img.style.display = isMobile ? 'none' : '';
        });
        document.querySelectorAll('.HeroSlider .SPic').forEach(function (img) {
            img.style.display = isMobile ? 'block' : '';
        });
    }

    // -- 4. Track download-button clicks via dataLayer --------------------------
    function bindDownloadButtonTracking() {
        document.querySelectorAll('.appCtaBtn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                if (window.dataLayer && typeof window.dataLayer.push === 'function') {
                    window.dataLayer.push({
                        event: 'download_app_click',
                        location: 'in_page_banner'
                    });
                }
            });
        });
    }

    // -- 5. Rehydrate the slick sliders -----------------------------------------
    // Arrow markup: prev = left-pointing chevron, next = right-pointing chevron.
    // Slick wires these to its prevArrow / nextArrow options below, so the
    // visual direction now matches the navigation direction.
    var HERO_PREV_SVG = '<button type="button" class="btn slick-prev custom-prev" aria-label="Previous Slide"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg></button>';
    var HERO_NEXT_SVG = '<button type="button" class="btn slick-next custom-next" aria-label="Next Slide"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg></button>';

    var HERO_SLICK_OPTS = {
        dots: false,
        infinite: true,
        arrows: true,
        speed: 700,
        fade: false,
        cssEase: 'cubic-bezier(0.45, 0, 0.15, 1)',
        slidesToShow: 1,
        pauseOnHover: false,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 5000,
        nextArrow: HERO_NEXT_SVG,
        prevArrow: HERO_PREV_SVG
    };

    var OFFER_SLICK_OPTS = {
        infinite: true,
        arrows: false,
        speed: 300,
        dots: true,
        autoplay: true,
        autoplaySpeed: 2000,
        slidesToShow: 1,
        slidesToScroll: 1,
        responsive: [{
            breakpoint: 1024,
            settings: { slidesToShow: 1, slidesToScroll: 1, infinite: true, dots: false }
        }]
    };

    /**
     * Lift slick-track children back to the container, strip slick chrome
     * (arrows, list/track wrappers) and slick-* classes. Idempotent.
     * Returns true if the container was hydrated and needs re-init, false if
     * it's already clean (or there's nothing to do).
     */
    function unwrapSlickContainer(container) {
        if (!container) return false;
        if (!container.classList.contains('slick-initialized')) return false;

        var track = container.querySelector('.slick-track');
        if (!track) {
            container.classList.remove('slick-initialized', 'slick-slider', 'slick-horizontal', 'slick-vertical', 'slick-dotted');
            return true;
        }

        var slideClasses = [
            'slick-slide', 'slick-active', 'slick-current',
            'slick-cloned', 'slick-visible', 'slick-center'
        ];
        Array.prototype.slice.call(track.children).forEach(function (slide) {
            if (slide.classList.contains('slick-cloned')) {
                slide.parentNode.removeChild(slide);
                return;
            }
            slideClasses.forEach(function (c) { slide.classList.remove(c); });
            slide.removeAttribute('style');
            slide.removeAttribute('data-slick-index');
            slide.removeAttribute('aria-hidden');
            slide.removeAttribute('tabindex');
            slide.removeAttribute('role');
            slide.removeAttribute('aria-describedby');
            container.appendChild(slide);
        });

        Array.prototype.forEach.call(container.querySelectorAll('.slick-arrow'), function (el) {
            el.parentNode.removeChild(el);
        });
        var list = container.querySelector('.slick-list');
        if (list && list.parentNode) list.parentNode.removeChild(list);
        var dots = container.parentNode && container.parentNode.querySelector('.slick-dots');
        if (dots && dots.parentNode) dots.parentNode.removeChild(dots);

        container.classList.remove(
            'slick-initialized', 'slick-slider',
            'slick-horizontal', 'slick-vertical', 'slick-dotted'
        );
        return true;
    }

    var slickInstances = [];

    function rehydrateSlick(selector, opts, label) {
        var container = document.querySelector(selector);
        if (!container) return;
        if (!window.jQuery || !window.jQuery.fn || !window.jQuery.fn.slick) return;

        // Idempotent: bootSliders() runs on DOMContentLoaded AND again
        // on window.load. If we already initialized THIS slider with
        // real Slick, do nothing — re-running unwrap on a live Slick
        // instance shreds its DOM and blanks the slider.
        if (container.getAttribute('data-rehydrated') === '1') return;

        var $existing = window.jQuery(container);
        // If a real Slick instance is attached, tear it down cleanly
        // via Slick's own API before we strip/rebuild the markup.
        try {
            if ($existing.hasClass('slick-initialized') &&
                $existing.slick && $existing.slick('getSlick')) {
                $existing.slick('unslick');
            }
        } catch (e) { /* not a live instance — fall through to manual unwrap */ }

        if (!unwrapSlickContainer(container)) return;

        if (window.console) console.log(LOG_TAG, 'rehydrating ' + label + ' slick…');
        try {
            var $c = window.jQuery(container);
            $c.slick(opts);
            // Force slick to recompute slide widths against the current viewport
            // (saved-page slides had fixed inline widths that confuse the first pass).
            try { $c.slick('setPosition'); } catch (e1) {}
            setTimeout(function () {
                try { $c.slick('setPosition'); } catch (e2) {}
            }, 250);
            if (opts.autoplay) {
                try { $c.slick('slickPlay'); } catch (e3) { /* older slick — autoplay already on */ }
            }
            slickInstances.push($c);
            container.setAttribute('data-rehydrated', '1');
            if (window.console) console.log(LOG_TAG, label + ' slick re-inited, autoplay started');
        } catch (e) {
            if (window.console) console.error(LOG_TAG, label + ' slick re-init failed:', e && e.stack || e);
        }
    }

    /**
     * Hero stationary card.
     * The card (heading + paragraph + the two app-store buttons) sits
     * still while the background images slide. We build ONE clean card
     * as an overlay on the slider, read each slide's heading/paragraph
     * into a list, and swap just that text when the slide changes.
     * The per-slide markup is hidden via CSS so only the images move.
     */
    function setupHeroFixedCard() {
        var section = document.querySelector('.HeroNewSection');
        var slider = document.querySelector('.HeroSlider');
        if (!section || !slider || !window.jQuery) return;

        var $slider = window.jQuery(slider);

        // Per-slide text, in slick-index order (skip slick clones).
        var texts = [];
        Array.prototype.forEach.call(
            slider.querySelectorAll('.slick-slide:not(.slick-cloned) .heroInner'),
            function (inner) {
                var h1 = inner.querySelector('h1');
                var p = inner.querySelector('p');
                texts.push({
                    h1: h1 ? h1.innerHTML : '',
                    p: p ? p.innerHTML : ''
                });
            }
        );
        if (!texts.length) return; // slick not ready yet — caller retries

        // Remove any previously-built card so a re-init can't duplicate
        // it, and so the card never gets absorbed by a Slick re-wrap.
        var old = section.querySelector('.heroCard');
        if (old && old.parentNode) old.parentNode.removeChild(old);

        // Build a clean card: heading, paragraph, two app buttons only
        // (no "Check Pricing"). Built from scratch — no legacy markup.
        // Appended to the SECTION (a Slider sibling) so Slick — which
        // only manages .HeroSlider's children — can never wrap it.
        var card = document.createElement('div');
        card.className = 'heroCard';
        card.innerHTML =
            '<div class="heroCardBox">' +
                '<h1 class="heroCardTitle"></h1>' +
                '<p class="heroCardText"></p>' +
                '<div class="heroCardBtns">' +
                    '<a class="heroCardBtn" href="https://apps.apple.com/ae/app/laundrybox-dubai/id1274441896" target="_blank" rel="noopener" aria-label="Download on the App Store">' +
                        '<img src="./Home Test - Laundry Box_files/google-play.webp" alt="Download on the App Store" width="180" height="54" decoding="async">' +
                    '</a>' +
                    '<a class="heroCardBtn" href="https://play.google.com/store/apps/details?id=net.mybox.android" target="_blank" rel="noopener" aria-label="Get it on Google Play">' +
                        '<img src="./Home Test - Laundry Box_files/app-store.webp" alt="Get it on Google Play" width="180" height="54" decoding="async">' +
                    '</a>' +
                '</div>' +
            '</div>';
        section.appendChild(card);

        var elTitle = card.querySelector('.heroCardTitle');
        var elText = card.querySelector('.heroCardText');
        var elBox = card.querySelector('.heroCardBox');

        function applyText(i) {
            var t = texts[((i % texts.length) + texts.length) % texts.length];
            if (!t) return;
            if (elTitle) elTitle.innerHTML = t.h1;
            if (elText) elText.innerHTML = t.p;
        }

        var startIndex = 0;
        try { startIndex = $slider.slick('slickCurrentSlide') || 0; } catch (e) {}
        applyText(startIndex);

        var swapTimer = null;
        $slider.off('beforeChange.heroCard').on('beforeChange.heroCard', function (e, slick, currentSlide, nextSlide) {
            if (!elBox) return;
            if (swapTimer) clearTimeout(swapTimer);
            // 1. Fade the text out.
            elBox.classList.add('isSwapping');
            swapTimer = setTimeout(function () {
                // 2. While fully hidden, swap the text.
                applyText(nextSlide);
                // 3. Next frame, fade the new text back in (removing
                //    the class in a separate frame lets the browser
                //    paint the swapped text at opacity 0 first, so it
                //    fades in instead of flashing).
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        elBox.classList.remove('isSwapping');
                    });
                });
            }, 220);
        });

        slider.classList.add('heroFixedCardActive');
    }

    function rehydrateHeroSlider() {
        rehydrateSlick('.HeroSlider', HERO_SLICK_OPTS, 'hero');
        // Build the card once Slick has produced .slick-slide nodes.
        // Synchronous attempt first; retry briefly if not ready yet.
        setupHeroFixedCard();
        var tries = 0;
        var poll = setInterval(function () {
            tries += 1;
            var section = document.querySelector('.HeroNewSection');
            if ((section && section.querySelector('.heroCard')) || tries > 20) {
                clearInterval(poll);
                return;
            }
            setupHeroFixedCard();
        }, 150);
    }

    function rehydrateLaundryOfferSlider() {
        rehydrateSlick('.LaundryOfferSlider', OFFER_SLICK_OPTS, 'laundry-offer');
    }

    function refreshSlickPositions() {
        slickInstances.forEach(function ($c) {
            try { $c.slick('setPosition'); } catch (e) {}
        });
    }

    function whenSlickReady(callback) {
        if (window.jQuery && window.jQuery.fn && window.jQuery.fn.slick) {
            callback();
            return;
        }
        var tries = 0;
        var poll = setInterval(function () {
            tries += 1;
            if (window.jQuery && window.jQuery.fn && window.jQuery.fn.slick) {
                clearInterval(poll);
                callback();
            } else if (tries > 50) {
                clearInterval(poll);
                if (window.console) console.warn(LOG_TAG, 'slick never registered on $.fn — skipping rehydrate');
            }
        }, 100);
    }

    // -- 6. Rehydrate the pricing Swiper ----------------------------------------
    function rehydratePricingSwiper() {
        var container = document.querySelector('.mySwiperPricing');
        if (!container || !window.Swiper) return;
        if (container.swiper) return; // already an active Swiper instance

        // Strip leftover saved-page inline styles so Swiper computes fresh ones
        var wrapper = container.querySelector('.swiper-wrapper');
        if (wrapper) wrapper.removeAttribute('style');
        Array.prototype.forEach.call(
            container.querySelectorAll('.swiper-slide'),
            function (slide) { slide.removeAttribute('style'); }
        );
        // Drop visible card shadows captured from previous render — Swiper recreates them
        Array.prototype.forEach.call(
            container.querySelectorAll('.swiper-slide-shadow-cards, .swiper-slide-shadow'),
            function (sh) { sh.parentNode && sh.parentNode.removeChild(sh); }
        );

        try {
            new window.Swiper(container, {
                effect: 'cards',
                grabCursor: true,
                centeredSlides: true,
                loop: false,
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev'
                }
            });
        } catch (e) {
            if (window.console) console.error('Pricing Swiper init failed:', e);
        }
    }

    function whenSwiperReady(callback) {
        if (window.Swiper) { callback(); return; }
        var tries = 0;
        var poll = setInterval(function () {
            tries += 1;
            if (window.Swiper) { clearInterval(poll); callback(); }
            else if (tries > 50) { clearInterval(poll); }
        }, 100);
    }

    // -- Boot --------------------------------------------------------------------
    function ready(fn) {
        if (document.readyState !== 'loading') {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }

    ensureViewport();

    ready(function () {
        bindMobileMenuClose();
        syncHeroResponsiveImages();
        bindDownloadButtonTracking();
    });

    // Slick + Swiper rehydration needs to run after the page bundles register
    // their libraries. Both are deferred, so we poll briefly until each global
    // is available. Retry once after window.load as a safety net.
    function bootSliders() {
        whenSlickReady(function () {
            rehydrateHeroSlider();
            rehydrateLaundryOfferSlider();
        });
        whenSwiperReady(function () { rehydratePricingSwiper(); });
    }
    ready(bootSliders);
    if (document.readyState !== 'complete') {
        window.addEventListener('load', bootSliders, { once: true });
    }

    var resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            syncHeroResponsiveImages();
            refreshSlickPositions();
        }, 150);
    });
    window.addEventListener('orientationchange', function () {
        syncHeroResponsiveImages();
        refreshSlickPositions();
    });
})();
