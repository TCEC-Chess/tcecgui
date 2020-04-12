const fs = require("fs");                                                                                                                                                                                                                     
const shlib = require("./lib.js");                                                                                                                                                                                                                     

var argvv = [];

process.argv.forEach(function (val, index, array) 
{
   console.log(index + ': ' + val);
   argvv [index] = val;
});

var filenameI = argvv [2];
var newfileName = filenameI + ".old";
const jsondata = fs.readFileSync(filenameI, "utf-8");
fs.writeFileSync(filenameI, JSON.stringify(JSON.parse(jsondata)));
fs.writeFileSync(newfileName, jsondata);
