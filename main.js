//Includes
var http=require("http");
var mongoose = require('mongoose');
//Global Varibles
var db = mongoose.connect('mongodb://localhost/local');  //local db has oplogs collection
var mongoData=[];
// Read oplog from MongoDB
mongoose.connection.on('open', function callback() {
    var collection = mongoose.connection.db.collection('oplog.rs'); //or any capped collection    
	var stream = collection.find({}, {
        tailable: true,
        awaitdata: true,
        numberOfRetries: Number.MAX_VALUE
    }).stream(); 		
	stream.on('data', function(val) {		
		if(val.ns=='test.testCollection')
		{		
			mongoData.push(val);		 
		}
	});	
	
	stream.on('error', function(val) {
		console.log('Error: %j', val);		
	});	

	stream.on('end', function(){
		console.log('End of stream');		
	});	
});	
var server=http.createServer(function(request,response){
		if(mongoData.length!=0)
		{
			var completeData='';
			for(var i=0;i<mongoData.length;i++)
			{
				var data={"collection":mongoData[i].ns,
						  "data":mongoData[i].o,
						  "operation":mongoData[i].op}
				completeData+= JSON.stringify(data)+"\n\n\n";
			}
			response.end(completeData);
		}
		else
		{
			response.end('No Updates');
		}		
		mongoData=[];
});
server.listen(9090);
console.log("Server Is Running on port 9090");
