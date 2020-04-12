/* Global Variables */
var crosstableData = null;
var crossTimeout = null;
/* Global Variables */

function updateCrosstable()
{
   axios.get('crosstable.json')
   .then(function (response)
   {
      newUpdateStandData(response.data);
   })
   .catch(function (error)
   {
      // handle error
      plog(error, 0);
   });
}

function newUpdateStandData(data)
{
   plog ("Updating crosstable:", 0);
   crosstableData = data;

   if (tourInfo)
   {
      if (tourInfo.cup == 1)
      {
         $('#crossdiv').hide();
         $('#standdiv').hide();
         return;
      }
   }

   var standings = [];

   for (let i = 0 ; i < crosstableData.Order.length ; i++) {
      let engName = crosstableData.Order[i];
      let engineDetails = crosstableData.Table[engName];
      var eloDiff = engineDetails.Elo/3.2 * 2;
      if (engineDetails.LossAsBlack == undefined)
      {
         engineDetails.LossAsBlack = engineDetails.LossesAsBlack;
      }
      if (engineDetails.LossAsWhite == undefined)
      {
         engineDetails.LossAsWhite = engineDetails.LossesAsWhite;
      }
      var entry = {
         rank: engineDetails.Rank,
         name: getImg(engName),
         games: engineDetails.Games,
         points: engineDetails.Score.toFixed(1),
         wins: engineDetails.WinsAsBlack + engineDetails.WinsAsWhite + ' [' + engineDetails.WinsAsWhite + '/' + engineDetails.WinsAsBlack + ']',
         loss: engineDetails.LossAsWhite + engineDetails.LossAsBlack + ' [' + engineDetails.LossAsWhite + '/' + engineDetails.LossAsBlack + ']',
         crashes: engineDetails.Strikes,
         sb: parseFloat(engineDetails.Neustadtl).toFixed(2),
         elo: engineDetails.Rating,
         elo_diff: Math.round(eloDiff) + ' [' + Math.round(eloDiff + engineDetails.Rating) + ']'
      };
      standings.push(entry);
   }

   $('#crosstable').bootstrapTable('load', standings);
   newUpdateCrossData();
}

function newUpdateCrossData()
{
   plog ("Updating standtable:", 0);
   var standtableData = crosstableData;
   var localStandColumn = standColumns;

   var abbreviations = [];
   var standings = [];

   for (let i = 0 ; i < standtableData.Order.length; i ++) {
      let engName = standtableData.Order[i];
      let engineDetails = standtableData.Table[engName];
      let abbEntry = {abbr: engineDetails.Abbreviation, name: engName};
      abbreviations.push(abbEntry);
   }

   for (let x = 0 ; x < standtableData.Order.length; x ++) {
      let engName = standtableData.Order[x];
      let engineDetails = standtableData.Table[engName];
      wins = (engineDetails.WinsAsBlack + engineDetails.WinsAsWhite);
      var entry = {
         rank: engineDetails.Rank,
         name: getImg(engName),
         points: engineDetails.Score.toFixed(1)
      };

      for (let j = 0 ; j < abbreviations.length ; j++) {
         let abbreviation = abbreviations[j];
         var score2 = '';
         engineName = abbreviation.name;
         engineAbbreviation = abbreviation.abbr;
         engineCount = standtableData.Order.length;

         if (engineCount < 1) {
            engineCount = 1;
         }

         rounds = Math.floor(engineDetails.Games / engineCount) + 1;

         if (engineDetails.Abbreviation == engineAbbreviation) {
            for (i = 0; i < rounds; i++) {
               score2 = '';
            }
         } else {
            matchDetails = engineDetails.Results[engineName];
            score2 =
            {
               Score: matchDetails.Scores,
               Text: matchDetails.Text
            }
         }
         _.set(entry, engineAbbreviation, score2);
      }
      standings.push(entry);
   }

   for (let i = 0 ; i < standtableData.Order.length; i ++) {
      let engName = standtableData.Order[i];
      let engineDetails = standtableData.Table[engName];
      localStandColumn = _.union(localStandColumn,
         [{field: engineDetails.Abbreviation, title: engineDetails.Abbreviation,
            formatter: formatter, cellStyle: cellformatter}]);
   }

   $('#standtable').bootstrapTable({
      columns: localStandColumn,
      classes: 'table table-striped table-no-bordered',
      sortName: 'rank'
   });

   $('#standtable').bootstrapTable('load', standings);
}

