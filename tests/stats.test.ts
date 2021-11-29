import { describe } from 'mocha';
import { expect } from 'chai';

import * as Stats from '../lib/stats';

describe('Stats', () => {

  describe('rank()', () => {
    it('should rank items by value', () => {
      const items = [
        { id: 1, val: 5 },
        { id: 2, val: 4 },
        { id: 3, val: 5 },
        { id: 4, val: 1 },
        { id: 5, val: 2 },
        { id: 6, val: 1 },
        { id: 7, val: 3 }
      ];
      const ranked = Stats.rank('val', 'rank', false, items);

      expect(ranked).to.deep.equal([
        { id: 4, val: 1, rank: 1 },
        { id: 6, val: 1, rank: 1 },
        { id: 5, val: 2, rank: 3 },
        { id: 7, val: 3, rank: 4 },
        { id: 2, val: 4, rank: 5 },
        { id: 1, val: 5, rank: 6 },
        { id: 3, val: 5, rank: 6 }
      ]);
    });
  });
});
