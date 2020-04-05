const fs = require("fs");
const shlib = require("./lib.js");
const argv = require('yargs').argv;

// COMMENTED!!
let pgnPath = '/var/www/json/archive/';
let filename = pgnPath + argv.singletag;
let seasonFileName = argv.singletag + '.pgn';
let gamesReqd = 0;

if (argv.tag)
{
   filename = argv.tag;
}

if (argv.filename)
{
   seasonFileName = argv.filename;
}

if (argv.crossgames != undefined)
{
   gamesReqd = argv.crossgames;
}

let seasonFileNameFull = pgnPath + seasonFileName;

const pgn = fs.readFileSync(seasonFileNameFull, "utf-8");
var schedName = filename + '_' + 'Schedule.sjson';

var res = shlib.returnPGN(pgn, false, gamesReqd);
var force = argv.force;

if (force == undefined || force == 'undefined')
{
   force = 0;
}

console.log ("Res lenght is :" + res.length);

if (force || !fs.existsSync(schedName))
{
   console.log ("Generating schedule file:" + schedName);
   const output_json = shlib.pgn2schedule(res);
   fs.writeFileSync(schedName, output_json);
}
