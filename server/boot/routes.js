'use strict';
const axios = require('axios');

module.exports = (app) => {
  const moment = require('moment');

  const sleep = (s) => new Promise((resolve) => setTimeout(resolve, s * 1000));

  app.get('/search', async (req, res) => {
    await sleep(1);

    const { q } = req.query;

    res.json({
      q,
      exactMatch: {
        name: 'Mutant Ape Yach Club',
        type: 'collection', // collection
        address: '0x123..',
        image:
          'https://lh3.googleusercontent.com/lHexKRMpw-aoSyB1WdFBff5yfANLReFxHzt1DOj_sg7mS14yARpuvYcUtsyyx-Nkpk6WTcUPFoG53VnLJezYi8hAs0OxNZwlw6Y-dmI=s130',
        dateAdded: '20 jul 2021',
        ethTotalVolume: '2.772.94',
        owners: '1783',
        sevenDayVolume: '32.25',
        totalItems: '16.384',
        likes: '96%',
        disLikes: '4%',
        wegoScore: 89,
      },
      assets: [
        {
          tokenId: 'tokenId',
          address: 'address',
          image:
            'https://lh3.googleusercontent.com/dG9YdzvAUCNMhB9cwDLziLFWoHgGytlCxAQ-uJ67USsch7-6iZu5kvgMcMB8WGpbXRXdq7A86Z-P9lUvceQ-MaSUTsAP2qYEKo_0dg=w600',
          name: 'Mutant Ape Yach Club',
          address: '0x123..',
          dateAdded: '20 jul 2021',
          owners: 300,
        },
        {
          tokenId: 'tokenId',
          address: 'address',
          image:
            'https://lh3.googleusercontent.com/dG9YdzvAUCNMhB9cwDLziLFWoHgGytlCxAQ-uJ67USsch7-6iZu5kvgMcMB8WGpbXRXdq7A86Z-P9lUvceQ-MaSUTsAP2qYEKo_0dg=w600',
          name: 'Mutant Ape Yach Club',
          address: '0x124..',
          dateAdded: '20 jul 2021',
          owners: 200,
        },
        {
          tokenId: 'tokenId',
          address: 'address',
          image:
            'https://lh3.googleusercontent.com/dG9YdzvAUCNMhB9cwDLziLFWoHgGytlCxAQ-uJ67USsch7-6iZu5kvgMcMB8WGpbXRXdq7A86Z-P9lUvceQ-MaSUTsAP2qYEKo_0dg=w600',
          name: 'Mutant Ape Yach Club',
          address: '0x125..',
          dateAdded: '20 jul 2021',
          owners: 400,
        },
        {
          tokenId: 'tokenId',
          address: 'address',
          image:
            'https://lh3.googleusercontent.com/dG9YdzvAUCNMhB9cwDLziLFWoHgGytlCxAQ-uJ67USsch7-6iZu5kvgMcMB8WGpbXRXdq7A86Z-P9lUvceQ-MaSUTsAP2qYEKo_0dg=w600',
          name: 'Mutant Ape Yach Club',
          address: '0x126..',
          dateAdded: '20 jul 2021',
          owners: 340,
        },
        {
          tokenId: 'tokenId',
          address: 'address',
          image:
            'https://lh3.googleusercontent.com/dG9YdzvAUCNMhB9cwDLziLFWoHgGytlCxAQ-uJ67USsch7-6iZu5kvgMcMB8WGpbXRXdq7A86Z-P9lUvceQ-MaSUTsAP2qYEKo_0dg=w600',
          name: 'Mutant Ape Yach Club',
          address: '0x127..',
          dateAdded: '20 jul 2021',
          owners: 240,
        },
      ],
      collections: [
        {
          name: 'Mutant Ape Yacht Club',
          type: 'collection', // collection
          address: '0x123..',
          image:
            'https://lh3.googleusercontent.com/lHexKRMpw-aoSyB1WdFBff5yfANLReFxHzt1DOj_sg7mS14yARpuvYcUtsyyx-Nkpk6WTcUPFoG53VnLJezYi8hAs0OxNZwlw6Y-dmI=s130',
          dateAdded: '20 jul 2021',
          ethTotalVolume: '2.772.94',
          owners: '1783',
          sevenDayVolume: '32.25',
          totalItems: '16.384',
          likes: '96%',
          disLikes: '4%',
          wegoScore: 89,
          assets: [
            'https://lh3.googleusercontent.com/dG9YdzvAUCNMhB9cwDLziLFWoHgGytlCxAQ-uJ67USsch7-6iZu5kvgMcMB8WGpbXRXdq7A86Z-P9lUvceQ-MaSUTsAP2qYEKo_0dg=w600',
            'https://lh3.googleusercontent.com/dG9YdzvAUCNMhB9cwDLziLFWoHgGytlCxAQ-uJ67USsch7-6iZu5kvgMcMB8WGpbXRXdq7A86Z-P9lUvceQ-MaSUTsAP2qYEKo_0dg=w600',
            'https://lh3.googleusercontent.com/dG9YdzvAUCNMhB9cwDLziLFWoHgGytlCxAQ-uJ67USsch7-6iZu5kvgMcMB8WGpbXRXdq7A86Z-P9lUvceQ-MaSUTsAP2qYEKo_0dg=w600',
          ],
        },
        {
          name: 'Mutant Ape Yacht Club',
          type: 'collection', // collection
          address: '0x124..',
          image:
            'https://lh3.googleusercontent.com/lHexKRMpw-aoSyB1WdFBff5yfANLReFxHzt1DOj_sg7mS14yARpuvYcUtsyyx-Nkpk6WTcUPFoG53VnLJezYi8hAs0OxNZwlw6Y-dmI=s130',
          dateAdded: '20 jul 2021',
          ethTotalVolume: '2.772.94',
          owners: '1783',
          sevenDayVolume: '32.25',
          totalItems: '16.384',
          likes: '96%',
          disLikes: '4%',
          wegoScore: 89,
          assets: [
            'https://lh3.googleusercontent.com/dG9YdzvAUCNMhB9cwDLziLFWoHgGytlCxAQ-uJ67USsch7-6iZu5kvgMcMB8WGpbXRXdq7A86Z-P9lUvceQ-MaSUTsAP2qYEKo_0dg=w600',
            'https://lh3.googleusercontent.com/dG9YdzvAUCNMhB9cwDLziLFWoHgGytlCxAQ-uJ67USsch7-6iZu5kvgMcMB8WGpbXRXdq7A86Z-P9lUvceQ-MaSUTsAP2qYEKo_0dg=w600',
            'https://lh3.googleusercontent.com/dG9YdzvAUCNMhB9cwDLziLFWoHgGytlCxAQ-uJ67USsch7-6iZu5kvgMcMB8WGpbXRXdq7A86Z-P9lUvceQ-MaSUTsAP2qYEKo_0dg=w600',
          ],
        },
        {
          name: 'Mutant Ape Yacht Club',
          type: 'collection', // collection
          address: '0x125..',
          image:
            'https://lh3.googleusercontent.com/lHexKRMpw-aoSyB1WdFBff5yfANLReFxHzt1DOj_sg7mS14yARpuvYcUtsyyx-Nkpk6WTcUPFoG53VnLJezYi8hAs0OxNZwlw6Y-dmI=s130',
          dateAdded: '20 jul 2021',
          ethTotalVolume: '2.772.94',
          owners: '1783',
          sevenDayVolume: '32.25',
          totalItems: '16.384',
          likes: '96%',
          disLikes: '4%',
          wegoScore: 89,
          assets: [
            'https://lh3.googleusercontent.com/dG9YdzvAUCNMhB9cwDLziLFWoHgGytlCxAQ-uJ67USsch7-6iZu5kvgMcMB8WGpbXRXdq7A86Z-P9lUvceQ-MaSUTsAP2qYEKo_0dg=w600',
            'https://lh3.googleusercontent.com/dG9YdzvAUCNMhB9cwDLziLFWoHgGytlCxAQ-uJ67USsch7-6iZu5kvgMcMB8WGpbXRXdq7A86Z-P9lUvceQ-MaSUTsAP2qYEKo_0dg=w600',
            'https://lh3.googleusercontent.com/dG9YdzvAUCNMhB9cwDLziLFWoHgGytlCxAQ-uJ67USsch7-6iZu5kvgMcMB8WGpbXRXdq7A86Z-P9lUvceQ-MaSUTsAP2qYEKo_0dg=w600',
          ],
        },
        {
          name: 'Mutant Ape Yacht Club',
          type: 'collection', // collection
          address: '0x126..',
          image:
            'https://lh3.googleusercontent.com/lHexKRMpw-aoSyB1WdFBff5yfANLReFxHzt1DOj_sg7mS14yARpuvYcUtsyyx-Nkpk6WTcUPFoG53VnLJezYi8hAs0OxNZwlw6Y-dmI=s130',
          dateAdded: '20 jul 2021',
          ethTotalVolume: '2.772.94',
          owners: '1783',
          sevenDayVolume: '32.25',
          totalItems: '16.384',
          likes: '96%',
          disLikes: '4%',
          wegoScore: 89,
          assets: [
            'https://lh3.googleusercontent.com/dG9YdzvAUCNMhB9cwDLziLFWoHgGytlCxAQ-uJ67USsch7-6iZu5kvgMcMB8WGpbXRXdq7A86Z-P9lUvceQ-MaSUTsAP2qYEKo_0dg=w600',
            'https://lh3.googleusercontent.com/dG9YdzvAUCNMhB9cwDLziLFWoHgGytlCxAQ-uJ67USsch7-6iZu5kvgMcMB8WGpbXRXdq7A86Z-P9lUvceQ-MaSUTsAP2qYEKo_0dg=w600',
            'https://lh3.googleusercontent.com/dG9YdzvAUCNMhB9cwDLziLFWoHgGytlCxAQ-uJ67USsch7-6iZu5kvgMcMB8WGpbXRXdq7A86Z-P9lUvceQ-MaSUTsAP2qYEKo_0dg=w600',
          ],
        },
        {
          name: 'Mutant Ape Yacht Club',
          type: 'collection', // collection
          address: '0x127..',
          image:
            'https://lh3.googleusercontent.com/lHexKRMpw-aoSyB1WdFBff5yfANLReFxHzt1DOj_sg7mS14yARpuvYcUtsyyx-Nkpk6WTcUPFoG53VnLJezYi8hAs0OxNZwlw6Y-dmI=s130',
          dateAdded: '20 jul 2021',
          ethTotalVolume: '2.772.94',
          owners: '1783',
          sevenDayVolume: '32.25',
          totalItems: '16.384',
          likes: '96%',
          disLikes: '4%',
          wegoScore: 89,
          assets: [
            'https://lh3.googleusercontent.com/dG9YdzvAUCNMhB9cwDLziLFWoHgGytlCxAQ-uJ67USsch7-6iZu5kvgMcMB8WGpbXRXdq7A86Z-P9lUvceQ-MaSUTsAP2qYEKo_0dg=w600',
            'https://lh3.googleusercontent.com/dG9YdzvAUCNMhB9cwDLziLFWoHgGytlCxAQ-uJ67USsch7-6iZu5kvgMcMB8WGpbXRXdq7A86Z-P9lUvceQ-MaSUTsAP2qYEKo_0dg=w600',
            'https://lh3.googleusercontent.com/dG9YdzvAUCNMhB9cwDLziLFWoHgGytlCxAQ-uJ67USsch7-6iZu5kvgMcMB8WGpbXRXdq7A86Z-P9lUvceQ-MaSUTsAP2qYEKo_0dg=w600',
          ],
        },
      ],
    });
  });
};
