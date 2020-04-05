/* reused */
const argv = require('yargs').argv;
var _ = require('lodash');
/* reused */

function perror(errormsg)
{
   console.log ("Error:" + errormsg);
   process.exit();
}

function getPrevPGN(id, name, menuData)
{
   var found = 0;
   var data = menuData;
   var prevpgn = [];

   _.each(data.Seasons, function(value, key) {
      if (found)
      {
         return false;
      }
      _.each(value.sub, function(subvalue,subkey) {
         if ((parseInt(subvalue.dno) <= id) &&
            (value.seasonName == name))
         {
            var pgnStr = subvalue.abb + ".pgn";
            prevpgn.push(pgnStr);
         }
      });
   });

   var prevpgnStr = prevpgn.join();
   return prevpgnStr;
}

function getPGN(id, jsonMenuData)
{
   var found = 0;
   var localPgn = {};
   var data = jsonMenuData;
   localPgn.found = 0;
   localPgn.prevpgn = 0;
   localPgn.bonus = 0;
   localPgn.cup = 0;
   localPgn.eventtag = 0;

   _.each(data.Seasons, function(value, key) {
      if (found)
      {
         return false;
      }
      _.each(value.sub, function(subvalue,subkey) {
         if ((subvalue.id == id) ||
            (subvalue.idf == id))
         {
            localPgn.abb = subvalue.abb;
            localPgn.pgnfile = subvalue.abb + "_link.pgn";
            localPgn.scjson  = subvalue.abb + "_Schedule.json";
            localPgn.download = value.download;
            localPgn.eventtag = value.eventtag;
            localPgn.url = subvalue.url;
            localPgn.cup = value.cup;
            localPgn.bonus = subvalue.bonus;
            found = 1;
            localPgn.found = 1;
            if (localPgn.cup)
            {
               localPgn.prevpgnlist = getPrevPGN(parseInt(subvalue.dno), value.seasonName, jsonMenuData);
               console.log ("XXXXXXX: localPgn.prevpgn:" + localPgn.prevpgnlist);
            }
            //console.log ("STRXX:::::" + JSON.stringify(value.sub, null, '\t'));
            return false;
         }
      });
   });

   return localPgn;
}

function getUpdatedJSON(totalId, jsonMenuData)
{
   var found = 0;
   var data = jsonMenuData;
   let dno = 0;

   _.each(data.Seasons, function(value, key) {
      if (key.localeCompare(totalId.no))
      {
         return true;
      }

      console.log ("Found season:" + key);

      _.each(value.sub, function(subvalue,subkey) {
            dno = subvalue.dno;
         });
      dno = (parseInt(dno) + 4).toString();
      totalId.dno = dno.padStart(4, '0'); 
      value.sub.push (totalId);
      //console.log ("STRXX:::::" + " jsonkey: " + value + " ," + JSON.stringify(data, null, '\t'));
   });

   data.newaddedid = totalId.id;
   
   return data;
}

function getRandomSalt(fileName) 
{
   var timestamp = new Date().getTime().toString();
   var return_string = fileName + "_" + timestamp;

   return return_string;
}

function getNewIdStruc(stringMessage, jsonMenuData)
{
   var narray = stringMessage.split("_");
   let ncompName = narray[0];
   let nseasonName = narray[1];
   let nseasonNo = narray[2];
   let nDivision = narray[4];
   let nTag = narray[5];
   let nTagId = narray[6];
   if (nTagId == undefined)
   {
      nTagId = '';
   }
   let nTagMenu = narray.slice(5).join(' ');;
   var nIdStr = '';
   var totalId = {};
   var bonus = 0;

   if (ncompName.localeCompare("TCEC"))
   {
      perror("Name is not TCEC, given name is " + ncompName);
   }

   if (nseasonName.localeCompare("Season"))
   {
      perror("Name is not Season, given name is " + nseasonName);
   }
   else
   {
      nIdStr = "s";
   }

   if (isNaN(nseasonNo))
   {
      if (nseasonNo.localeCompare("Bonus"))
      {
         perror("season no is not number, given no is " + nseasonNo);
      }
      else
      {
         nIdStr += nseasonNo;     
      }
   }
   else
   {
      nIdStr += parseInt(nseasonNo);
   }

   if (nDivision.localeCompare("Division"))
   {
      perror("Name is not Division, given name is " + nDivision);
   }
   else
   {
      nIdStr += "division";
   }

   nIdStr += nTag;
   totalId.id = nIdStr + nTagId;
   totalId.id = totalId.id.toLowerCase();
   if (bonus)
   {
      totalId.menu = nseasonName + " " + nseasonNo + " " + nTagMenu;
   }
   else
   {
      totalId.menu = nTagMenu;
   }
   totalId.url = "season=" + nseasonNo + "&" + "div=" + nTag + nTagId;
   totalId.url = totalId.url.toLowerCase();
   totalId.no = nseasonNo;
   totalId.abb = stringMessage;

   var updJSON = getUpdatedJSON(totalId, jsonMenuData);

   /*
   {
      "id" : "s13divisionsf",
      "abb" : "TCEC_Season_13_-_Superfinal",
      "menu" : "Superfinal",
      "url" : "season=13&div=sf",
      "no" : "13",
      "dno" : "sf"
   }
   */

   //console.log(narray + " ,id:\n" + JSON.stringify(totalId, null, '\t'));
   return updJSON;
}

exports.getNewIdStruc = getNewIdStruc;
exports.getPGN = getPGN;
exports.getUpdatedJSON = getUpdatedJSON;
exports.getRandomSalt = getRandomSalt;
