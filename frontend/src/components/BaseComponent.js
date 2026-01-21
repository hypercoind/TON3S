/**
 * TON3S Base Component
 * Base class for UI components with lifecycle methods
 */

export class BaseComponent {
    /**
     * @param {HTMLElement} container - Container element to render into
     */
    constructor(container) {
        this.container = container;
        this.subscriptions = [];
        this.initialized = false;
    }

    /**
     * Initialize the component
     */
    init() {
        if (this.initialized) {
            return;
        }
        this.render();
        this.bindEvents();
        this.initialized = true;
    }

    /**
     * Render the component HTML
     */
    render() {
        // Override in subclass
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Override in subclass
    }

    /**
     * Subscribe to state changes
     * @param {Function} unsubscribe - Unsubscribe function from state
     */
    subscribe(unsubscribe) {
        this.subscriptions.push(unsubscribe);
    }

    /**
     * Destroy the component and cleanup
     */
    destroy() {
        this.subscriptions.forEach(unsub => unsub());
        this.subscriptions = [];
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.initialized = false;
    }

    /**
     * Query selector helper
     */
    $(selector) {
        return this.container.querySelector(selector);
    }

    /**
     * Query selector all helper
     */
    $$(selector) {
        return this.container.querySelectorAll(selector);
    }

    /**
     * Create element helper
     */
    createElement(tag, attributes = {}, children = []) {
        const el = document.createElement(tag);

        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                el.className = value;
            } else if (key === 'textContent') {
                el.textContent = value;
            } else if (key === 'innerHTML') {
                el.innerHTML = value;
            } else if (key.startsWith('data-')) {
                el.dataset[key.slice(5)] = value;
            } else if (key.startsWith('on')) {
                el.addEventListener(key.slice(2).toLowerCase(), value);
            } else {
                el.setAttribute(key, value);
            }
        });

        children.forEach(child => {
            if (typeof child === 'string') {
                el.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                el.appendChild(child);
            }
        });

        return el;
    }
}

export default BaseComponent;
