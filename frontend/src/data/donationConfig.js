/**
 * TON3S Donation Configuration
 * Hardcoded addresses and amount presets
 */

export const DONATION_CONFIG = {
    lightningAddress: 'hypercoin@coinos.io',
    bitcoinAddress: 'bc1qYOUR_ADDRESS_HERE', // Replace with your Sparrow address
    presets: [
        { sats: 1000, label: '1k' },
        { sats: 5000, label: '5k' },
        { sats: 21000, label: '21k' },
        { sats: 100000, label: '100k' }
    ],
    defaultAmount: 21000
};
