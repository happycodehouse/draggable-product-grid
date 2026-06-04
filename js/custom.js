import {preloadImages} from './utils.js'

gsap.registerPlugin(Draggable, Flip, SplitText);

const Custom = {};

const $dom = document.querySelector('#productContainer'),
    $grid = document.querySelector('#grid'),
    $products = [...document.querySelectorAll('.product div')],
    $details = document.querySelector('#productDetails'),
    $detailsThumb = $details.querySelector('.details_thumb'),
    $detailsBtn = $details.querySelector('button'),
    $cross = document.querySelector('#cross');

let draggable, observer, $currentProduct, $originalParent;
let isDragging = false;
let isAnimating = false;
let SHOW_DETAILS = false;

Custom.utils = {
    init: function () {
        this.intro();
    },
    intro: function () {
        this.centerGrid();

        const timeline = gsap.timeline();

        timeline.set($dom, {scale: .5});

        timeline.set($products, {
            scale: 0.5,
            opacity: 0,
            transition: 'unset'
        });

        timeline.to($products, {
            scale: 1,
            opacity: 1,
            duration: 0.6,
            ease: 'power3.out',
            stagger: {
                amount: 1.2,
                from: 'random'
            }
        });

        timeline.to($dom, {
            scale: 1,
            duration: 1.2,
            ease: 'power3.inOut',
            onComplete: () => {
                this.setupDraggable();
                this.addEvents();
                this.observeProducts();
                this.handleDetails();
                this.zoom();
            }
        });
    },
    centerGrid: function () {
        const gridWidth = $grid.offsetWidth;
        const gridHeight = $grid.offsetHeight;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        const centerX = (windowWidth - gridWidth) / 2;
        const centerY = (windowHeight - gridHeight) / 2;

        gsap.set($grid, {
            x: centerX,
            y: centerY
        });
    },
    setupDraggable: function () {
        $dom.classList.add('--is-loaded');

        draggable = Draggable.create($grid, {
            type: 'x,y',
            bounds: {
                minX: -($grid.offsetWidth - window.innerWidth) - 200,
                maxX: 200,
                minY: -($grid.offsetHeight - window.innerHeight) - 100,
                maxY: 100
            },
            inertia: true,
            allowEventDefault: true,
            edgeResistance: 0.9,

            onDragStart: () => {
                isDragging = true;
                $grid.classList.add('--is-dragging');
            },

            onDragEnd: () => {
                isDragging = false;
                $grid.classList.remove('--is-dragging');
            }
        })[0];
    },
    addEvents: function () {
        window.addEventListener('wheel', (e) => {
            e.preventDefault();

            const deltaX = -e.deltaX * 7;
            const deltaY = -e.deltaY * 7;

            const currentX = gsap.getProperty($grid, 'x');
            const currentY = gsap.getProperty($grid, 'y');

            const newX = currentX + deltaX;
            const newY = currentY + deltaY;

            const bounds = draggable.vars.bounds;
            const clampedX = Math.max(bounds.minX, Math.min(bounds.maxX, newX));
            const clampedY = Math.max(bounds.minY, Math.min(bounds.maxY, newY));

            gsap.to($grid, {
                x: clampedX,
                y: clampedY,
                duration: 0.3,
                ease: 'power3.out'
            });
        }, {passive: false});

        window.addEventListener('resize', () => {
            this.updateBounds();
        });

        window.addEventListener('mousemove', (e) => {
            if (SHOW_DETAILS) {
                this.handleCursor(e);
            }
        });
    },
    updateBounds: function () {
        if (draggable) {
            draggable.vars.bounds = {
                minX: -($grid.offsetWidth - window.innerWidth) - 50,
                maxX: 50,
                minY: -($grid.offsetHeight - window.innerHeight) - 50,
                maxY: 50
            };
        }
    },
    observeProducts: function () {
        observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.target === $currentProduct) return;

                if (entry.isIntersecting) {
                    gsap.to(entry.target, {
                        scale: 1,
                        opacity: 1,
                        duration: 0.5,
                        ease: 'power2.out'
                    });
                } else {
                    gsap.to(entry.target, {
                        scale: 0.5,
                        opacity: 0,
                        duration: 0.5,
                        ease: 'power2.in'
                    });
                }
            });
        }, {
            root: null,
            threshold: 0.1
        });

        $products.forEach(product => {
            observer.observe(product);
        });
    },
    handleDetails: function () {
        SHOW_DETAILS = false;

        const $headerTexts = $details.querySelectorAll(".details_header .data-wrap *");
        const $bodyTexts = $details.querySelectorAll(".details_body .data-wrap *");

        gsap.set($detailsBtn, {
            opacity: 0
        });

        const splitHeaderTexts = new SplitText($headerTexts, {
            type: 'lines, chars',
            mask: 'lines',
            charsClass: 'char'
        });

        const splitBodyTexts = new SplitText($bodyTexts, {
            type: 'lines',
            mask: 'lines',
            linesClass: 'line'
        });

        const splitButton = new SplitText($detailsBtn, {
            type: 'lines',
            mask: 'lines',
            linesClass: 'line'
        });

        $products.forEach(product => {
            product.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!isAnimating) this.showDetails(product);
            });
        });

        $dom.addEventListener('click', () => {
            if (SHOW_DETAILS && !isAnimating) this.hideDetails();
        });
    },
    showDetails: function (product) {
        if (SHOW_DETAILS || isAnimating) return;

        SHOW_DETAILS = true;
        isAnimating = true;

        // delay(0.4) + duration(1.2) = 1.6
        gsap.delayedCall(1.6, () => {
            isAnimating = false;
        });

        $details.classList.add('--is-showing');
        $dom.classList.add('--is-details-showing');

        gsap.to($dom, {
            x: '-33vw',
            duration: 1.2,
            ease: 'power3.inOut',
        });

        gsap.to($details, {
            x: 0,
            duration: 1.2,
            ease: 'power3.inOut',
        });

        this.flipProduct(product);

        const productId = product.dataset.id;
        const match = productId.match(/^([a-zA-Z]+)(?:-(\d+))?$/);
        const category = match[1];
        const scent = match[2] || category;

        const $currentHeaderElements = [
            $details.querySelector(`[data-category='${category}']`),
            $details.querySelector(`[data-scent='${scent}']`),
            $details.querySelector(`[data-note='${scent}']`),
            $details.querySelector(`[data-ml='${category}']`)
        ].filter(el => el !== null);

        const $currentBodyElements = [
            $details.querySelector(`[data-desc='${productId}']`),
            $details.querySelector(`[data-price='${category}']`)
        ].filter(el => el !== null);

        $currentHeaderElements.forEach(element => {
            gsap.to(element.querySelectorAll('.char'), {
                y: 0,
                duration: 1.1,
                delay: .4,
                ease: 'power3.inOut',
                stagger: 0.025
            });
        });

        $currentBodyElements.forEach(element => {
            gsap.to(element.querySelectorAll('.line'), {
                y: 0,
                duration: 1.1,
                delay: .4,
                ease: 'power3.inOut',
                stagger: .05
            });
        });

        gsap.to($detailsBtn, {
            opacity: 1,
            duration: 1.2,
            delay: .4,
            ease: 'power3.inOut'
        });

        const $buttonLines = $detailsBtn.querySelectorAll('.line');

        if ($buttonLines.length > 0) {
            gsap.to($buttonLines, {
                y: 0,
                duration: 1.2,
                delay: .4,
                ease: 'power3.inOut',
                stagger: .05
            });
        }
    },
    hideDetails: function () {
        if (!SHOW_DETAILS || isAnimating) return;

        SHOW_DETAILS = false;
        isAnimating = true;

        // delay(0.3) + duration(1.2) = 1.5
        gsap.delayedCall(1.5, () => {
            isAnimating = false;
        });

        $dom.classList.remove('--is-details-showing');

        gsap.to($dom, {
            x: 0,
            duration: 1.2,
            delay: .3,
            ease: 'power3.inOut',
            onComplete: () => {
                $details.classList.remove('--is-showing');
            }
        });

        gsap.to($details, {
            x: '33vw',
            duration: 1.2,
            delay: .3,
            ease: 'power3.inOut'
        });

        this.unFlipProduct();

        const $allChars = $details.querySelectorAll('.char');

        gsap.to($allChars, {
            y: '100%',
            duration: 0.6,
            ease: 'power3.inOut',
            stagger: {
                amount: 0.025,
                from: 'end'
            }
        });

        const $allLines = $details.querySelectorAll('.line');

        gsap.to($allLines, {
            y: '100%',
            duration: 0.6,
            ease: 'power3.inOut',
        });

        gsap.to($detailsBtn, {
            opacity: 0,
            duration: 0.6,
            ease: 'power3.inOut'
        });
    },
    flipProduct: function (product) {
        $currentProduct = product;
        $originalParent = product.parentNode;

        if (observer) {
            observer.unobserve(product);
        }

        const state = Flip.getState(product);

        $detailsThumb.appendChild(product);

        Flip.from(state, {
            absolute: true,
            duration: 1.2,
            ease: 'power3.inOut',
        });

        gsap.to($cross, {
            scale: 1,
            duration: 0.4,
            delay: .5,
            ease: 'power2.out'
        });
    },
    unFlipProduct: function () {
        if (!$currentProduct || !$originalParent) return;

        gsap.to($cross, {
            scale: 0,
            duration: 0.4,
            ease: 'power2.out'
        });

        const finalRect = $originalParent.getBoundingClientRect();
        const currentRect = $currentProduct.getBoundingClientRect();

        gsap.set($currentProduct, {
            position: 'absolute',
            top: currentRect.top - $detailsThumb.getBoundingClientRect().top + 'px',
            left: currentRect.left - $detailsThumb.getBoundingClientRect().left + 'px',
            width: currentRect.width + 'px',
            height: currentRect.height + 'px',
            zIndex: 10000
        });

        gsap.to($currentProduct, {
            top: finalRect.top - $detailsThumb.getBoundingClientRect().top + 'px',
            left: finalRect.left - $detailsThumb.getBoundingClientRect().left + 'px',
            width: finalRect.width + 'px',
            height: finalRect.height + 'px',
            duration: 1.2,
            delay: .3,
            ease: 'power3.inOut',
            onStart: () => {
                gsap.set($products, {
                    transition: 'unset'
                });

                gsap.set($currentProduct, {
                    transition: 'transform 300ms ease-in-out'
                });
            },
            onComplete: () => {
                $originalParent.appendChild($currentProduct);

                gsap.set($currentProduct, {
                    position: '',
                    top: '',
                    left: '',
                    width: '',
                    height: '',
                    zIndex: '',
                    transition: ''
                });

                if (observer) {
                    observer.observe($currentProduct);
                }

                $currentProduct = null;
                $originalParent = null;
            },
        });
    },
    handleCursor: function (e) {
        const x = e.clientX;
        const y = e.clientY;

        gsap.to($cross, {
            x: x - $cross.offsetWidth / 2,
            y: y - $cross.offsetHeight / 2,
            duration: 0.4,
            ease: 'power2.out'
        });
    },
    zoom: function () {
        const $zoomBtn = document.querySelector('#zoom');
        let zoomScale = 1;

        $zoomBtn.addEventListener('click', () => {
            const isZoomedIn = $zoomBtn.dataset.state === 'in';

            $zoomBtn.dataset.state = isZoomedIn ? 'out' : 'in';
            zoomScale = isZoomedIn ? 0.5 : 1;

            $zoomBtn.textContent = isZoomedIn ? 'Zoom In' : 'Zoom Out';

            gsap.to($grid, {
                scale: zoomScale,
                duration: 0.8,
                ease: 'power3.inOut',
            });

            this.updateBounds();
        });
    }
}

preloadImages('#grid img').then(() => {
    Custom.utils.init();
    document.body.classList.remove('loading');
});