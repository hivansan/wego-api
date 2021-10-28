import { expect } from 'chai';

import * as Stats from '../lib/stats';

describe('Stats', () => {

  describe('rank()', () => {
    const items = [{ val: 5 }, { val: 4 }, { val: 5 }, { val: 1 }, { val: 2 }, { val: 1 }, { val: 3 }];
    const ranked = Stats.rank('val', 'rank', items);

    expect(ranked).to.deep.equal([
      { val: 1, rank: 1 },
      { val: 1, rank: 1 },
      { val: 2, rank: 2 },
      { val: 3, rank: 3 },
      { val: 4, rank: 4 },
      { val: 5, rank: 5 },
      { val: 5, rank: 5 }
    ]);
  });
});
