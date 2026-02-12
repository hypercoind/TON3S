/**
 * TON3S Toast Notification Component
 * Provides non-intrusive user feedback
 */

class ToastManager {
    constructor() {
        this.container = null;
        this.toasts = [];
        this.taggedToasts = new Map(); // tag → { element, timeoutId }
        this.init();
    }

    init() {
        // Create toast container
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        this.container.setAttribute('role', 'region');
        this.container.setAttribute('aria-live', 'polite');
        this.container.setAttribute('aria-label', 'Notifications');
        document.body.appendChild(this.container);
    }

    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {object} options - Toast options
     * @param {string} options.type - 'success' | 'error' | 'info' | 'warning'
     * @param {number} options.duration - Duration in ms (default: 3000)
     */
    show(message, options = {}) {
        const { type = 'info', duration = 3000, tag } = options;

        // If tagged and already exists, update in-place
        if (tag && this.taggedToasts.has(tag)) {
            return this.updateTaggedToast(tag, message, duration);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');

        if (tag) {
            toast.dataset.tag = tag;
        }

        const icon = this.getIcon(type);
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${this.escapeHtml(message)}</span>
            <button class="toast-close" aria-label="Dismiss">
                <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </button>
        `;

        // Close button handler
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.dismiss(toast));

        this.container.appendChild(toast);
        this.toasts.push(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto-dismiss
        let timeoutId = null;
        if (duration > 0) {
            timeoutId = setTimeout(() => {
                this.dismiss(toast);
            }, duration);
        }

        // Track tagged toast
        if (tag) {
            this.taggedToasts.set(tag, { element: toast, timeoutId });
        }

        return toast;
    }

    updateTaggedToast(tag, message, duration) {
        const entry = this.taggedToasts.get(tag);
        const { element } = entry;

        // Update message text
        const msgEl = element.querySelector('.toast-message');
        if (msgEl) {
            msgEl.textContent = message;
        }

        // Reset auto-dismiss timer
        if (entry.timeoutId) {
            clearTimeout(entry.timeoutId);
        }
        let timeoutId = null;
        if (duration > 0) {
            timeoutId = setTimeout(() => {
                this.dismiss(element);
            }, duration);
        }
        entry.timeoutId = timeoutId;

        return element;
    }

    /**
     * Dismiss a toast
     */
    dismiss(toast) {
        if (!toast || !this.container.contains(toast)) {
            return;
        }

        // Clean up tag tracking
        const tag = toast.dataset.tag;
        if (tag && this.taggedToasts.has(tag)) {
            const entry = this.taggedToasts.get(tag);
            if (entry.timeoutId) {
                clearTimeout(entry.timeoutId);
            }
            this.taggedToasts.delete(tag);
        }

        toast.classList.remove('show');
        toast.classList.add('hiding');

        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            this.toasts = this.toasts.filter(t => t !== toast);
        }, 300);
    }

    /**
     * Show success toast
     */
    success(message, options = {}) {
        return this.show(message, { ...options, type: 'success' });
    }

    /**
     * Show error toast
     */
    error(message, options = {}) {
        return this.show(message, {
            ...options,
            type: 'error',
            duration: options.duration || 5000
        });
    }

    /**
     * Show info toast
     */
    info(message, options = {}) {
        return this.show(message, { ...options, type: 'info' });
    }

    /**
     * Show warning toast
     */
    warning(message, options = {}) {
        return this.show(message, {
            ...options,
            type: 'warning',
            duration: options.duration || 4000
        });
    }

    /**
     * Get icon for toast type
     */
    getIcon(type) {
        const icons = {
            success: `<svg fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>`,
            error: `<svg fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>`,
            info: `<svg fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>`,
            warning: `<svg fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>`
        };
        return icons[type] || icons.info;
    }

    /**
     * Escape HTML entities
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Destroy toast manager
     */
    destroy() {
        // Clear all tagged toast timers
        for (const entry of this.taggedToasts.values()) {
            if (entry.timeoutId) {
                clearTimeout(entry.timeoutId);
            }
        }
        this.taggedToasts.clear();

        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.toasts = [];
        this.container = null;
    }
}

// Create singleton instance
export const toast = new ToastManager();

export { ToastManager };
export default toast;
