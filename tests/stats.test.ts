import { describe } from 'mocha';
import { expect } from 'chai';

import * as Stats from '../lib/stats';

describe('Stats', () => {

  describe('rank()', () => {
    it('should rank items by value', () => {
      const items = [
        {id: 1, val: 17.5},
        {id: 2, val: 92},
        {id: 3, val: 104},
        {id: 5, val: 237.87323654},
        {id: 6, val: 0.00075},
        {id: 8, val: 23},
        {id: 9, val: 543},
        {id: 12, val: 117.43882873},
        {id: 15, val: 75},
        {id: 16, val: 0.3333},
        {id: 19, val: 333},
        {id: 20, val: 23},
        {id: 22, val: 543},
        {id: 23, val: 117.43882873},
        {id: 25, val: 34},
        {id: 26, val: 23},
        {id: 27, val: 0.987645},
        {id: 28, val: 546},
        {id: 29, val: 234},
        {id: 30, val: 23}
      ];

      const rankedAsc = Stats.rank('val', 'rank', false, items);

      expect(rankedAsc).to.deep.equal([
        {id: 6, val: 0.00075, rank: 1},
        {id: 16, val: 0.3333, rank: 2},
        {id: 27, val: 0.987645, rank: 3},
        {id: 1, val: 17.5, rank: 4},
        {id: 8, val: 23, rank: 5},
        {id: 20, val: 23, rank: 5},
        {id: 26, val: 23, rank: 5},
        {id: 30, val: 23, rank: 5},
        {id: 25, val: 34, rank: 5},
        {id: 15, val: 75, rank: 10},
        {id: 2, val: 92, rank: 11},
        {id: 3, val: 104, rank: 12},
        {id: 12, val: 117.43882873, rank: 13},
        {id: 23, val: 117.43882873, rank: 13},
        {id: 29, val: 234, rank: 15},
        {id: 5, val: 237.87323654, rank: 16},
        {id: 19, val: 333, rank: 17},
        {id: 9, val: 543, rank: 18},
        {id: 22, val: 543, rank: 18},
        {id: 28, val: 546, rank: 20}
      ]);
    });
  });
});
