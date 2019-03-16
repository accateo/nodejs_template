/*
 * Database manager .
 * 
 * 
 * */
var sqlite3 = require('sqlite3').verbose(); 
var file = "testDb";  
var db = new sqlite3.Database(file); 


function DBMng() {
	
	downloadDataFromDb();

	
}

function downloadDataFromDb(){

   
  	
	db.all("SELECT * FROM test ",function(err,rows){
            rows.forEach(function (row) {  
	            console.log("row: "+row.test);
        });
        
	});
	


}

exports.DBMng = DBMng;