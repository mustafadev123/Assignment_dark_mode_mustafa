const express = require("express"); //imports the express module
const app = express(); //creates the express application object
app.use(express.static("public"));//register public as the directory for static files

const mysql = require("mysql2"); //uses new mysql package
const conn = mysql.createConnection(
{host:"localhost",user:"root",password:"",database:"pantherwell",port:3306});

conn.connect(function(err)
{
	if(err)
		console.log("Couldnt connect to MySQL",err);
	else
	{
		console.log("Database connection established");
		//show the rows in the users table to prove the connection works
		conn.query("SELECT * FROM users", function(err, rows)
		{
			if(err)
				console.log("Query failed",err);
			else
				console.table(rows);
		});
	}
});
app.listen(process.env.PORT || 3000); //uses port 3000 unless PORT is set
