/**
 * TON3S Donation Configuration
 * Hardcoded addresses and amount presets
 */

const bitcoinAddresses = [
    'bc1ptrdsuw66s80mfm6upfppxsat7052fm7f9ns0tqegl9tma6u735lsnwfull',
    'bc1ppqpta5hg55ldjd9rvpfqeugfsk2afk0kvg7quxmvthga623m78vq9efqs9',
    'bc1pe2k83t37jvhv973qc0lc3c63jmfq74jsg8gl2afekfukur864flsz626rx',
    'bc1pnr55agw8j2w3veseuuky2wfsn3wz7xpyfvk50ff4cydt83xysjqqqf0nsy',
    'bc1pys234pv02zde2w22jjyvpzvdxpucapugjwwasktq4khmetewd32qqc78pd',
    'bc1pfysmfglpsmwhyd2j9536flarcgpg2h5nmjrzls3y046q5j4h4t5qnqu6vj',
    'bc1pf939ljn56vg9dfdrhdw7t3sw3agf0fmk83x0jegeunmk6gqgdspq4vprps',
    'bc1pf456qrk5se7hcur2srwhy9gxjudgpwztz2t9xjqyr65v9rsng5uswt4gkc',
    'bc1prufdlzzk9esy9vulpjahs8ymm7hytu0s2c8cky8gwuynj93kn79s2fs69c',
    'bc1pn6gn2w20ptulm7kfh0hpf0ejc78khm6pn5jhguc6rgdnmnm67reqfgzgc3'
];

export const DONATION_CONFIG = {
    lightningAddress: 'ton3s@coinos.io',
    bitcoinAddress: bitcoinAddresses[Math.floor(Math.random() * bitcoinAddresses.length)],
    presets: [
        { sats: 1000, label: '1k' },
        { sats: 5000, label: '5k' },
        { sats: 21000, label: '21k' },
        { sats: 100000, label: '100k' }
    ],
    defaultAmount: 21000
};
