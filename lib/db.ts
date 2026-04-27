// import { Db } from '../types';
// import * as firebaseDB from './dbs/firebase';
import * as memoryDB from './dbs/memory';
// import * as sqlDB from './dbs/mysql';

export default memoryDB;

// const { DB_TYPE } = process.env;

// console.log(`Using ${DB_TYPE} database`);

// let db: Db;

// switch (DB_TYPE) {
//     case 'firebase':
//         db = firebaseDB;
//         break;
//     case 'in-memory':
//     case 'memory':
//         db = memoryDB;
//         break;
//     case 'mysql':
//         db = sqlDB;
//         break;
//     default:
//         db = firebaseDB;
//         break;
// }

// export default db;
