import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StateEmitter } from '../StateEmitter.js';

describe('StateEmitter', () => {
    let emitter;

    beforeEach(() => {
        emitter = new StateEmitter();
    });

    describe('on', () => {
        it('should subscribe to an event', () => {
            const callback = vi.fn();
            emitter.on('test', callback);

            emitter.emit('test', 'data');

            expect(callback).toHaveBeenCalledWith('data');
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should allow multiple listeners for same event', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();

            emitter.on('test', callback1);
            emitter.on('test', callback2);

            emitter.emit('test', 'data');

            expect(callback1).toHaveBeenCalledWith('data');
            expect(callback2).toHaveBeenCalledWith('data');
        });

        it('should return an unsubscribe function', () => {
            const callback = vi.fn();
            const unsubscribe = emitter.on('test', callback);

            emitter.emit('test', 'first');
            expect(callback).toHaveBeenCalledTimes(1);

            unsubscribe();

            emitter.emit('test', 'second');
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should handle multiple subscriptions to different events', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();

            emitter.on('event1', callback1);
            emitter.on('event2', callback2);

            emitter.emit('event1', 'data1');
            emitter.emit('event2', 'data2');

            expect(callback1).toHaveBeenCalledWith('data1');
            expect(callback2).toHaveBeenCalledWith('data2');
        });
    });

    describe('once', () => {
        it('should only trigger callback once', () => {
            const callback = vi.fn();
            emitter.once('test', callback);

            emitter.emit('test', 'first');
            emitter.emit('test', 'second');

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith('first');
        });

        it('should pass arguments to callback', () => {
            const callback = vi.fn();
            emitter.once('test', callback);

            emitter.emit('test', { foo: 'bar' });

            expect(callback).toHaveBeenCalledWith({ foo: 'bar' });
        });
    });

    describe('emit', () => {
        it('should not throw when no listeners exist', () => {
            expect(() => emitter.emit('nonexistent', 'data')).not.toThrow();
        });

        it('should catch errors in listeners and continue', () => {
            const errorCallback = vi.fn(() => {
                throw new Error('Test error');
            });
            const normalCallback = vi.fn();

            emitter.on('test', errorCallback);
            emitter.on('test', normalCallback);

            // Should not throw
            expect(() => emitter.emit('test', 'data')).not.toThrow();

            // Both callbacks should have been called
            expect(errorCallback).toHaveBeenCalled();
            expect(normalCallback).toHaveBeenCalled();
        });

        it('should pass data to all listeners', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();

            emitter.on('test', callback1);
            emitter.on('test', callback2);

            const data = { complex: 'object' };
            emitter.emit('test', data);

            expect(callback1).toHaveBeenCalledWith(data);
            expect(callback2).toHaveBeenCalledWith(data);
        });
    });

    describe('off', () => {
        it('should remove all listeners for an event', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();

            emitter.on('test', callback1);
            emitter.on('test', callback2);

            emitter.off('test');

            emitter.emit('test', 'data');

            expect(callback1).not.toHaveBeenCalled();
            expect(callback2).not.toHaveBeenCalled();
        });

        it('should not affect other events', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();

            emitter.on('event1', callback1);
            emitter.on('event2', callback2);

            emitter.off('event1');

            emitter.emit('event1', 'data1');
            emitter.emit('event2', 'data2');

            expect(callback1).not.toHaveBeenCalled();
            expect(callback2).toHaveBeenCalledWith('data2');
        });

        it('should not throw when event does not exist', () => {
            expect(() => emitter.off('nonexistent')).not.toThrow();
        });
    });

    describe('clear', () => {
        it('should remove all listeners for all events', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();

            emitter.on('event1', callback1);
            emitter.on('event2', callback2);

            emitter.clear();

            emitter.emit('event1', 'data1');
            emitter.emit('event2', 'data2');

            expect(callback1).not.toHaveBeenCalled();
            expect(callback2).not.toHaveBeenCalled();
        });

        it('should not throw when no listeners exist', () => {
            expect(() => emitter.clear()).not.toThrow();
        });
    });

    describe('edge cases', () => {
        it('should handle unsubscribing same callback multiple times', () => {
            const callback = vi.fn();
            const unsubscribe = emitter.on('test', callback);

            unsubscribe();
            unsubscribe(); // Should not throw

            emitter.emit('test', 'data');
            expect(callback).not.toHaveBeenCalled();
        });

        it('should handle adding same callback multiple times', () => {
            const callback = vi.fn();

            emitter.on('test', callback);
            emitter.on('test', callback);

            emitter.emit('test', 'data');

            // Set doesn't allow duplicates, so it should only be called once
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should handle undefined data', () => {
            const callback = vi.fn();
            emitter.on('test', callback);

            emitter.emit('test', undefined);

            expect(callback).toHaveBeenCalledWith(undefined);
        });

        it('should handle null data', () => {
            const callback = vi.fn();
            emitter.on('test', callback);

            emitter.emit('test', null);

            expect(callback).toHaveBeenCalledWith(null);
        });
    });
});
