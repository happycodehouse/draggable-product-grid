import { preloadImages } from './utils.js'

gsap.registerPlugin(Draggable, Flip, SplitText);

class Grid {
    constructor() {
        this.dom = document.querySelector("#productContainer");
        this.grid = document.querySelector("#grid");
        this.products = [...document.querySelectorAll(".product div")];

        this.details = document.querySelector("#productDetails");
        this.detailsThumb = this.details.querySelector(".details_thumb");

        this.cross = document.querySelector(".cross");

        this.isDragging = false;
    };

    centerGrid() {
        const gridWidth = this.grid.offsetWidth;
        const gridHeight = this.grid.offsetHeight;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        const centerX = (windowWidth - gridWidth) / 2;
        const centerY = (windowHeight - gridHeight) / 2;

        gsap.set(this.grid, {
            x: centerX,
            y: centerY
        });
    };

    setupDraggable() {
        this.dom.classList.add('--is-loaded');

        this.draggable = Draggable.create(this.grid, {
            type: 'x,y',
            bounds: {
                minX: -(this.grid.offsetWidth - window.innerWidth) - 200,
                maxX: 200,
                minY: -(this.grid.offsetHeight - window.innerHeight) - 100,
                maxY: 100
            },
            inertia: true,
            allowEventDefault: true,
            edgeResistance: 0.9,

            onDragStart: () => {
                this.isDragging = true;
                this.grid.classList.add('--is-dragging');
            },

            onDragEnd: () => {
                this.isDragging = false;
                this.grid.classList.remove('--is-dragging');
            }
        })[0];
    };

    addEvents() {
        window.addEventListener('wheel', (e) => {
            e.preventDefault();

            // 마우스 휠의 기본 이동량 증폭하기 위해서 사용
            const deltaX = -e.deltaX * 7;
            const deltaY = -e.deltaY * 7;

            const currentX = gsap.getProperty(this.grid, 'x');
            const currentY = gsap.getProperty(this.grid, 'y');

            const newX = currentX + deltaX;
            const newY = currentY + deltaY;

            const bounds = this.draggable.vars.bounds;
            const clampedX = Math.max(bounds.minX, Math.min(bounds.maxX, newX));
            const clampedY = Math.max(bounds.minY, Math.min(bounds.maxY, newY));

            gsap.to(this.grid, {
                x: clampedX,
                y: clampedY,
                duration: 0.3,
                ease: 'power3.out'
            });

        }, { passive: false });

        window.addEventListener('resize', () => {
            this.updateBounds();
        });

        window.addEventListener('mousemove', (e) => {
            if (this.SHOW_DETAILS) {
                this.handleCursor(e);
            }
        });
    };

    updateBounds() {
        if (this.draggable) {
            this.draggable.vars.bounds = {
                minX: -(this.grid.offsetWidth - window.innerWidth) - 50,
                maxX: 50,
                minY: -(this.grid.offsetHeight - window.innerHeight) - 50,
                maxY: 50
            };
        };
    };

    observeProducts() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry)=> {
                if (entry.target === this.currentProduct) return;

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
                        ease: 'poser2.in'
                    });
                }
            });
        }, {
            root: null,
            threshold: 0.1
        });

        this.products.forEach(product => {
            observer.observe(product)
        });
    };

    handleDetails() {
        this.SHOW_DETAILS = false;

        this.products.forEach(product => {
            product.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showDetails(product);
            });
        });
    }

    showDetails(product) {
        if (this.SHOW_DETAILS) return;

        this.SHOW_DETAILS = true;
        this.details.classList.add('--is-showing');
        this.dom.classList.add('--is-details-showing');

        gsap.to(this.dom, {
            x: '-33vw',
            duration: 1.2,
            ease: 'power3.inOut'
        });

        gsap.to(this.details, {
            x: 0,
            duration: 1.2,
            ease: 'power3.inOut'
        });

        this.flipProduct(product);

        // product data-id 에서 category 추출 (예: 'handCream-1' → 'handCream')
        const productId = product.dataset.id;
        const match = productId.match(/^([a-zA-Z]+)(?:-(\d+))?$/);
        const category = match[1];
        const scent = match[2] || category; // 숫자가 없으면 category 자체를 scent로 사용

        const elements = [
            this.details.querySelector(`[data-desc="${productId}"]`),
            this.details.querySelector(`[data-category="${category}"]`),
            this.details.querySelector(`[data-price="${category}"]`),
            this.details.querySelector(`[data-ml="${category}"]`),
            this.details.querySelector(`[data-scent="${scent}"]`),
            this.details.querySelector(`[data-note="${scent}"]`)
        ];

        elements.forEach(el => el && (el.style.display = 'block'));
    }

    flipProduct(product) {
        this.currentProduct = product;
        this.originalParent = product.parentNode;

        if (this.observer) {
            this.observer.unobserve(product);
        }

        const state = Flip.getState(product);
        this.detailsThumb.appendChild(product);

        Flip.from(state, {
            absolute: true,
            duration: 1.2,
            ease: 'power3.inOut'
        });
    }

    intro() {
        this.centerGrid();

        const timeline = gsap.timeline();

        timeline.set(this.dom, { scale: .5 });
        timeline.set(this.products, {
            scale: 0.5,
            opacity: 0
        });

        timeline.to(this.products, {
            scale: 1,
            opacity: 1,
            duration: 0.6,
            ease: "power3.out",
            stagger: {
                amount: 1.2,
                from: "random"
            }
        });
        timeline.to(this.dom, {
            scale: 1,
            duration: 1.2,
            ease: "power3.inOut",
            onComplete: () => {
                this.setupDraggable();
                this.addEvents();
                this.observeProducts();
                this.handleDetails();
            }
        });
    }

    init() {
        this.intro();
    }
}

const grid = new Grid();

preloadImages('#grid img').then(() => {
    grid.init();
    document.body.classList.remove('loading');
})

