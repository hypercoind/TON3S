import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BaseComponent } from '../BaseComponent.js';

describe('BaseComponent', () => {
    let container;
    let component;

    beforeEach(() => {
        // Create a container element
        container = document.createElement('div');
        container.innerHTML = '<p class="test">Test Content</p>';
        document.body.appendChild(container);

        component = new BaseComponent(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    describe('constructor', () => {
        it('should set container', () => {
            expect(component.container).toBe(container);
        });

        it('should initialize subscriptions as empty array', () => {
            expect(component.subscriptions).toEqual([]);
        });

        it('should set initialized to false', () => {
            expect(component.initialized).toBe(false);
        });
    });

    describe('init', () => {
        it('should call render and bindEvents', () => {
            const renderSpy = vi.spyOn(component, 'render');
            const bindEventsSpy = vi.spyOn(component, 'bindEvents');

            component.init();

            expect(renderSpy).toHaveBeenCalled();
            expect(bindEventsSpy).toHaveBeenCalled();
        });

        it('should set initialized to true', () => {
            component.init();
            expect(component.initialized).toBe(true);
        });

        it('should not reinitialize if already initialized', () => {
            const renderSpy = vi.spyOn(component, 'render');

            component.init();
            component.init();

            expect(renderSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('subscribe', () => {
        it('should add unsubscribe function to subscriptions', () => {
            const unsubscribe = vi.fn();

            component.subscribe(unsubscribe);

            expect(component.subscriptions).toContain(unsubscribe);
        });
    });

    describe('destroy', () => {
        it('should call all unsubscribe functions', () => {
            const unsub1 = vi.fn();
            const unsub2 = vi.fn();

            component.subscribe(unsub1);
            component.subscribe(unsub2);

            component.destroy();

            expect(unsub1).toHaveBeenCalled();
            expect(unsub2).toHaveBeenCalled();
        });

        it('should clear subscriptions array', () => {
            component.subscribe(vi.fn());
            component.destroy();

            expect(component.subscriptions).toEqual([]);
        });

        it('should clear container innerHTML', () => {
            component.destroy();

            expect(container.innerHTML).toBe('');
        });

        it('should set initialized to false', () => {
            component.init();
            component.destroy();

            expect(component.initialized).toBe(false);
        });

        it('should handle null container', () => {
            component.container = null;

            expect(() => component.destroy()).not.toThrow();
        });
    });

    describe('$ (querySelector)', () => {
        it('should find element by selector', () => {
            const element = component.$('.test');

            expect(element).toBeTruthy();
            expect(element.textContent).toBe('Test Content');
        });

        it('should return null for non-existent selector', () => {
            const element = component.$('.nonexistent');

            expect(element).toBeNull();
        });
    });

    describe('$$ (querySelectorAll)', () => {
        it('should find all elements by selector', () => {
            container.innerHTML = '<p class="item">1</p><p class="item">2</p>';

            const elements = component.$$('.item');

            expect(elements).toHaveLength(2);
        });

        it('should return empty NodeList for non-existent selector', () => {
            const elements = component.$$('.nonexistent');

            expect(elements).toHaveLength(0);
        });
    });

    describe('createElement', () => {
        it('should create element with tag', () => {
            const el = component.createElement('div');

            expect(el.tagName).toBe('DIV');
        });

        it('should set className attribute', () => {
            const el = component.createElement('div', { className: 'my-class' });

            expect(el.className).toBe('my-class');
        });

        it('should set textContent attribute', () => {
            const el = component.createElement('span', { textContent: 'Hello' });

            expect(el.textContent).toBe('Hello');
        });

        it('should set innerHTML attribute', () => {
            const el = component.createElement('div', { innerHTML: '<span>Inner</span>' });

            expect(el.innerHTML).toBe('<span>Inner</span>');
        });

        it('should set data attributes', () => {
            const el = component.createElement('div', { 'data-id': '123', 'data-type': 'test' });

            expect(el.dataset.id).toBe('123');
            expect(el.dataset.type).toBe('test');
        });

        it('should set regular attributes', () => {
            const el = component.createElement('a', { href: 'https://example.com', id: 'link' });

            expect(el.getAttribute('href')).toBe('https://example.com');
            expect(el.getAttribute('id')).toBe('link');
        });

        it('should add event listeners', () => {
            const clickHandler = vi.fn();
            const el = component.createElement('button', { onClick: clickHandler });

            el.click();

            expect(clickHandler).toHaveBeenCalled();
        });

        it('should append string children', () => {
            const el = component.createElement('p', {}, ['Hello ', 'World']);

            expect(el.textContent).toBe('Hello World');
        });

        it('should append Node children', () => {
            const child = document.createElement('span');
            child.textContent = 'Child';

            const el = component.createElement('div', {}, [child]);

            expect(el.firstChild).toBe(child);
        });

        it('should handle mixed children', () => {
            const span = document.createElement('span');
            span.textContent = 'Span';

            const el = component.createElement('div', {}, ['Text ', span]);

            expect(el.textContent).toBe('Text Span');
            expect(el.querySelector('span')).toBe(span);
        });

        it('should handle empty attributes and children', () => {
            const el = component.createElement('div', {}, []);

            expect(el.tagName).toBe('DIV');
            expect(el.attributes).toHaveLength(0);
            expect(el.childNodes).toHaveLength(0);
        });
    });

    describe('inheritance', () => {
        class CustomComponent extends BaseComponent {
            constructor(container) {
                super(container);
                this.renderCalled = false;
                this.bindEventsCalled = false;
            }

            render() {
                this.renderCalled = true;
                this.container.innerHTML = '<div>Custom Content</div>';
            }

            bindEvents() {
                this.bindEventsCalled = true;
            }
        }

        it('should allow subclass to override render', () => {
            const custom = new CustomComponent(container);
            custom.init();

            expect(custom.renderCalled).toBe(true);
            expect(container.innerHTML).toBe('<div>Custom Content</div>');
        });

        it('should allow subclass to override bindEvents', () => {
            const custom = new CustomComponent(container);
            custom.init();

            expect(custom.bindEventsCalled).toBe(true);
        });
    });
});
