var fs = require('fs');
var path = require('path');
const argv = require('yargs').argv;

function checkJson(gameJson)
{
   var jsonStr = '';
   try {
      JSON.parse(fs.readFileSync(gameJson, "utf-8"));
      console.log ("File is good:");
   }
   catch (e) {
      console.log ("Error :" + e);
      }
}

checkJson(argv.name);
