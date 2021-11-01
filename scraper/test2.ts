#!/usr/bin/env node
import axios from 'axios';


import * as Query from '../lib/query';
import { Client } from '@elastic/elasticsearch';
import { toResult } from '../server/endpoints/util';
import datasources from '../server/datasources';
import { clamp } from 'ramda';


const { es } = datasources;
const db = new Client({ node: es.configuration.node || 'http://localhost:9200' });

const assets = ['http://localhost:3000/api/asset/0x8a90cab2b38dba80c64b7734e58ee1db38b8992e/9430/score',
  'http://localhost:3000/api/asset/0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb/7532/score',
  'http://localhost:3000/api/asset/0x7e6bc952d4b4bd814853301bee48e99891424de0/8338/score',
  'http://localhost:3000/api/asset/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d/5530/score',
  'http://localhost:3000/api/asset/0x0c2e57efddba8c768147d1fdf9176a0a6ebd5d83/3364/score',
  'http://localhost:3000/api/asset/0x5df340b5d1618c543ac81837da1c2d2b17b3b5d8/8629/score',
  'http://localhost:3000/api/asset/0x9a534628b4062e123ce7ee2222ec20b86e16ca8f/5662/score',
  'http://localhost:3000/api/asset/0xf7143ba42d40eaeb49b88dac0067e54af042e963/1513/score',
  'http://localhost:3000/api/asset/0x1cb1a5e65610aeff2551a50f76a87a7d3fb649c6/6557/score',
  'http://localhost:3000/api/asset/0xc2d6b32e533e7a8da404abb13790a5a2f606ad75/70/score',
  'http://localhost:3000/api/asset/0x4be3223f8708ca6b30d1e8b8926cf281ec83e770/1435/score',
  'http://localhost:3000/api/asset/0xaadba140ae5e4c8a9ef0cc86ea3124b446e3e46a/2333/score',
  'http://localhost:3000/api/asset/0x4cd0ea8b1bdb5ab9249d96ccf3d8a0d3ada2bc76/9002/score',
  'http://localhost:3000/api/asset/0x1a92f7381b9f03921564a437210bb9396471050c/4837/score',
  'http://localhost:3000/api/asset/0x11450058d796b02eb53e65374be59cff65d3fe7f/7973/score',
  'http://localhost:3000/api/asset/0xf62c6a8e7bcdc96cda11bd765b40afa9ffc19ab9/653/score',
  'http://localhost:3000/api/asset/0xf4ee95274741437636e748ddac70818b4ed7d043/3579/score',
  'http://localhost:3000/api/asset/0xc92ceddfb8dd984a89fb494c376f9a48b999aafc/5061/score',
  'http://localhost:3000/api/asset/0x57a204aa1042f6e66dd7730813f4024114d74f37/1059/score',
  'http://localhost:3000/api/asset/0x26437d312fb36bdd7ac9f322a6d4ccfe0c4fa313/1988/score',
  'http://localhost:3000/api/asset/klaytn/0xe47e90c58f8336a2f24bcd9bcb530e2e02e1e8ae/1993/score',
  'http://localhost:3000/api/asset/0x76be3b62873462d2142405439777e971754e8e77/10371/score',
  'http://localhost:3000/api/asset/0x368ad4a7a7f49b8fa8f34476be0fc4d04ce622f5/9028/score',
  'http://localhost:3000/api/asset/0xab0b0dd7e4eab0f9e31a539074a03f1c1be80879/572/score',
  'http://localhost:3000/api/asset/0x12d2d1bed91c24f878f37e66bd829ce7197e4d14/7008/score',
  'http://localhost:3000/api/asset/0xa7ee407497b2aeb43580cabe2b04026b5419d1dc/10183/score',
  'http://localhost:3000/api/asset/0xd4048be096f969f51fd5642a9c744ec2a7eb89fe/552/score',
  'http://localhost:3000/api/asset/0x4b3406a41399c7fd2ba65cbc93697ad9e7ea61e5/5542/score',
  'http://localhost:3000/api/asset/0x521f9c7505005cfa19a8e5786a9c3c9c9f5e6f42/3900/score',
  'http://localhost:3000/api/asset/0xaa20f900e24ca7ed897c44d92012158f436ef791/5918/score',
  'http://localhost:3000/api/asset/0xa3aee8bce55beea1951ef834b99f3ac60d1abeeb/9180/score',
  'http://localhost:3000/api/asset/0xbad6186e92002e312078b5a1dafd5ddf63d3f731/5931/score',
  'http://localhost:3000/api/asset/0x8943c7bac1914c9a7aba750bf2b6b09fd21037e0/6665/score',
  'http://localhost:3000/api/asset/0xe785e82358879f061bc3dcac6f0444462d4b5330/2184/score',
  'http://localhost:3000/api/asset/0xbd3531da5cf5857e7cfaa92426877b022e612cf8/854/score',
  'http://localhost:3000/api/asset/0xf8b0a49da21e6381f1cd3cf43445800abe852179/3932/score',
  'http://localhost:3000/api/asset/0x219b8ab790decc32444a6600971c7c3718252539/6111/score',
  'http://localhost:3000/api/asset/0x7bd29408f11d2bfc23c34f18275bbf23bb716bc7/10714/score',
  'http://localhost:3000/api/asset/0x86357a19e5537a8fba9a004e555713bc943a66c0/631/score',
  'http://localhost:3000/api/asset/0xccc441ac31f02cd96c153db6fd5fe0a2f4e6a68d/5960/score',
  'http://localhost:3000/api/asset/0x7ea3cca10668b8346aec0bf1844a49e995527c8b/13714/score',
  'http://localhost:3000/api/asset/0xb932a70a57673d89f4acffbe830e8ed7f75fb9e0/24834/score',
  'http://localhost:3000/api/asset/0xad9fd7cb4fc7a0fbce08d64068f60cbde22ed34c/6683/score',
  'http://localhost:3000/api/asset/matic/0x5f6ceaad29038435a764b59d716717500135a609/score/1005',
  'http://localhost:3000/api/asset/0x3a5051566b2241285be871f650c445a88a970edd/7149/score',
  'http://localhost:3000/api/asset/0xe6ef513f7429d92cb54ebd4c14026aeb90849a78/13430/score',
  'http://localhost:3000/api/asset/0x9aa03df95b6d3c6edfb53c09a4a8473d0d642d32/6396/score',
  'http://localhost:3000/api/asset/0x10064373e248bc7253653ca05df73cf226202956/8193/score',
  'http://localhost:3000/api/asset/0xc3f733ca98e0dad0386979eb96fb1722a1a05e69/8867/score',
  'http://localhost:3000/api/asset/0xff9c1b15b16263c61d017ee9f65c50e4ae0113d7/2774/score',
  'http://localhost:3000/api/asset/0x7cba74d0b16c8e18a9e48d3b7404d7739bb24f23/9072/score',
  'http://localhost:3000/api/asset/0xdaa5f6cd0d1ae382a67e8a9b1ddff08685e443bc/969/score',
  'http://localhost:3000/api/asset/0x3fe1a4c1481c8351e91b64d5c398b159de07cbc5/3899/score',
  'http://localhost:3000/api/asset/matic/0xa5f1ea7df861952863df2e8d1312f7305dabf215/score/134467',
  'http://localhost:3000/api/asset/0x4f89cd0cae1e54d98db6a80150a824a533502eea/8506/score',
  'http://localhost:3000/api/asset/0x2acab3dea77832c09420663b0e1cb386031ba17b/1775/score',
  'http://localhost:3000/api/asset/0xaadc2d4261199ce24a4b0a57370c4fcf43bb60aa/7303/score',
  'http://localhost:3000/api/asset/0x57fbb364041d860995ed610579d70727ac51e470/5824/score',
  'http://localhost:3000/api/asset/0x099689220846644f87d1137665cded7bf3422747/2402/score',
  'http://localhost:3000/api/asset/0x3bf2922f4520a8ba0c2efc3d2a1539678dad5e9d/4397/score',
  'http://localhost:3000/api/asset/0xc8bcbe0e8ae36d8f9238cd320ef6de88784b1734/4170/score',
  'http://localhost:3000/api/asset/0x3abedba3052845ce3f57818032bfa747cded3fca/4801/score',
  'http://localhost:3000/api/asset/0x30975acac70b5d774d6f756acd03a9b90cd4d4f5/6139/score',
  'http://localhost:3000/api/asset/0xbea8123277142de42571f1fac045225a1d347977/1458/score',
  'http://localhost:3000/api/asset/0x99654fd49c0e51b8029d2ba7de5b99734ab7afec/540/score',
  'http://localhost:3000/api/asset/0x059edd72cd353df5106d2b9cc5ab83a52287ac3a/3261/score',
  'http://localhost:3000/api/asset/0x986aea67c7d6a15036e18678065eb663fc5be883/3628/score',
  'http://localhost:3000/api/asset/0x73883743dd9894bd2d43e975465b50df8d3af3b2/3579/score',
  'http://localhost:3000/api/asset/0x03f5cee0d698c24a42a396ec6bdaee014057d4c8/7697/score',
  'http://localhost:3000/api/asset/0x9759226b2f8ddeff81583e244ef3bd13aaa7e4a1/8786/score',
  'http://localhost:3000/api/asset/0xba30e5f9bb24caa003e9f2f0497ad287fdf95623/2426/score',
  'http://localhost:3000/api/asset/0xecdd2f733bd20e56865750ebce33f17da0bee461/2/score',
  'http://localhost:3000/api/asset/0xc2c747e0f7004f9e8817db2ca4997657a7746928/14234/score',
  'http://localhost:3000/api/asset/0x30cdac3871c41a63767247c8d1a2de59f5714e78/4298/score',
  'http://localhost:3000/api/asset/0x2f102e69cbce4938cf7fb27adb40fad097a13668/5359/score',
  'http://localhost:3000/api/asset/0xfcb1315c4273954f74cb16d5b663dbf479eec62e/7578/score',
  'http://localhost:3000/api/asset/0x1d20a51f088492a0f1c57f047a9e30c9ab5c07ea/9407/score',
  'http://localhost:3000/api/asset/0x6dc6001535e15b9def7b0f6a20a2111dfa9454e2/2712/score',
  'http://localhost:3000/api/asset/0x5754f44bc96f9f0fe1a568253452a3f40f5e9f59/1993/score',
  'http://localhost:3000/api/asset/0x7d9d3659dcfbea08a87777c52020bc672deece13/693/score',
  'http://localhost:3000/api/asset/0xef0182dc0574cd5874494a120750fd222fdb909a/7617/score',
  'http://localhost:3000/api/asset/0x3702f4c46785bbd947d59a2516ac1ea30f2babf2/7506/score',
  'http://localhost:3000/api/asset/0xedb61f74b0d09b2558f1eeb79b247c1f363ae452/1118/score',
  'http://localhost:3000/api/asset/0x960b7a6bcd451c9968473f7bbfd9be826efd549a/6290/score',
  'http://localhost:3000/api/asset/klaytn/0x4007cb1fb9d1158add29cf5d88568dd44a1f516e/score/6987',
  'http://localhost:3000/api/asset/0x201675fbfaaac3a51371e4c31ff73ac14cee2a5a/1922/score',
  'http://localhost:3000/api/asset/0x492d7c407d78d170af70ce53578a4ec839da0ebd/363/score',
  'http://localhost:3000/api/asset/0x026224a2940bfe258d0dbe947919b62fe321f042/1772/score',
  'http://localhost:3000/api/asset/0xd49eccf40689095ad9e8334d8407f037e2cf5e42/7925/score',
  'http://localhost:3000/api/asset/0xf4b6040a4b1b30f1d1691699a8f3bf957b03e463/6558/score',
  'http://localhost:3000/api/asset/0xa08126f5e1ed91a635987071e6ff5eb2aeb67c48/9492/score',
  'http://localhost:3000/api/asset/0x79986af15539de2db9a5086382daeda917a9cf0c/5941/score',
  'http://localhost:3000/api/asset/0x8399d6351fd0ddb33f77bfc627e3264d74500d22/2500/score',
  'http://localhost:3000/api/asset/0x42069abfe407c60cf4ae4112bedead391dba1cdb/3673/score',
  'http://localhost:3000/api/asset/0xe3435edbf54b5126e817363900234adfee5b3cee/9477/score',
  'http://localhost:3000/api/asset/0x454cbc099079dc38b145e37e982e524af3279c44/8193/score',
  'http://localhost:3000/api/asset/0xa3b7cee4e082183e69a03fc03476f28b12c545a7/4366/score',
  'http://localhost:3000/api/asset/0x518ba36f1ca6dfe3bb1b098b8dd0444030e79d9f/6666/score',
  'http://localhost:3000/api/asset/0xbe6e3669464e7db1e1528212f0bff5039461cb82/236/score',
  'http://localhost:3000/api/asset/0x9c57d0278199c931cf149cc769f37bb7847091e7/7866/score',
  'http://localhost:3000/api/asset/0x05a46f1e545526fb803ff974c790acea34d1f2d6/4931/score',
  'http://localhost:3000/api/asset/0xd49eccf40689095ad9e8334d8407f037e2cf5e42/7925/score',
  'http://localhost:3000/api/asset/0x8a1bbef259b00ced668a8c69e50d92619c672176/6688/score',
  'http://localhost:3000/api/asset/0xa406489360a47af2c74fc1004316a64e469646a5/9691/score',
  'http://localhost:3000/api/asset/0x8cd8155e1af6ad31dd9eec2ced37e04145acfcb3/1129/score',]
const main = async () => {
  for (const url of assets) {
    try {
      await axios.get(url)
      console.log('completed: ', url);
    } catch (error) {
      console.log('err: ', url);
    }
  }
}

const run = async () => {
  let res = await main();
  console.log(res);
}

run();

export default main;
