var sqlite3 = require('sqlite3');

var db = new sqlite3.Database('users.sql3');
db.run("CREATE TABLE users (username TEXT, password TEXT)");
