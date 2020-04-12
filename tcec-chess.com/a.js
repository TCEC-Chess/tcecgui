var neek = require('neek');

var readable = 'live.json';
var writable = 'live.json1';

neek.unique(readable, writable, function(result){
  console.log(result);
});
