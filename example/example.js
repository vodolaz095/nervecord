var nervecord = require('./index.js');

var g = nervecord.createGanglia();

g.on('task_done',function(taskId){
	console.log('task_done '+taskId);	
});
g.on('new_task',function(taskId){
	console.log('new_task '+taskId);	
});

var a = nervecord.createAppendage('zopa',function(jobId,payload,done){
	setTimeout(function(){
		console.log('>>===worker=====');
		console.log('Starting work on '+jobId);
		console.log('Job payload is ');
		console.log(payload);
		console.log('=====worker===<<');
		done(null,'OK');
	},500);
});

//*
console.log('creating task');
//g.createTask
//g.waitForTask
setTimeout(function(){
	g.createTaskAndWait('zopa',{'la':'la'},function(err,job){
		if(err) throw err;
		console.log('Job done?');
		console.log(job);
		process.exit(0);
	});
},500);	
//*/

//todo - locks for workers
//worker name or from hat
