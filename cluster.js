const cluster = require('cluster');
const os = require('os');
const numServer = 1;
const argv = require('yargs').argv;

if (argv.port == undefined)                                                                                                                                                                           
{                                                                                                                                                                                                     
   argv.port = 8000;
   portnum = 8000;                                                                                                                                                                                    
}                                                                                                                                                                                                     
else                                                                                                                                                                                                  
{                                                                                                                                                                                                     
   portnum = argv.port;                                                                                                                                                                               
}                                                                                                                                                                                                     
                                                                                                                                                                                                      
if (argv.bonus != undefined)                                                                                                                                                                          
{                                                                                                                                                                                                     
   if (isNaN(argv.bonus))                                                                                                                                                                             
   {                                                                                                                                                                                                  
      bonus = 0;                                                                                                                                                                                      
   }                                                                                                                                                                                                  
   else                                                                                                                                                                                               
   {                                                                                                                                                                                                  
      bonus = parseInt(argv.bonus);                                                                                                                                                                   
   }                                                                                                                                                                                                  
}                                                                                                                                                                                                     

if (cluster.isMaster) 
{
   const cpus = os.cpus().length;
   var count = 0;
   var clientCount = 0;
   for (let i = 0; i < numServer; i++) 
   {
      console.log(`Forking for ${cpus} CPUs`);
      var worker = cluster.fork();
      count = 0;
      worker.on('message', function(msg) 
      {
         if (typeof msg.users != 'undefined')
         {
            console.log ("CLUSTER: Count is :" + count + " ,got count:" + parseInt(msg.users) + ",clientCount:" + clientCount);
            count = parseInt(count) + parseInt(msg.users);
            clientCount = clientCount + 1;
         }
      });
   }
  
   function eachWorker(callback) 
   {
      for (const id in cluster.workers) 
      {
         callback(cluster.workers[id]);
      }
   }

   const updateWorkers = () => {
     eachWorker(worker => {
       if (clientCount == numServer)
       {
          worker.send({'count':count});
       }
     });
     count = 0;
     clientCount = 0;
   };
   
   updateWorkers();
   setInterval(updateWorkers, 10000);

   cluster.on('exit', (worker, code, signal) => 
   {
      if (code !== 0 && !worker.exitedAfterDisconnect) 
      {
         console.log(`Worker ${worker.id} crashed. ` +
            'Starting a new worker...');
         cluster.fork();
      }
   });
} 
else 
{
   require("./server");
}

