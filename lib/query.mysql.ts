import mysql from 'mysql';
import { curry } from 'ramda';

// import * as datasources from '../server/datasources.json';
import datasources from '../server/datasources';

const { mysqlDs } = datasources;

/**
 * @param {String} - q : query
 * @param {String} - queryType: findOne | find | update | create
 */
export const run = (q: string): Promise<any> =>
  new Promise((resolve, reject) => {
    const con = mysql.createConnection(mysqlDs);
    con.connect((err) => {
      if (err) throw err;
      // q = 'select * from Collection;'
      con.query(q, (err, results, fields) => {
        con.end();
        if (results?.length) resolve(results);
        if (err) reject(err);
      });
    });
  });

export const findOne = async (q: string) => (await run(q))[0];
export const find = async (q: string) => await run(q);
