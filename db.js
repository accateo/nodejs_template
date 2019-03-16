var sqlite3 = require('sqlite3').verbose();  
var db = new sqlite3.Database('testDb');

db.serialize(function() {  
  db.run("CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY AUTOINCREMENT, test TEXT, note TEXT)");  
  
  var stmt = db.prepare("INSERT INTO test VALUES (?,?,?)");  
  //insert new data
  stmt.run(1, "test", "");
  
    
  stmt.finalize();  


   
});  

  
db.close();   