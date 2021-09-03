'use strict';

const contractHelpers = require('../../lib/contract.helpers');

module.exports = (Contract) => {
  Contract.remoteMethod('getTokenIdJSON', {
    accepts: [
      {
        arg: 'contractAddress',
        type: 'string',
        required: false,
      },
      {
        arg: 'tokenId',
        type: 'string',
        required: false,
      },
    ],
    returns: {
      type: 'object',
      root: true,
    },
  });

  // possible responses:
  // ipfs://QmUGmWwrNR7JKBCSu3CkGnTYSFat7y2AiUzACcbAoZcj2d
  // https://meebits.larvalabs.com/meebit/20000
  // ipfs://QmXgSuLPGuxxRuAana7JdoWmaS25oAcXv3x2pYMN9kVfg3/3152 ==> https://ipfs.io/ipfs/QmXgSuLPGuxxRuAana7JdoWmaS25oAcXv3x2pYMN9kVfg3/3152
  // https://api.mooncat.community/traits/13027 0xc3f733ca98e0dad0386979eb96fb1722a1a05e69
  // https://mafia-tokener.herokuapp.com/tokens/9125 0x392179031da3012dac321703a29e4c9fbd26316b
  // https://raw.githubusercontent.com/recklesslabs/wickedcraniums/main/8320 0x85f740958906b317de6ed79663012859067e745b
  // 0x38f1e0fb6c88209794c1b42374e45e18e7303cb3/1  data:application/json;base64,eyJuYW1lIjogIlBvdGlvbiAjMSIsICJkZXNjcmlwdGlvbiI6ICJQb3Rpb25zIGFyZSBhdXRvbWF0aWNhbGx5IGdlbmVyYXRlZCBvbi1jaGFpbi4gSW5zcGlyZWQgYW5kIGNvbXBhdGlibGUgd2l0aCBMb290IChmb3IgQWR2ZW50dXJlcnMpIiwgImltYWdlIjogImRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEhOMlp5QjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaUlIQnlaWE5sY25abFFYTndaV04wVW1GMGFXODlJbmhOYVc1WlRXbHVJRzFsWlhRaUlIWnBaWGRDYjNnOUlqQWdNQ0F6TlRBZ016VXdJajQ4YzNSNWJHVStMbUpoYzJVZ2V5Qm1hV3hzT2lCM2FHbDBaVHNnWm05dWRDMW1ZVzFwYkhrNklHTjFjbk5wZG1VN0lHWnZiblF0YzJsNlpUb2dNalJ3ZURzZ2ZUd3ZjM1I1YkdVK1BISmxZM1FnZDJsa2RHZzlJakV3TUNVaUlHaGxhV2RvZEQwaU1UQXdKU0lnWm1sc2JEMGlZbXhoWTJzaUlDOCtQSFJsZUhRZ2VEMGlNVEFpSUhrOUlqSXdJaUJqYkdGemN6MGlZbUZ6WlNJK1NHVmhiSFJvUEM5MFpYaDBQangwWlhoMElIZzlJakV3SWlCNVBTSTBNQ0lnWTJ4aGMzTTlJbUpoYzJVaVBsTjBjbVZ1WjNSb0lETThMM1JsZUhRK1BIUmxlSFFnZUQwaU1UQWlJSGs5SWpZd0lpQmpiR0Z6Y3owaVltRnpaU0krU1c1MmFYTnBZbWxzYVhSNUlERThMM1JsZUhRK1BIUmxlSFFnZUQwaU1UQWlJSGs5SWpnd0lpQmpiR0Z6Y3owaVltRnpaU0krVFdsdVpDQkRiMjUwY205c0lEWThMM1JsZUhRK1BIUmxlSFFnZUQwaU1UQWlJSGs5SWpFd01DSWdZMnhoYzNNOUltSmhjMlVpUGxCdmFYTnZiaUF4TUR3dmRHVjRkRDQ4ZEdWNGRDQjRQU0l4TUNJZ2VUMGlNVEl3SWlCamJHRnpjejBpWW1GelpTSStTR1ZoYkhSb0lEYzhMM1JsZUhRK1BIUmxlSFFnZUQwaU1UQWlJSGs5SWpFME1DSWdZMnhoYzNNOUltSmhjMlVpUGtac1lXMWxjeUEyUEM5MFpYaDBQangwWlhoMElIZzlJakV3SWlCNVBTSXhOakFpSUdOc1lYTnpQU0ppWVhObElqNVRiRzkzYm1WemN5QTRQQzkwWlhoMFBqd3ZjM1puUGc9PSJ9
  // https://boredapeyachtclub.com/api/mutants/6635 0x60e4d786628fea6478f785a6d7e704777c86a7c6

  // if it is nonexisting token
  // {
  //   "error": {
  //     "statusCode": 500,
  //     "name": "Error",
  //     "message": "Returned error: execution reverted: ERC721Metadata: URI query for nonexistent token",
  //     "data": "0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002f4552433732314d657461646174613a2055524920717565727920666f72206e6f6e6578697374656e7420746f6b656e0000000000000000000000000000000000",
  //     "stack": "Error: Returned error: execution reverted: ERC721Metadata: URI query for nonexistent token\n    at Object.ErrorResponse (/Users/ivanflores/dev/projects/opes/wego-api/node_modules/web3-core-helpers/lib/errors.js:28:19)\n    at /Users/ivanflores/dev/projects/opes/wego-api/node_modules/web3-core-requestmanager/lib/index.js:302:36\n    at XMLHttpRequest.request.onreadystatechange (/Users/ivanflores/dev/projects/opes/wego-api/node_modules/web3-providers-http/lib/index.js:98:13)\n    at XMLHttpRequestEventTarget.dispatchEvent (/Users/ivanflores/dev/projects/opes/wego-api/node_modules/xhr2-cookies/dist/xml-http-request-event-target.js:34:22)\n    at XMLHttpRequest._setReadyState (/Users/ivanflores/dev/projects/opes/wego-api/node_modules/xhr2-cookies/dist/xml-http-request.js:208:14)\n    at XMLHttpRequest._onHttpResponseEnd (/Users/ivanflores/dev/projects/opes/wego-api/node_modules/xhr2-cookies/dist/xml-http-request.js:318:14)\n    at IncomingMessage.<anonymous> (/Users/ivanflores/dev/projects/opes/wego-api/node_modules/xhr2-cookies/dist/xml-http-request.js:289:61)\n    at IncomingMessage.emit (events.js:412:35)\n    at endReadableNT (internal/streams/readable.js:1317:12)\n    at processTicksAndRejections (internal/process/task_queues.js:82:21)"
  //   }
  // }
  // this same in python https://ethereum.org/en/developers/docs/standards/tokens/erc-721/
  // node https://medium.com/coinmonks/ethereum-tutorial-sending-transaction-via-nodejs-backend-7b623b885707
  Contract.getTokenIdJSON = async (contractAddress, tokenId) => {
    // const infuraProvider = 'https://mainnet.infura.io/v3/b111d8f387c847039541e29435e06cd2' // bees
    // const infuraProvider = 'https://mainnet.infura.io/v3/c5e5cb06445c43c2b0305c12450cc0b5' // ivan digital hedge
    const web3 = require('web3');
    const ERC721ABI = require('../../lib/ERC721ABI');

    const AdminAddress = '0xEd27E5c6CFc27b0b244c1fB6f9AE076c3eb7C10B';
    const AngelPodsAddress = '0xC5cEcC420a1f2f78503671f562E1FE61036fF0E0';

    //contract abi is the array that you can get from the ethereum wallet or etherscan
    const contractABI = ERC721ABI;
    contractAddress = contractAddress || AngelPodsAddress;

    try {
      const web3js = new web3(
        new web3.providers.HttpProvider(
          'https://mainnet.infura.io/v3/b111d8f387c847039541e29435e06cd2' //c5e5cb06445c43c2b0305c12450cc0b5'
        )
      );

      const contract = new web3js.eth.Contract(contractABI, contractAddress);

      const tokenUri = await contract.methods.tokenURI(tokenId || 1000).call({
        from: AdminAddress,
      });
      console.log('tokenUri', tokenUri);
      return tokenUri;
    } catch (error) {
      console.log('error --------', error);
      throw error;
    }
  };

  Contract.remoteMethod('getAbi', {
    accepts: [
      {
        arg: 'address',
        type: 'string',
        required: true,
      },
    ],
    returns: {
      type: 'object',
      root: true,
    },
  });

  Contract.getAbi = contractHelpers.getAbi;

  Contract.remoteMethod('saveAbis', {
    accepts: [],
    returns: {
      type: 'object',
      root: true,
    },
  });

  Contract.saveAbis = contractHelpers.saveAbis;

  Contract.remoteMethod('saveSupply', {
    accepts: [],
    returns: {
      type: 'object',
      root: true,
    },
  });

  Contract.saveSupply = contractHelpers.saveSupply;
};

// const Web3 = require("web3")
// const web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/YOUR_PROJECT_ID"))
// get the balance of an ethereum address
// web3.eth.getBalance("0x5A0b54D5dc17e0AadC383d2db43B0a0D3E029c4c", function(err, result) {
//   if (err) {
//     console.log(err)
//   } else {
//     console.log(web3.utils.fromWei(result, "ether") + " ETH")
//   }
// })
