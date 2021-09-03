'use strict';

module.exports = (app) => {
  const ds = app.dataSources.mysqlDs;

  const lbTables = ['Asset', 'Collection', 'ContractAbi'];

  ds.autoupdate(lbTables, async (er) => {
    if (er) console.log('er aut -----', er);
    if (process.env.NODE_ENV != 'production') return;
    setTimeout(async () => {
      // await createDemoUsers();
    }, 1700);
    if (er) console.log('er aut -----', er);
  });
};
