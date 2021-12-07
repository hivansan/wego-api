#!/usr/bin/env node


import response from './asset.events.json';


const main = async () => {

  console.log(response.asset_events.flatMap(event => {
    if (event.asset_bundle) {
      const assets: any = [];
      for (const asset of event.asset_bundle.assets) {

        assets.push(event, asset);
      }
      return 'assets';
    }

    return event.asset
  }));

}

main();