import { preloadImages } from './utils.js'

gsap.registerPlugin(Draggable, Flip, SplitText)

class Grid {
    constructor() {
        this.dom = document.querySelector("#container");
        this.grid = document.querySelector("#grid");
        this.products = [...document.querySelectorAll(".product div")];

        this.details = document.querySelector(".details");
        // this.detailsThumb = this.details.querySelector(".details__thumb")

        this.cross = document.querySelector(".cross");

        this.isDragging = false;
    }

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
    }

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
    }

    addEvents() {
        window.addEventListener('wheel', (e) => {

        })
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
                // this.observeProducts();
                // this.handleDetails();
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

