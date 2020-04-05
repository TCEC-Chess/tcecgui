/* Notes *
/*

   Replay
   -------
   1. When a game is replayed use the following option

      node cluster.js --port 8080 --crossgames 31  --resume

   Fix jsons
   ---------
   1. After game is replayed to fix the json use

      node cluster.js --port 8080

   Fix onge game pgn
   --------------------
   1. to fix a given game or set of games use
      
      node server.js --port 0 --games x,y

   Fix till game x
   -----------------
      node server.js --port 0 --crossgames 29

*/

var https = require("https");
var http = require("http");
var url = require('url');
var fs = require('fs');
var io = require('socket.io')();
var express = require('express');
var app = express();
var path = require('path');
const md5 = require('md5');
const axios = require('axios');
var chokidar = require('chokidar');
var _ = require('lodash');
var lastPgnTime = Date.now();
const Tail = require('nodejs-tail');
const pid = process.pid;
const exec = require('child_process').exec;
const argv = require('yargs').argv;
var deepEqual = require('deep-equal');
var globalid = 0;
var liveeval = 'data.json';
var livejson = 'live.json';
var pgnDir = '/var/www/json/archive/'
var json = '/var/www/json/archive/';
var archroot = '/var/www/archive.tcec-chess.com/';
var gameJson = 'gamelist.json';
var singlePerl = archroot + 'single.pl';
var prevpgn = 0;
var prevData = 0;
var prevliveData = 0;
var prevevalData = 0;
var prevliveData1 = 0;
var prevevalData1 = 0;
var prevCrossData = 0;
var prevSchedData = 0;
var delta = {};
var inprogress = 0;
var lineArray = [];
var lineChanged = 0;
let watcherFast = 0;
var ctable = 'crosstable.json';
let watcherSlow;
var count = 0;
var socket = 0;
var totalCount = 0;
var socketArray = [];
var userCountFactor = 1;
/* Deltapgn: Configure this to less value for less data */
var numMovesToSend = 2;
var liveChartInterval = setInterval(function() { sendlines(); }, 3000);
let retPgn = 0;
const shlib = require("./lib.js");
let jsonMenuData = 0;
let frc = 0;

function setArgs()
{
   if (argv.port == undefined)
   {
      portnum = 8000;
   }
   else
   {
      portnum = argv.port;
   }

   if (argv.finish || argv.addentry)
   {
      portnum = 0;
   }

   if (argv.finish)
   {
      jsonMenuData = JSON.parse(fs.readFileSync(gameJson, "utf-8"));
      var upJson = updateJSON();
      console.log ("upJson is :" + upJson.newaddedid);
      globalid = upJson.newaddedid;
   }
   else
   {
      globalid = 'current';
   }

   if (argv.id)
   {
      globalid = argv.id;
   }

   if (argv.frc)
   {
      frc = 1;
   }

   retPgn = checkLatestArchive();
   console.log ("End of setArgs: port is :" + portnum);
}

function startServer()
{
   if (!portnum)
   {
      return;
   }

   /* Encryption keys */
   
   var options = 
   {
      key: fs.readFileSync('/etc/letsencrypt/live/tcec-chess.com/privkey.pem'),
      cert: fs.readFileSync('/etc/letsencrypt/live/tcec-chess.com/fullchain.pem')
   };

   /*var server = https.createServer(options, app).listen(parseInt(portnum), function() 
   {
      console.log('Express server listening on port ' + portnum);
   });*/
   var server = http.createServer(app).listen(parseInt(portnum), function() 
   {
      console.log('Express server listening on port ' + portnum);
   });

   io.attach(server, {
      pingInterval: 25000,
      pingTimeout: 5000
   });

   app.get('/api/gameState', function (req, res) 
   {
      console.log('api gameState request');
      var currentFen = '';
      var liveData = fs.readFileSync('live.json');
      var liveJsonData = JSON.parse(liveData);

      if (liveJsonData.Moves.length > 0) 
      {
         currentFen = liveJsonData.Moves[(liveJsonData.Moves.length - 1)].fen;
      }

      var response = 
      {
         'White': liveJsonData.Headers.White,
         'Black': liveJsonData.Headers.Black,
         'CurrentPosition': currentFen,
         'Result': liveJsonData.Headers.Result,
         'Event': liveJsonData.Headers.Event
      }
      res.setHeader('Content-Type', 'application/json');
      res.status(200).send(JSON.stringify(response))
   });

   app.get('/api/currentPosition', function (req, res) 
   {
      console.log('api currentPosition request');
      var currentFen = 'No game in progress';
      var liveData = fs.readFileSync('live.json');
      var liveJsonData = JSON.parse(liveData);

      if (liveJsonData.Moves.length > 0) {
         currentFen = liveJsonData.Moves[(liveJsonData.Moves.length - 1)].fen;
      }

      res.setHeader('Content-Type', 'application/json');
      res.status(200).send(currentFen);
   });
}

function startWatcherSlow()
{
   watcherSlow = chokidar.watch(ctable, {
      persistent: true,
      ignoreInitial: false,
      followSymlinks: true,
      disableGlobbing: false,
      usePolling: true,
      interval: 1000,
      binaryInterval: 1000,
      alwaysStat: false,
      depth: 3,
   });
   watcherSlow.add('schedule.json');
   watcherSlow.add('banner.txt');
   watcherSlow.add('gamelist.json');
   watcherSlow.add('tournament.json');
   watcherSlow.add('enginerating.json');
   watcherSlow.add('liveengineeval.json');

   if (!retPgn.bonus)
   {
      watcherSlow.add('crash.json');
   }
}

function startWatcherFast()
{
   watcherFast = 
   chokidar.watch(livejson, {
      persistent: true,
      ignoreInitial: false,
      followSymlinks: true,
      disableGlobbing: false,
      usePolling: true,
      interval: 10,
      binaryInterval: 100,
      alwaysStat: false,
      depth: 3,
      atomic: 100
   });

   if (!retPgn.bonus)
   {
      watcherFast.add('data1.json');
      watcherFast.add('liveeval.json');
      watcherFast.add('liveeval1.json');
      watcherFast.add(liveeval);
   }

   if (retPgn.cup)
   {
      watcherFast.add('Eventcrosstable.json');
   }
}

function arrayRemove(arr, value) 
{
   return arr.filter(function(ele){
      return ele != value;
   });
}

function showDuplicates(names)
{
   var uniq = names
   .map((name) => {
      return {count: 1, name: name}
   })
   .reduce((a, b) => {
      a[b.name] = (a[b.name] || 0) + b.count
      return a
   }, {})

   var duplicates = Object.keys(uniq).filter((a) => uniq[a] > 1)

   console.log(duplicates);
}

function userCount()
{
   var userCountFinal = parseInt(socketArray.length);

   if (userCountFinal < totalCount)
   {
      userCountFinal = totalCount;
   }
   else if (totalCount)
   {
      userCountFinal = totalCount;
   }
   return (parseInt(userCountFinal * userCountFactor));
}

function userCountActual()
{
   return (parseInt(socketArray.length));
}

function checkLatestArchive()
{
   if (!globalid)
   {
      return;
   }

   if (retPgn)
   {
      return retPgn;
   }

   jsonMenuData = JSON.parse(fs.readFileSync(gameJson, "utf-8"));
   retPgn = shlib.getPGN(globalid, jsonMenuData);
   console.log ("retPgn: " + JSON.stringify(retPgn, null, '\t'));

   if (retPgn.found == 0)
   {
      return 0;
   }

   retPgn.pgnFile = pgnDir + retPgn.pgnfile;

   return (retPgn);
}

function touchFile(fileName)
{
   fs.appendFileSync(fileName, '');
}

function addLatestArch()
{
   if (globalid)
   {
      watcherSlow.unwatch(retPgn.pgnFile);
      retPgn = checkLatestArchive();
      if (retPgn)
      {
         touchFile(retPgn.pgnFile);
         console.log ("Monitor pgn file: " + retPgn.pgnFile);
         watcherSlow.add(retPgn.pgnFile);
      }
      else
      {
         console.log ("No current file to monitor");
      }
   }
}

function sendUsers()
{
   setTimeout(function() { broadCastUsers(); }, 5000);
}

function broadCastUsers()
{
   io.local.emit('users', {'count': userCount()});
}

function broadCastData(socket, message, file, currData, prevData)
{
   if (deepEqual(currData, prevData))
   {
      return;
   }
   io.local.emit(message, currData);
}

function isJsonDiff(currData, prevData)
{
   if (deepEqual(currData, prevData))
   {
      return 0;
   }
   else
   {
      return 1;
   }
}

function getDeltaPgn(pgnX)
{
   var countPgn = 0;
   var maxKey = pgnX.Moves.length;
   pgnX.Users = userCount();
   pgnX.Round = pgnX.Headers.Round * 100;
   pgnX.numMovesToSend = numMovesToSend;

   if (prevData && isJsonDiff(prevData.Headers, pgnX.Headers))
   {
      pgnX.gameChanged = 1;
      if (pgnX.Moves)
      {
         pgnX.lastMoveLoaded = pgnX.Moves.length;
      }
      else
      {
         pgnX.lastMoveLoaded = 0;
      }
      return pgnX;
   }
   pgnX.gameChanged = 0;

   if (pgnX && pgnX.Moves && (pgnX.Moves.length - numMovesToSend) > 0) {
      pgnX.Moves.splice(0, pgnX.Moves.length - numMovesToSend);
      pgnX.lastMoveLoaded = maxKey - numMovesToSend;
   }
   else {
      pgnX.lastMoveLoaded = maxKey;
   }
   pgnX.totalSent = numMovesToSend > maxKey ? maxKey : numMovesToSend;

   console.log ("Setting pgn.lastMoveLoaded to " + pgnX.lastMoveLoaded  + " ,total keys:" + maxKey + " ,totalSent:" + pgnX.totalSent);
   return pgnX;
}

function sendArrayRoom(array, room, count)
{
   var localArray = array;

   if (localArray.length)
   {
      if (localArray.length - count > 0)
      {
         localArray.splice(0, localArray.length - count);
      }
      if (localArray.length)
      {
         io.sockets.in(room).emit('htmlread', {'room': room, 'data': localArray.join('\n')});
      }
   }
}

function sendlines()
{
   if (lineChanged)
   {
      var room5Array = lineArray;
      var room10Array = lineArray;

      sendArrayRoom(lineArray, 'room5', 5);
      sendArrayRoom(lineArray, 'livelog', 5);
      sendArrayRoom(lineArray, 'room10', 10);
      sendArrayRoom(lineArray, 'roomall', 1000);

      lineArray = [];
      lineChanged = 0;
   }
}

function exitNode()
{
   if (!portnum)
   {
      process.exit();
   }
}

function runPerlArchive()
{
   if (inprogress == 0)
   {
      inprogress = 1;
      var perlrun = "perl " + singlePerl;

      if (retPgn.eventtag != undefined) 
      {
         perlrun += " --eve " + retPgn.eventtag;
      }

      if (retPgn.cup)
      {
         perlrun += " --cup " + retPgn.cup;
      }

      perlrun += " --ful " + retPgn.download + " --tag " + retPgn.abb + ' --loc ' + json + retPgn.abb;

      if (retPgn.prevpgnlist)
      {
         perlrun = perlrun + " --prevpgn " + retPgn.prevpgnlist;
      }

      if (argv.games)
      {
         perlrun = perlrun + " --games " + argv.games;
      }

      perlrun = perlrun + " --pwd " + __dirname;
      if (argv.crossgames)
      {
         perlrun = perlrun + " --crossgames " + argv.crossgames;
      }

      if (argv.resume)
      {
         perlrun = perlrun + " --resume 1";
      }

      if (argv.frc)
      {
         perlrun = perlrun + " --frc";
      }

      console.log ("Running perl file:" + perlrun);
      exec(perlrun, function(err, stdout, stderr) {
         inprogress = 0;
         setTimeout(function() {
            io.emit('refreshsched', {'count': 1});
         }, 15000);
         setTimeout(function() {
            exitNode();
         }, 15000);
         console.log (stderr);
         console.log (stdout);
      });
   }
   else
   {
      console.log ("Already another in progress");
   }
}

function makeLink()
{
   if (!retPgn.bonus)
   {
      var makeLink = '/scratch/tcec/Commonscripts/Divlink/makelnk.sh';

      exec(makeLink + ' ' + retPgn.abb, function callback(error, stdout, stderr){
         console.log ("Error is :" + stderr);
         console.log ("Output is :" + stdout);
      });
   }
}

function addLiveTail()
{
   const tail = new Tail('live.log', {
      persistent: true,
      ignoreInitial: false,
      followSymlinks: true,
      disableGlobbing: false,
      usePolling: true,
      interval: 1000,
      binaryInterval: 5000,
      alwaysStat: false,
      depth: 1,
      atomic: 60000
      //atomic: true // or a custom 'atomicity delay', in milliseconds (default 100)
   });

   tail.on('line', (linedata) => {
      var line = linedata;
      line = line.replace(/>/g, '');
      line = line.replace(/</g, '');
      lineArray.push(line);
      lineChanged = 1;
      //console.log ("line:" + lineArray);
   });

   tail.watch();

   exec('./live_parse_cutechess_cli_log.py live.log', function(err, stdout, stderr) {
      console.log (stderr);
      console.log (stdout);
   });
}

function Misc()
{
   io.sockets.on ('connection', function(socket)
   {
      var socketId = socket.id;
      count = socketArray.length;

      if (socketArray.indexOf(socketId) === -1)
      {
         socketArray.push(socketId);
      }

      socket.on('room', function(room) 
      {
         if (room == 'room5')
         {
            socket.join('room5');
         }
         if (room == 'room10')
         {
            socket.join('room10');
         }
         if (room == 'roomall')
         {
            socket.join('roomall');
         }
      });

      socket.on('noroom', function(room) 
      {
         socket.leave('room5');
         socket.leave('room10');
         socket.leave('roomall');
      });

      socket.on('disconnect', function()
      {
         socketArray = arrayRemove(socketArray, socketId);
      });

      socket.on('getusers', function(data)
      {
         socket.emit('users', {'count': userCount()});
      });

      socket.on('refreshdata', function(data)
      {
         if (delta)
         {
            delta.refresh = 1;
            delta.Users = userCount();
            socket.emit('pgn', delta);
            delta.refresh = 0;
            //console.log ("Sent delta pgn data to connected socket:" + JSON.stringify(delta).length + ",changed" + clientIp + ", from serverXXXX:" + pid);
         }
         else if (prevData)
         {
            prevData.refresh = 1;
            prevData.Users = userCount();
            socket.emit('pgn', prevData);
            prevData.refresh = 0;
            //console.log ("Sent full pgn data to connected socket:" + JSON.stringify(delta).length + ",changed" + clientIp + ", from serverXXXX:" + pid);
         }
         console.log('XXXXXX: req came' + lastPgnTime);
      });

   });

   watcherFast.on('change', (path, stats) => 
   {
      var content = fs.readFileSync(path, "utf8");
      try
      {
         var data = JSON.parse(content);
         if (path.match(/data.json/))
         {
            broadCastData(socket, 'liveeval', path, data, prevliveData);
            prevliveData = data;
         }
         if (path.match(/data1.json/))
         {
            broadCastData(socket, 'liveeval1', path, data, prevliveData1);
            prevliveData1 = data;
         }
         if (path.match(/liveeval.json/))
         {
            broadCastData(socket, 'livechart', path, data, prevevalData);
            console.log ("Sending /liveeval.json/");
            prevevalData = data;
         }
         if (path.match(/liveeval1.json/))
         {
            broadCastData(socket, 'livechart1', path, data, prevevalData1);
            prevevalData1 = data;
         }
         if (path.match(/Eventcrosstable.json/))
         {
            console.log ("Evant table changed");
            io.local.emit('bracket', data);
         }
         if (path.match(/live.json/))
         {
            delta = getDeltaPgn(data, prevData);
            console.log ("json changed, ply is :" + Math.round((delta.numMovesToSend + delta.lastMoveLoaded)/2));
            io.emit('pgn', data);
            lastPgnTime = Date.now();
            prevData = data;
         }
      }
      catch (error)
      {
         console.log ("error: " + error);
         return;
      }
   });

   watcherFast
   .on('add', path => console.log(`File ${path} has been added`))
   .on('unlink', path => { console.log(`File ${path} has been removed`) ;
      if (path.match(/liveeval.*/))
      {
         console.log ("Trying to add path:" + path);
         setTimeout(function() { watcherFast.add(path)}, 30000);
         setTimeout(function() { watcherFast.add(path)}, 60000);
         setTimeout(function() { watcherFast.add(path)}, 90000);
         setTimeout(function() { watcherFast.add(path)}, 130000);
         watcherFast.add(path);
      }
   })
   .on('error', error => console.log(`Watcher error: ${error}`));

   watcherSlow.on('change', (path, stats) => 
   {
      console.log ("slow path changed:" + path);
      if (globalid && (path == retPgn.pgnFile))
      {
         runPerlArchive();
      }
      if (globalid && path.match(/gamelist/))
      {
         retPgn = 0;
         addLatestArch();
         runPerlArchive();
         if (!retPgn.bonus)
         {
            makeLink();
         }
      }
      if ((path != retPgn.pgnFile) && (!path.match(/gamelist/)))
      {
         var content = fs.readFileSync(path, "utf8");
         try
         {
            var data = JSON.parse(content);
            if (path.match(/crosstable/))
            {
               console.log ("Sendnig crosstable data:");
               io.local.emit('crosstable', data);
            }
            if (path.match(/schedule/))
            {
               broadCastData(socket, 'schedule', path, data, prevSchedData);
               prevSchedData = data;
            }
            if (path.match(/tournament/))
            {
               io.local.emit('tournament', data);
            }
            if (path.match(/enginerating/))
            {
               io.local.emit('enginerating', data);
               exec("cp /var/www/json/shared/enginerating.json /var/www/json/archive/" + retPgn.abb + "_Enginerating.egjson", function(err, stdout, stderr) {
                  console.log ("Doing it:" + stdout + stderr);
               });
            }
            if (path.match(/banner/))
            {
               io.local.emit('banner', data);
            }
            if (path.match(/crash/))
            {
               io.local.emit('crash', data);
            }
            if (path.match(/liveengineeval/))
            {
               io.local.emit('updeng', data);
               console.log ("Sending liveengineeval for ply:" + data.plynum);
            }
         }
         catch (error)
         {
            console.log ("error: " + error);
            return;
         }
      }
   });

   process.on('message', function(msg)
   {
      console.log('Worker ' + process.pid + ' received message from master.', JSON.stringify(msg));
      totalCount = parseInt(msg.count);
   });
}

function updateJSON()
{
   var filename = '';
   const localJSON = jsonMenuData;

   if (argv.addentry)
   {
      filename = argv.addentry;
   }
   else if (argv.finish)
   {
      filename = argv.finish;
   }
   else
   {
      console.log ("Neither --addentry nor --finish was provided");
      process.exit(1);
   }

   var updJSON = shlib.getNewIdStruc(filename, localJSON);
   var getUniq = shlib.getRandomSalt(gameJson);
   if (argv.addentry)
   {
      updJSON.newaddedid = undefined;
      console.log ("Please verify file " + getUniq + " and run without --addentry option ");
      fs.writeFileSync(getUniq,  JSON.stringify(jsonMenuData, null, "   "));
      process.exit(1);
   }
   return updJSON;
}

function Main()
{
   setArgs();
   if (!portnum && argv.addentry)
   {
      updateJSON();
   }
   if (portnum)
   {
      startServer();
      startWatcherFast();
      startWatcherSlow();
      addLatestArch ();
   }
   runPerlArchive();
   if (portnum)
   {
      makeLink();
      addLiveTail();
      Misc();
   }
   else
   {
      if (!inprogress)
      {
         process.exit();
      }
   }
}

Main();

