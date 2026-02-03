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
                <div class="donation-icon-strip">
                    <button class="donation-icon-strip-btn donation-toggle-btn" aria-label="Toggle donation panel" title="Support TON3S">
                        <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                    </button>
                </div>
                <div class="donation-panel-content">
                    <div class="donation-panel-header">
                        <span class="donation-panel-title">Support TON3S</span>
                        <button class="donation-collapse-btn" aria-label="Collapse panel" title="Collapse panel">
                            <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
                                <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z"/>
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
                        type="number"
                        class="donation-custom-input"
                        placeholder="Custom sats"
                        value="${this.customAmount}"
                        min="1"
                    >

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
            // On-chain - BIP21 URI with amount
            const btcAmount = amount / 100000000;
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

    bindEvents() {
        // Toggle panel button (in icon strip - opens panel)
        this.container.addEventListener('click', e => {
            if (e.target.closest('.donation-toggle-btn')) {
                appState.toggleDonationPanel();
                return;
            }

            // Collapse panel button
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
                this.customAmount = e.target.value;
                this.render();
                // Re-focus the input after render
                const input = this.container.querySelector('.donation-custom-input');
                if (input) {
                    input.focus();
                    input.setSelectionRange(input.value.length, input.value.length);
                }
            }
        });

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
}

export default DonationPanel;
