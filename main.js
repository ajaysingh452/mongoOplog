
//Includes
var http=require("http");
var postal=require("postal");
var mongoose = require('mongoose');

//Global Varibles
var db = mongoose.connect('mongodb://localhost/local');  //local db has oplogs collection
var mongoData=[];
var channel=postal.channel('alertData');

// Read oplog from MongoDB
mongoose.connection.on('open', function callback() {
    var collection = mongoose.connection.db.collection('oplog.rs'); //or any capped collection
    
	var stream = collection.find({}, {
        tailable: true,
        awaitdata: true,
        numberOfRetries: Number.MAX_VALUE
    }).stream(); 	
	
	stream.on('data', function(val) {		
		if(val.ns=='Hero_Dev.UC_MST_User')
		{		
			mongoData.push(val);
		 // channel.publish("alert.add",{data:val});
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
	
	/*channel.subscribe("alert.add",function(res){
		console.log(res.ns);
	});	*/
	
		if(mongoData.length!=0)
		{
			var completeData='';
			for(var i=0;i<mongoData.length;i++)
			{
				var data={"collection":mongoData[i].ns,
						  "data":mongoData[i].o,
						  "operation":mongoData[i].op}
				//completeData+= mongoData[i].ns+"\n"+JSON.stringify(mongoData[i].o)+"\n"+mongoData[i].op+"\n\n\n";
				
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