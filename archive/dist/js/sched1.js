const fs = require("fs");                                                                                                                                                                                                                     
const shlib = require("./lib.js");                                                                                                                                                                                                                     

var argvv = [];

process.argv.forEach(function (val, index, array) 
{
   console.log(index + ': ' + val);
   argvv [index] = val;
});

var filenameI = argvv [2];
var filename = argvv[3];

var pgnPath = '/var/www/json/archive/';
var filenameII = pgnPath + filenameI;
const pgn = fs.readFileSync(filenameII, "utf-8");
filename = filename + '_' + 'Schedule.sjson';
var res = shlib.returnPGN(pgn);
var force = argvv[4];

if (force == undefined || force == 'undefined')
{
   force = 0;
}

if (force || !fs.existsSync(filename))
{
   console.log ("Converting file:" + filename);
   const output_json = shlib.multiPgnToJson(res);
   //const output_json1 = shlib.multiPgnToJsonOld(pgn);
   fs.writeFileSync(filename,  output_json);
}
