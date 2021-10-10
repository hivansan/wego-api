export default {
  mysqlDs: {
    host: 'localhost',
    port: 3306,
    url: '',
    database: 'wego',
    password: 'toor123',
    name: 'mysqlDs',
    user: 'root',
    connector: 'mysql',
  },
  es: {
    name: 'es',
    connector: 'esv6',
    version: 7,
    index: 'assets',
    configuration: {
      node: 'http://localhost:9200',
      requestTimeout: 30000,
      pingTimeout: 3000,
      _auth: {
        username: 'test',
        password: 'test',
      },
      _ssl: {
        rejectUnauthorized: true,
      },
    },
    defaultSize: 30,
  },
};
