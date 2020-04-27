var evalChart;
var whiteEvalL = 0;
var blackEvalL = 0;
var timeChart;
var speedChart;
var nodesChart = null;
var depthChart;
var tbHitsChart;
var engine2colorno = 0;
var engine2color = '#FF0000';
engine2color = '#66CC00';
engine2color = '#A44BC0';
var evalChartData = {};
var engineColorArray = ['darkred', 'red', 'green', 'darkgreen', 'yellow', 'purple', 'orange'];
var evalconstant = 10.0;
var eng1L = 'Bluefish';
eng1L = 'Blueleela';
eng1L = '7Blue';
//eng1L = 'Blue';
var eng2L = 'Redmodo';
eng2L = 'Redfish';
eng2L = '7Fish';
eng2L = '7Red';

var evalLabels = [];
var labels = [];
var whiteEval = [];
var blackEval = [];
var liveEval1 = [];
var liveEval2 = [];
var whiteTime = [];
var blackTime = [];
var whiteSpeed = [];
var blackSpeed = [];
var whiteNodes = [];
var blackNodes = [];
var whiteDepth = [];
var blackDepth = [];
var whiteSelDepth = [];
var blackSelDepth = [];
var whiteTBHits = [];
var blackTBHits = [];

function setevalChartData()
{
   engine2color = engineColorArray[engine2colorno];
   evalChartData = {
      labels: [],
      datasets: [{
         label: 'White',
         lineTension: 0,
         spanGaps: true,
         borderColor: '#EFEFEF',
         backgroundColor: '#EFEFEF',
         fill: false,
         data: [
         ]
      }, {
         label: 'Black',
         lineTension: 0,
         borderColor: '#000000',
         spanGaps: true,
         backgroundColor: '#000000',
         fill: false,
         data: [
         ]
      }, {
         label: eng1L,
         lineTension: 0,
         borderColor: '#007bff',
         backgroundColor: '#007bff',
         spanGaps: true,
         fill: false,
         data: [
         ]
      }, {
         label: eng2L,
         lineTension: 0,
         borderColor: engine2color,
         backgroundColor: engine2color,
         spanGaps: true,
         fill: false,
         data: [
         ]
      }
      ]
   };
}
setevalChartData();

var timeChartData = {
   labels: [],
   datasets: [{
      label: 'White Engine Time',
      lineTension: 0,
      borderColor: '#EFEFEF',
      backgroundColor: '#EFEFEF',
      fill: false,
      data: [
      ]
   }, {
      label: 'Black Engine Time',
      lineTension: 0,
      borderColor: '#000000',
      backgroundColor: '#000000',
      fill: false,
      data: [
      ]
   }]
};

var speedChartData = {
   labels: [],
   datasets: [{
      label: 'White Engine Speeds',
      lineTension: 0,
      borderColor: '#EFEFEF',
      backgroundColor: '#EFEFEF',
      fill: false,
      data: [
      ],
      yAxisID: 'y-axis-1',
   }, {
      label: 'Black Engine Speed',
      lineTension: 0,
      borderColor: '#000000',
      backgroundColor: '#000000',
      fill: false,
      data: [
      ],
      yAxisID: 'y-axis-2'
   }]
};

var depthChartData = {
   labels: [],
   datasets: [{
      label: 'White Depth',
      lineTension: 0,
      borderColor: '#EFEFEF',
      backgroundColor: '#EFEFEF',
      fill: false,
      data: [
      ]
   }, {
      label: 'Black Depth',
      lineTension: 0,
      borderColor: '#1a1a1a',
      backgroundColor: '#1a1a1a',
      borderDash: [10,5],
      fill: false,
      data: [
      ]
   }, {
      label: 'W. Sel Depth',
      lineTension: 0,
      borderColor: '#b1b1b1',
      backgroundColor: '#b1b1b1',
      fill: false,
      data: [
      ]
   }, {
      label: 'B. Sel Depth',
      lineTension: 0,
      borderColor: '#7e7e7e',
      backgroundColor: '#7e7e7e',
      borderDash: [10,5],
      fill: false,
      data: [
      ]
   }]
};

var tbHitsChartData = {
   labels: [],
   datasets: [{
      label: 'White Engine TB Hits',
      lineTension: 0,
      borderColor: '#EFEFEF',
      backgroundColor: '#EFEFEF',
      fill: false,
      yAxisID: 'tb-y-axis-1',
      data: [
      ]
   }, {
      label: 'Black Engine TB Hits',
      lineTension: 0,
      borderColor: '#000000',
      backgroundColor: '#000000',
      fill: false,
      yAxisID: 'tb-y-axis-2',
      data: [
      ]
   }]
};

var nodesChartData = {
   labels: [],
   datasets: [{
      label: 'White Engine Speeds',
      lineTension: 0,
      borderColor: '#EFEFEF',
      backgroundColor: '#EFEFEF',
      fill: false,
      data: [
      ],
      yAxisID: 'y-axis-1',
   }, {
      label: 'Black Engine Speed',
      lineTension: 0,
      borderColor: '#000000',
      backgroundColor: '#000000',
      fill: false,
      data: [
      ],
      yAxisID: 'y-axis-2'
   }]
};

function drawEval()
{
   setevalChartData();
   evalChart = Chart.Line($('#eval-graph'), {
      data: evalChartData,
      options: {
         responsive: true,
         bezierCurve: false,
         hoverMode: 'index',
         spanGaps: true,
         stacked: false,
         legend: {
            display: true,
            position: 'bottom',     
            fontSize: 5,
            labels: {
               boxWidth: 1
            },
         },
         title: {
            display: false
         },
         tooltips: {
            callbacks: {
               label: function(tooltipItem, data) {
                  evall= [];
                  if (typeof data.datasets[0].data[tooltipItem.index] != 'undefined') {
                     evall= _.union(evall, ['White Eval: ' + data.datasets[0].data[tooltipItem.index].eval]);
                  }
                  if (typeof data.datasets[1].data[tooltipItem.index] != 'undefined') {
                     evall= _.union(evall, ['Black Eval: ' + data.datasets[1].data[tooltipItem.index].eval]);
                  }
                  if (typeof data.datasets[2].data[tooltipItem.index] != 'undefined') {
                     evall= _.union(evall, [eng1L + 'Eval: ' + data.datasets[2].data[tooltipItem.index].eval]);
                  }
                  if (typeof data.datasets[3].data[tooltipItem.index] != 'undefined') {
                     evall= _.union(evall, [eng2L + ' Eval: ' + data.datasets[3].data[tooltipItem.index].eval]);
                  }
                  return evall;
               }
            } // end callbacks:
         },
         scales: {
            yAxes: [{
               type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
               display: true,
               position: 'left',
               id: 'e-y-axis-1',
            }],
            xAxes: [{
               ticks: {
                  autoSkip: true,
                  maxTicksLimit: 25
               }
            }]
         }
      }
   });
}

$(function() {
   drawEval();
   initializeCharts();
});

function initializeCharts()
{
   timeChart = Chart.Line($('#time-graph'), {
      data: timeChartData,
      options: {
         backgroundColor:'rgb(10,10,10)',
         responsive: true,
         hoverMode: 'index',
         stacked: false,
         legend: {
            display: false
         },
         title: {
            display: false
         },
         scales: {
            yAxes: [{
               type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
               display: true,
               position: 'left',
               id: 't-y-axis-1',
            }],
            xAxes: [{
               ticks: {
                  autoSkip: true,
                  maxTicksLimit: 25
               }
            }]
         }
      }
   });

   var nodesChartIs = document.getElementById("nodes-graph");
   if (nodesChartIs)
   {
      nodesChart = Chart.Line($('#nodes-graph'), {
         data: nodesChartData,
         options: {
            responsive: true,
            hoverMode: 'index',
            stacked: false,
            legend: {
               display: false
            },
            title: {
               display: false
            },
            tooltips: {
               callbacks: {
                  label: function(tooltipItem, data) {
                     var nodes = parseInt(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].nodes);
                     if (nodes >= 1000000000) {
                        nodes = Math.round (nodes / 100000000) / 10;
                        nodes += 'B'
                     } else {
                        nodes = Math.round (nodes / 100000) / 10;
                        nodes += 'M'
                     }
                     return ' (' + nodes + ' nodes)';
                  }
               } // end callbacks:
            },
            scales: {
               yAxes: [{
                  type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
                  display: true,
                  position: 'left',
                  id: 'y-axis-1',
                  ticks: {
                     callback: function(value, index, values) {
                        if (value >= (1000000*1000)) {
                           value = Math.round (value / (100000 * 1000)) / 10;
                           value += 'B';
                        } else if ((value >= (1000000*1))) {
                           value = Math.round (value / 100000) / 10;
                           value += 'M'
                        } else {
                           value = Math.round (value / 100) / 10;
                           value += 'K'
                        }
                        return value;
                     }
                  }
               }, {
                  type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
                  display: true,
                  position: 'right',
                  id: 'y-axis-2',

                  // grid line settings
                  gridLines: {
                     drawOnChartArea: false, // only want the grid lines for one axis to show up
                  },
                  ticks: {
                     callback: function(value, index, values) {
                        if (value >= 1000000*1000) {
                           value = Math.round (value / (100000 * 1000)) / 10;
                           value += 'B'
                        } else if ((value >= (1000000*1))) {
                           value = Math.round (value / 100000) / 10;
                           value += 'M'
                        } else {
                           value = Math.round (value / 100) / 10;
                           value += 'K'
                        }
                        return value;
                     }
                  }
               }],
               xAxes: [{
                  ticks: {
                     autoSkip: true,
                     maxTicksLimit: 25
                  }
               }]
            }
         }
      });
   }

   speedChart = Chart.Line($('#speed-graph'), {
      data: speedChartData,
      options: {
         responsive: true,
         hoverMode: 'index',
         stacked: false,
         legend: {
            display: false
         },
         title: {
            display: false
         },
         tooltips: {
            callbacks: {
               label: function(tooltipItem, data) {
                  var value = parseInt(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].y);
                  if (value >= 1000000) {
                     value = Math.round (value / 10000) / 100;
                     value += 'Mnps'
                  } else {
                     value = Math.round (value / 10) / 100;
                     value += 'Knps'
                  }

                  var nodes = parseInt(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].nodes);
                  if (nodes >= 1000000000) {
                     nodes = Math.round (nodes / 100000000) / 10;
                     nodes += 'B'
                  } else {
                     nodes = Math.round (nodes / 100000) / 10;
                     nodes += 'M'
                  }
                  return value + ' (' + nodes + ' nodes)';
               }
            } // end callbacks:
         },
         scales: {
            yAxes: [{
               type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
               display: true,
               position: 'left',
               id: 'y-axis-1',
               ticks: {
                  callback: function(value, index, values) {
                     if (value >= 1000000) {
                        value = Math.round (value / 100000) / 10;
                        value += 'M'
                     } else {
                        value = Math.round (value / 100) / 10;
                        value += 'K'
                     }
                     return value;
                  }
               }
            }, {
               type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
               display: true,
               position: 'right',
               id: 'y-axis-2',

               // grid line settings
               gridLines: {
                  drawOnChartArea: false, // only want the grid lines for one axis to show up
               },
               ticks: {
                  callback: function(value, index, values) {
                     if (value >= 1000000) {
                        value = Math.round (value / 100000) / 10;
                        value += 'M'
                     } else {
                        value = Math.round (value / 100) / 10;
                        value += 'K'
                     }
                     return value;
                  }
               }
            }],
            xAxes: [{
               ticks: {
                  autoSkip: true,
                  maxTicksLimit: 25
               }
            }]
         }
      }
   });

   depthChart = Chart.Line($('#depth-graph'), {
      data: depthChartData,
      options: {
         responsive: true,
         hoverMode: 'index',
         stacked: false,
         legend: {
            display: true,
            position: 'bottom',     
            fontSize: 5,
            labels: {
               boxWidth: 1
            },
         },
         title: {
            display: false
         },
         scales: {
            yAxes: [{
               type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
               display: true,
               position: 'left',
               id: 'd-y-axis-1',
            }],
            xAxes: [{
               ticks: {
                  autoSkip: true,
                  maxTicksLimit: 25
               }
            }]
         }
      }
   });

   tbHitsChart = Chart.Line($('#tbhits-graph'), {
      data: tbHitsChartData,
      options: {
         responsive: true,
         hoverMode: 'index',
         stacked: false,
         legend: {
            display: false
         },
         title: {
            display: false
         },
         scales: {
            yAxes: [{
               type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
               display: true,
               position: 'left',
               id: 'tb-y-axis-1',
               ticks: {
                  callback: function(value, index, values) {
                     if (value >= 1000000) {
                        value = Math.round (value / 100000) / 10;
                        value += 'M'
                     } else {
                        value = Math.round (value / 100) / 10;
                        value += 'K'
                     }
                     return value;
                  }
               }
            }, {
               type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
               display: true,
               position: 'right',
               id: 'tb-y-axis-2',
               // grid line settings
               gridLines: {
                  drawOnChartArea: false, // only want the grid lines for one axis to show up
               },
               ticks: {
                  callback: function(value, index, values) {
                     if (value >= 1000000) {
                        value = Math.round (value / 100000) / 10;
                        value += 'M'
                     } else {
                        value = Math.round (value / 100) / 10;
                        value += 'K'
                     }
                     return value;
                  }
               }
            }],
            xAxes: [{
               ticks: {
                  autoSkip: true,
                  maxTicksLimit: 25
               }
            }]
         }
      }
   });
}

function addDataOld(chart, data, black) 
{
   if (black)
   { 
      chart.data.datasets[1].data.pop();
      chart.data.datasets[1].data.push(data);
   }
   else
   {
      chart.data.datasets[0].data.pop();
      chart.data.datasets[0].data.push(data);
   }

   plog ("XXX: Came to add data::W:" + chart.data.datasets[0].data.length, 1);
   plog ("XXX: Came to add data::B:" + chart.data.datasets[1].data.length, 1);
   chart.update();
}

function addDataLive(chart, data, black, contno) 
{
   var length = 0;

   if (!whiteEvalL)
   {
      return;
   }

   plog ("GRAPH: Entering to add data with array count:" + whiteEvalL, 0);

   if (chart.data.datasets[contno+1].data.length == 0)
   {
      plog ("YYY: Chart not yet updated, so exiting", 0);
      return;
   }

   data.y = getEval(data.eval);

   if (whiteEvalL > blackEvalL)
   {
      length = whiteEvalL;
   }
   else
   {
      length = blackEvalL;
   }

   if (length == 0)
   {
      plog ("XXX: Chart not yet updated, so exiting", 0);
      return;
   }

   if (black)
   { 
      chart.data.datasets[contno+1].data[whiteEvalL - 1] = data;
   }
   else
   {
      chart.data.labels[length] = data.x;
      chart.data.datasets[contno+1].data[length] = data;
   }

   plog ("GRAPH: Came to add data::W:" + "black:::" + black + " ," + " ,blackEvalL:" + 
         blackEvalL  + " ,whiteEvalL:" + whiteEvalL + " ,lengthhhh:" + length + " ,blackStarted:" + blackStarted, 0);

   chart.update();
}

function addData(chart, data, black) 
{
   var length = 0;

   data.y = getEval(data.eval);

   if (!whiteEvalL)
   {
      return;
   }

   plog ("GRAPH: Entering to add data with array count:" + whiteEvalL, 0);

   if (whiteEvalL > blackEvalL)
   {
      length = whiteEvalL;
   }
   else
   {
      length = blackEvalL;
   }

   if (length == 0)
   {
      plog ("XXX: Chart not yet updated, so exiting", 0);
      return;
   }

   if (black)
   { 
      chart.data.datasets[1].data[blackEvalL] = data;
      length = blackEvalL;
   }
   else
   {
      chart.data.labels[length] = data.x;
      chart.data.datasets[0].data[length] = data;
   }

   chart.update();
}

var blackPop = 1;
var whitePop = 1;

function removeData(chart, data, black) 
{
   addData(chart, data, black);
}

function getLiveEval(key, moveNumber, isBlack, contno)
{
   var engineEval = null;

   if (contno == 1)
   {
      engineEval = liveEngineEval1;
   }
   else
   {
      engineEval = liveEngineEval2;
   }

   evalObject = _.find(engineEval, function(ev) {
      return ev.ply == key;
   });

   if (_.isObject(evalObject)) {
      if (isBlack)
      {
         evalObject.eval = -evalObject.eval;
      }
      evall = evalObject.eval;
      evalObject.eval = getEval(evalObject.eval);
      var evalObj = 
      {
         'x': moveNumber,
         'y': evalObject.eval,
         'eval': evall
      };
      return evalObj;
   }

   return {'x': moveNumber, 'y': null, 'eval': null};
}

function clearChartData()
{
   console.log ("GRAPH: Clearing the chart");
   evalChart.data.labels = [];
   evalChart.data.datasets[0].data = [];
   evalChart.data.datasets[1].data = [];
   evalChart.data.datasets[2].data = [];
   evalChart.data.datasets[3].data = [];

   timeChart.data.labels = [];
   timeChart.data.datasets[0].data = [];
   timeChart.data.datasets[1].data = [];

   speedChart.data.labels = [];
   speedChart.data.datasets[0].data = [];
   speedChart.data.datasets[1].data = [];

   if (nodesChart)
   {
      nodesChart.data.labels = [];
      nodesChart.data.datasets[0].data = [];
      nodesChart.data.datasets[1].data = [];
   }

   depthChart.data.labels = [];
   depthChart.data.datasets[0].data = [];
   depthChart.data.datasets[1].data = [];
   depthChart.data.datasets[2].data = [];
   depthChart.data.datasets[3].data = [];

   tbHitsChart.data.labels = [];
   tbHitsChart.data.datasets[0].data = [];
   tbHitsChart.data.datasets[1].data = [];

   evalLabels = [];
   labels = [];
   whiteEval = [];
   blackEval = [];
   liveEval1 = [];
   liveEval2 = [];
   whiteTime = [];
   blackTime = [];
   whiteSpeed = [];
   blackSpeed = [];
   whiteNodes = [];
   blackNodes = [];
   whiteDepth = [];
   blackDepth = [];
   whiteSelDepth = [];
   blackSelDepth = [];
   whiteTBHits = [];
   blackTBHits = [];

   evalChart.update();
   timeChart.update();
   speedChart.update();
   if (nodesChart)
   {
      nodesChart.update();
   }
   depthChart.update();
   tbHitsChart.update();
   firstPly = 0;
}

function getEval(evalVal)
{
   var retEvalVal = evalVal;

   if (!isNaN(evalVal)) 
   {
      if (evalVal > evalconstant) 
      {
         retEvalVal = evalconstant;
      } 
      else if (evalVal < -evalconstant) 
      {
         retEvalVal = -evalconstant;
      }
   } 
   else 
   {
      if (evalVal && evalVal.substring(0,1) == '-') 
      {
         retEvalVal = -evalconstant;
      } 
      else if (evalVal != undefined)
      {
         retEvalVal = evalconstant;
      }
      else
      {
         retEvalVal = 0;
      }
   }
   return retEvalVal;
}

function arrayPush (chart, number, datax, index, movenum)
{
   if (chart)
   {
      chart.data.labels[index] = movenum;
      chart.data.datasets[number].data[index] = datax;
   }
}

var blackStarted = 0;

function updateChartDataLiveEval2()
{
   if (!showLivEng2)
   {
      return;
   }
   try {
      var needtoUpdate = 0;
      var startEval = whiteEvalL;

      if (!startEval)
      {
         return;
      }
   
      if (prevPgnData.Moves[0].didliveEval2 == undefined)
      {
         prevPgnData.Moves[0].didliveEval2 = 0;
      }
   
      var endVal = Math.min(startEval - 2, prevPgnData.Moves[0].didliveEval2);

      prevPgnData.Moves[0].didliveEval2 = 0;
   
      for (var ctr = startEval; ctr >= endVal; ctr = ctr - 1)
      {
         var dataToUse = evalChart.data.datasets[0].data[ctr];
         var key = 0;
         var isBlack = 0;
         if (dataToUse)
         {
            key = dataToUse.ply;
         }

         /*plog ("RRR: Doing for ctrl:" + ctr + " ,startEval:" + startEval, 0);*/

         if (evalChart.data.datasets[1].data[ctr] != undefined)
         {
            dataToUse = evalChart.data.datasets[1].data[ctr];
            key = dataToUse.ply;
            isBlack = 1;
         }

         if (dataToUse != undefined)
         {
            needtoUpdate = 1;
            var moveNumber = dataToUse.x;
            evalObject = getLiveEval(key, moveNumber, isBlack, 2);
            /*plog ("RRR: cont2 Doing for ctrl:" + ctr + ", key:" + key + " ,startEval:" + startEval + ", evalObject:" + evalObject.y + " ,isblack:" + isBlack, 0);*/
            if (!prevPgnData.Moves[0].didliveEval2)
            {
               prevPgnData.Moves[0].didliveEval2 = ctr;
               /*plog ("RRR:X setting cont2 Doing for ctrl:" + ctr + ", key:" + key + " ,startEval:" + startEval + ", evalObject:" + evalObject.y + " ,isblack:" + isBlack, 0);*/
            }
            if (evalObject.y == null)
            {
               prevPgnData.Moves[0].didliveEval2 = ctr;
            }
            else
            {
               evalChart.data.datasets[3].data[ctr] = evalObject;
            }
         }
      }
   
      if (needtoUpdate)
      {
         evalChart.update();
      }
   }
   catch (e)
   {
      console.log ("Error in updating live:" + e);
   }
}

function updateChartDataLiveEval1()
{
   if (!showLivEng1)
   {
      return;
   }
   try {
      var needtoUpdate = 0;
      var startEval = whiteEvalL;
   
      if (!whiteEvalL)
      {
         return;
      }
   
      if (prevPgnData.Moves[0].didliveEval1 == undefined)
      {
         prevPgnData.Moves[0].didliveEval1 = 0;
      }
   
      var endVal = Math.min(startEval - 2, prevPgnData.Moves[0].didliveEval1);
      prevPgnData.Moves[0].didliveEval1 = 0;
   
      for (var ctr = startEval; ctr >= endVal; ctr = ctr - 1)
      {
         var dataToUse = evalChart.data.datasets[0].data[ctr];
         var isBlack = 0;
         var key = 0;
         if (dataToUse)
         {
            key = dataToUse.ply;
         }

         /*plog ("RRR: Doing for ctrl:" + ctr + " ,startEval:" + startEval, 0);*/

         if (evalChart.data.datasets[1].data[ctr] != undefined)
         {
            dataToUse = evalChart.data.datasets[1].data[ctr];
            key = dataToUse.ply;
            isBlack = 1;
         }

         if (dataToUse != undefined)
         {
            needtoUpdate = 1;
            var moveNumber = dataToUse.x;
            evalObject = getLiveEval(key, moveNumber, isBlack, 1);
            /*plog ("RRR: cont1 Doing for ctrl:" + ctr + ", key:" + key + " ,startEval:" + startEval + ", evalObject:" + evalObject.y + " ,isblack:" + isBlack, 0);*/
            if (!prevPgnData.Moves[0].didliveEval1)
            {
               prevPgnData.Moves[0].didliveEval1 = ctr;
            }
            if (evalObject.y == null)
            {
               prevPgnData.Moves[0].didliveEval1 = ctr;
            }
            else
            {
               evalChart.data.datasets[2].data[ctr] = evalObject;
            }
         }
      }
   
      if (needtoUpdate)
      {
         evalChart.update();
      }
   }
   catch (e)
   {
      console.log ("Error in updating live:" + e);
   }
}

function updateChartDataLive(contno)
{
   if (contno == 1)
   {
      updateChartDataLiveEval1();
   }
   else
   {
      updateChartDataLiveEval2();
   }
}
var firstPly = 0;

function updateChartData()
{
   try {
      setevalChartData();
   
      var plyNum = 0;
   
      plog ("GRAPH: Entered updateChartData with whiteEvalL:" + whiteEvalL, 0);
   
      if (prevPgnData.Moves)
      {
         plog ("GRAPH: prevPgnData.Moves length:" + prevPgnData.Moves.length + " ,whiteEvalL::" + whiteEvalL + " ,evalChart.data.labels:" + evalChart.data.labels.length, 0);
         if (prevPgnData.Moves[0].completed == undefined || evalChart.data.labels.length == 0)
         {
            clearChartData();
            prevPgnData.Moves[0].completed = 0;
            prevPgnData.Moves[0].arrayStartW = 0;
            prevPgnData.Moves[0].arrayStartB = 0;
         }
      }
      else
      {
         clearChartData();
         return;
      }
   
      var needtoUpdate = 0;
      var arrayCtrW = prevPgnData.Moves[0].arrayStartW;
      var arrayCtrB = prevPgnData.Moves[0].arrayStartB;

      if (0 && (arrayCtrW - 2) > 0)
      {
         arrayCtrW = arrayCtrW - 2;
         arrayCtrB = arrayCtrB - 2;
         prevPgnData.Moves[0].completed -= 4;
         plog ("GRAPH: prevPgnData.Moves reduced length:" + prevPgnData.Moves.length + " ,whiteEvalL::" + whiteEvalL + " ,evalChart.data.labels:" + evalChart.data.labels.length, 0);
      }
   
      whiteEvalL = 0;
      blackEvalL = 0;
   
      for (var moveCtr = prevPgnData.Moves[0].completed; moveCtr < prevPgnData.Moves.length ; moveCtr++)
      {
         var move = prevPgnData.Moves[moveCtr];
         var key = moveCtr;
   
         if (move.book)
         {
            prevPgnData.Moves[moveCtr].done = 1;
            continue;
         }
   
         moveNumber = Math.round(moveCtr / 2) + 1;
   
         if (moveCtr % 2 != 0) {
            plyNum = moveCtr + 1;
            moveNumber--;
         }
         else
         {
            plyNum = moveCtr + 1;
         }
   
         if (plyNum < prevPgnData.Moves[0].completed)
         {
            continue;
         }
   
         if (!move.book) {
            needtoUpdate = 1;
            prevPgnData.Moves[0].completed = moveCtr + 1;
            depth = move.d;
   
            move.cwv = getEval(move.wv);
   
            evall= 
            {
               'x': moveNumber,
               'y': move.cwv,
               'ply': plyNum,
               'eval': move.wv
            };
   
            time = 
            {
               'x': moveNumber,
               'y': Math.round(move.mt / 1000),
               'ply': plyNum
            };
   
            speed =
            {
               'x': moveNumber,
               'y': move.s,
               'nodes': move.n,
               'ply': plyNum
            };
   
            depth =
            {
               'x': moveNumber,
               'y': depth,
               'ply': plyNum
            };
   
            seldepth =
            {
               'x': moveNumber,
               'y': move.sd,
               'ply': plyNum
            };
   
            tbHits =
            {
               'x': moveNumber,
               'y': move.tb,
               'ply': plyNum
            };
   
            nodes =
            {
               'x': moveNumber,
               'y': move.n,
               'nodes': move.n,
               'ply': plyNum
            };

            if (!firstPly)
            {
               firstPly = plyNum;
               if (firstPly%2 == 0)
               {
                  blackStarted = 1;
                  evalChart.data.labels[arrayCtrW] = moveNumber;
                  arrayCtrW = arrayCtrW + 1;
               }
            }
   
            plog ("LLL: doing for key:" + key + " ,prevPgnData.Moves[0].arrayStartW:" + 
                  prevPgnData.Moves[0].arrayStartW + " ,prevPgnData.Moves[0].arrayStartB:" + prevPgnData.Moves[0].arrayStartB + 
                  " ,blackStarted:" + blackStarted, 1);
   
            if (key % 2 == 0) {
               evalChart.data.labels[arrayCtrW] = moveNumber;
               evalChart.data.datasets[0].data[arrayCtrW] = evall;
               arrayPush(nodesChart, 0, nodes, arrayCtrW, moveNumber);
               arrayPush(timeChart, 0, time, arrayCtrW, moveNumber);
               arrayPush(speedChart, 0, speed, arrayCtrW, moveNumber);
               arrayPush(depthChart, 0, depth, arrayCtrW, moveNumber);
               arrayPush(depthChart, 2, seldepth, arrayCtrW, moveNumber);
               arrayPush(tbHitsChart, 0, tbHits, arrayCtrW, moveNumber);
               arrayCtrW = arrayCtrW + 1;
               prevPgnData.Moves[0].arrayStartW = arrayCtrW;
            } 
            else 
            {
               evalChart.data.datasets[1].data[arrayCtrB] = evall;
               arrayPush(nodesChart, 1, nodes, arrayCtrB, moveNumber);
               arrayPush(timeChart, 1, time, arrayCtrB, moveNumber);
               arrayPush(speedChart, 1, speed, arrayCtrB, moveNumber);
               arrayPush(depthChart, 1, depth, arrayCtrB, moveNumber);
               arrayPush(depthChart, 3, seldepth, arrayCtrB, moveNumber);
               arrayPush(tbHitsChart, 1, tbHits, arrayCtrB, moveNumber);
               arrayCtrB = arrayCtrB + 1;
               prevPgnData.Moves[0].arrayStartB = arrayCtrB;
            }
         }
      }
   
      evalChart.update();
      if (arrayCtrW)
      {
         whiteEvalL = arrayCtrW;
      }
      if (arrayCtrB)
      {
         blackEvalL = arrayCtrB;
      }
      timeChart.update();
      speedChart.update();
      if (nodesChart)
      {
         nodesChart.update();
      }
      depthChart.update();
      tbHitsChart.update();
   
      plog ("GRAPH: Exiting updateChartData with updating required:" + needtoUpdate + 
            " ,arrayCtrW:" + arrayCtrW + ",arrayCtrB:" + arrayCtrB + ",prevPgnData.Moves[0].completed:" + prevPgnData.Moves[0].completed + 
            " ,evalChart.data.labels:" + evalChart.data.labels.length, 0);
   }
   catch (e) {
      console.log ("GRAPH: Error unable to draw graph:" + e);
   }
}

