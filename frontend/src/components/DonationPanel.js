/**
 * TON3S Donation Panel Component
 * Bitcoin donation panel with Lightning and on-chain QR codes
 */

import { BaseComponent } from './BaseComponent.js';
import { appState, StateEvents } from '../state/AppState.js';
import { qrCodeService } from '../services/QRCodeService.js';
import { DONATION_CONFIG } from '../data/donationConfig.js';
import { toast } from './Toast.js';

export class DonationPanel extends BaseComponent {
    constructor(container) {
        super(container);
        this.activeTab = 'lightning'; // 'lightning' or 'onchain'
        this.selectedAmount = DONATION_CONFIG.defaultAmount;
        this.customAmount = '';
    }

    render() {
        const panelOpen = appState.settings.donationPanelOpen;

        this.container.innerHTML = `
            <div class="donation-panel${panelOpen ? ' donation-panel-open' : ''}">
                <div class="donation-panel-content">
                    <div class="donation-panel-header">
                        <span class="donation-panel-title">Support TON3S</span>
                        <button class="donation-collapse-btn" aria-label="Close panel" title="Close">
                            <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>

                    <div class="donation-tabs">
                        <button class="donation-tab${this.activeTab === 'lightning' ? ' active' : ''}" data-tab="lightning">
                            Lightning
                        </button>
                        <button class="donation-tab${this.activeTab === 'onchain' ? ' active' : ''}" data-tab="onchain">
                            On-chain
                        </button>
                    </div>

                    ${
                        this.activeTab === 'onchain'
                            ? `
                    <div class="donation-amounts">
                        ${DONATION_CONFIG.presets
                            .map(
                                preset => `
                            <button class="donation-amount-btn${this.selectedAmount === preset.sats && !this.customAmount ? ' active' : ''}" data-sats="${preset.sats}">
                                ${preset.label}
                            </button>
                        `
                            )
                            .join('')}
                    </div>

                    <input
                        type="text"
                        inputmode="numeric"
                        class="donation-custom-input"
                        placeholder="Custom sats"
                        value="${this.formatNumber(this.customAmount)}"
                    >
                    `
                            : ''
                    }

                    <div class="donation-qr-container">
                        ${this.renderQRCode()}
                    </div>

                    <div class="donation-address-section">
                        <span class="donation-address">${this.getDisplayAddress()}</span>
                        <button class="donation-copy-btn" title="Copy address">
                            <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
                                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderQRCode() {
        const data = this.getQRData();
        if (!data) {
            return '<div class="donation-qr-placeholder">Configure address</div>';
        }
        return qrCodeService.generateSVG(data, 180);
    }

    getQRData() {
        const amount = this.customAmount ? parseInt(this.customAmount, 10) : this.selectedAmount;

        if (this.activeTab === 'lightning') {
            // Lightning Address - just the address itself
            return DONATION_CONFIG.lightningAddress;
        } else {
            // On-chain - BIP21 URI with amount; fall back to preset if custom is 0
            const effectiveAmount = amount > 0 ? amount : this.selectedAmount;
            const btcAmount = effectiveAmount / 100000000;
            return `bitcoin:${DONATION_CONFIG.bitcoinAddress}?amount=${btcAmount}`;
        }
    }

    getDisplayAddress() {
        if (this.activeTab === 'lightning') {
            return DONATION_CONFIG.lightningAddress;
        } else {
            // Truncate Bitcoin address for display
            const addr = DONATION_CONFIG.bitcoinAddress;
            if (addr.length > 20) {
                return `${addr.slice(0, 10)}...${addr.slice(-8)}`;
            }
            return addr;
        }
    }

    getCopyAddress() {
        if (this.activeTab === 'lightning') {
            return DONATION_CONFIG.lightningAddress;
        } else {
            return DONATION_CONFIG.bitcoinAddress;
        }
    }

    formatNumber(value) {
        if (!value) {
            return '';
        }
        const num = String(value).replace(/[^\d]/g, '');
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    parseNumber(formatted) {
        return formatted.replace(/[^\d]/g, '');
    }

    updateQRCode() {
        const container = this.container.querySelector('.donation-qr-container');
        if (container) {
            container.innerHTML = this.renderQRCode();
        }
    }

    bindEvents() {
        // Panel click events (stopPropagation prevents click-outside from firing after render)
        this.container.addEventListener('click', e => {
            e.stopPropagation();

            // Close panel button
            if (e.target.closest('.donation-collapse-btn')) {
                appState.setDonationPanelOpen(false);
                return;
            }

            // Tab buttons
            const tabBtn = e.target.closest('.donation-tab');
            if (tabBtn) {
                this.activeTab = tabBtn.dataset.tab;
                this.render();
                return;
            }

            // Amount preset buttons
            const amountBtn = e.target.closest('.donation-amount-btn');
            if (amountBtn) {
                this.selectedAmount = parseInt(amountBtn.dataset.sats, 10);
                this.customAmount = '';
                this.render();
                return;
            }

            // Copy button
            if (e.target.closest('.donation-copy-btn')) {
                this.copyAddress();
                return;
            }
        });

        // Custom amount input
        this.container.addEventListener('input', e => {
            if (e.target.classList.contains('donation-custom-input')) {
                const input = e.target;
                const cursorPos = input.selectionStart;
                const oldValue = input.value;
                const oldLength = oldValue.length;

                // Parse and store raw number
                this.customAmount = this.parseNumber(input.value);

                // Format with commas
                const formatted = this.formatNumber(this.customAmount);
                input.value = formatted;

                // Adjust cursor position for added/removed commas
                const lengthDiff = formatted.length - oldLength;
                const newPos = Math.max(0, cursorPos + lengthDiff);
                input.setSelectionRange(newPos, newPos);

                // Clear preset selection when custom value entered
                if (this.customAmount) {
                    this.container.querySelectorAll('.donation-amount-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                }

                // Update only the QR code
                this.updateQRCode();
            }
        });

        // Click outside to close
        this.handleClickOutside = e => {
            const panel = this.container.querySelector('.donation-panel');
            if (
                panel?.classList.contains('donation-panel-open') &&
                !panel.contains(e.target) &&
                !e.target.closest('#donation-btn')
            ) {
                appState.setDonationPanelOpen(false);
            }
        };
        document.addEventListener('click', this.handleClickOutside);

        // State subscription
        this.subscribe(
            appState.on(StateEvents.DONATION_PANEL_TOGGLED, isOpen => this.updatePanelState(isOpen))
        );
    }

    updatePanelState(isOpen) {
        const panel = this.container.querySelector('.donation-panel');
        if (panel) {
            panel.classList.toggle('donation-panel-open', isOpen);
        }
    }

    async copyAddress() {
        const address = this.getCopyAddress();
        try {
            await navigator.clipboard.writeText(address);
            toast.success('Address copied');
        } catch (err) {
            toast.error('Failed to copy');
        }
    }

    destroy() {
        document.removeEventListener('click', this.handleClickOutside);
        super.destroy();
    }
}

export default DonationPanel;
