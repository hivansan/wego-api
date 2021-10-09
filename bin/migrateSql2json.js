#!/usr/bin/env node
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const commandLineArgs = require('command-line-args');
const options = commandLineArgs([{ name: 'table', type: String }]);

const cammel2snake = (object, key) => {
  const cammelKey = key
    .split(/(?=[A-Z])/g)
    .reduce((acc, word) => (acc ? `${acc}_${word}` : word), '')
    .toLowerCase();
  if (cammelKey === key) return;
  object[cammelKey] = object[key];
  delete object[key];
};

const saveTable = async (tableName) => {
  let table = await prisma[tableName].findMany();
  // table.forEach((x) => {
  //   for (const key in x) cammel2snake(x, key);
  // });
  const body = { [`${tableName}s`]: table };
  console.log(`Saving ${table.length} lines on file ${tableName}_mysql.json`);
  await new Promise((res) => fs.writeFile(`${tableName}_mysql.json`, JSON.stringify(body), 'utf8', res));
};

if (!options.table) {
  console.log('please provide table');
  process.exit(1);
}

saveTable(options.table);
