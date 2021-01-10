(function ($) {
  "use strict"; // Start of use strict

  var userKey = null;
  var stationList = null;
  var currentStationName = null;
  
  var serviceRoot = "https://giscloud.cadstudio.cz/_jb_test/pm";
  //var stationUpdateInterval = 24*60*60*1000;
  var stationUpdateInterval = 24*60*60*1000;

  var forSeriesConfig = [
      {name: "MASTER"},
      {name: "WRF"},
      {name: "GFS"},
      {name: "Arpege"},
      {name: "ICON"},
      {name: "COSMO"},
      {name: "YRno"},

  ];


  function createChart(container)
  {
      //init chart    -----------------------------------------------------------
      am4core.useTheme(am4themes_animated);
      am4core.useTheme(am4themes_material);
      var chart = am4core.create(container, am4charts.XYChart);
      chart.paddingRight = "25";

      //x axis        -----------------------------------------------------------
      var dateAxis = chart.xAxes.push(new am4charts.DateAxis());
      dateAxis.renderer.minGridDistance = 50;
      dateAxis.dateFormats.setKey("day", "dd.MM.");
      dateAxis.periodChangeDateFormats.setKey("day", "[bold]dd.MM.YYYY[/]");
      dateAxis.periodChangeDateFormats.setKey("week", "[bold]dd.MM.YYYY[/]");
      dateAxis.periodChangeDateFormats.setKey("hour", "[bold]dd.MM.[/]");

      chart.scrollbarX = new am4charts.XYChartScrollbar();


      //y axis        -----------------------------------------------------------
      var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
      valueAxis.max = 12; 
      valueAxis.min = 0;
      valueAxis.strictMinMax = true; 
      valueAxis.renderer.grid.template.disabled = true;
      valueAxis.renderer.labels.template.disabled = true;
      function createGrid(value) {
      var range = valueAxis.axisRanges.create();
      range.value = value;
      range.label.text = "{value}";
      }
      createGrid(0);
      createGrid(3);
      createGrid(5);
      createGrid(8);
      createGrid(12);
      createGrid(15);
      createGrid(20);

      //chart cursor     -----------------------------------------------------------
      chart.cursor = new am4charts.XYCursor();
      chart.cursor.xAxis = dateAxis;

      //legend            -----------------------------------------------------------
      chart.legend = new am4charts.Legend();
      chart.legend.position = "bottom";
      chart.legend.maxHeight = 500;
      chart.legend.scrollable = true;

      //responsivess       -----------------------------------------------------------
      chart.responsive.enabled = true;
      chart.responsive.useDefault = false;
      
      chart.responsive.rules.push({
          relevant: function(target) {
            if (target.pixelHeight <= 500) {
              return true;
            }
            
            return false;
          },
          state: function(target, stateId) {
            if (target instanceof am4charts.Legend) {
              var state = target.states.create(stateId);
              state.properties.maxHeight = chart.contentHeight;
              state.properties.position = "right";
              return state;
            }  
        
            if (target instanceof am4charts.XYChartScrollbar) {
              var state = target.states.create(stateId);
              state.properties.minHeight = 8;
              
              return state;
            }  
          return null;
          }
        });


      return chart;

  }

  function initChartData(chart,config)
  {
      var sr = {};

      // measured data
      sr = chart.series.push(new am4charts.LineSeries());
      sr.dataFields.valueY = "currV";
      sr.dataFields.dateX = "date";
      sr.strokeWidth = 1.1;
      sr.stroke = am4core.color("#555");
      sr.fill = am4core.color("#555");
      sr.fillOpacity = 0.3;
      sr.minBulletDistance = 10;
      sr.name = "Stanice";
      sr.data = [];
      chart.scrollbarX.series.push(sr);

      //predefined forecast data
      config.forEach(srcfg => {

          sr = chart.series.push(new am4charts.LineSeries());
          sr.dataFields.valueY = "FOR_V";
          sr.dataFields.dateX = "date";
          sr.data = [];
          sr.strokeWidth = 1.4;
          sr.name = srcfg.name;
          
          
          switch (srcfg.name)
          {
              case 'MASTER':
              sr.strokeWidth = 2.5;
              sr.stroke = am4core.color("#800");
              
              break;
          }
          
          chart.scrollbarX.series.push(sr);

      });

      //helper line to init some part of the chart before any data is inserted
      var mockData = [{date: new Date().setHours(6,0,0,0),val: 0},{date: new Date().setHours(6,0,0,0)+36*60*60*1000, val: 0}];
      sr = chart.series.push(new am4charts.ColumnSeries());
      sr.dataFields.valueY = "val";
      sr.dataFields.dateX = "date";
      sr.strokeWidth = 0;
      sr.stroke = am4core.color("#000");
      sr.fill = am4core.color("#000");
      sr.fillOpacity = 0;
      sr.hiddenInLegend = true;
      sr.data = mockData;
      chart.scrollbarX.series.push(sr);
  }

  function loadStations(callback)
  {
    //update list only if it has not been loaded in past day
    if (!(localStorage.stationJsonUpdate) || (new Date - new Date(localStorage.stationJsonUpdate))>stationUpdateInterval)
    {
      $.get(serviceRoot + "/meteostanice_webkamery/meteostanice_webkamery_seznam_api.php?&key="+userKey, function(stJson) {
        stJson = stJson.replace('(','').replace(');','');
        localStorage.stationJson = stJson;
        localStorage.stationJsonUpdate = new Date();
        if (localStorage.stationJson)
        {
          populateStationList();
          callback();
        }
      },"text").fail(function(e,textStatus, error) {
          console.log("failStat",e,textStatus,error);
      });
    }
    else
    {
      populateStationList();
      callback();
    }

    
    function populateStationList()
    {
      stationList = {ids: [], names: []};

      $.each(JSON.parse(localStorage.stationJson).meteostanice_webkamery,function(a,st){
        if(!stationList.ids[st.id_meteostanice])
        {
          stationList.ids[st.id_meteostanice] = {
            id_meteostanice: st.id_meteostanice,
            lat_meteostanice: st.lat_meteostanice,
            lng_meteostanice: st.lng_meteostanice,
            nazev_meteostanice: st.nazev_meteostanice,
            url_video: st.url_video
          };
        }
        if(!stationList.names[st.nazev_meteostanice])
        {
          stationList.names[st.nazev_meteostanice] = {
            id_meteostanice: st.id_meteostanice,
            lat_meteostanice: st.lat_meteostanice,
            lng_meteostanice: st.lng_meteostanice,
            nazev_meteostanice: st.nazev_meteostanice,
            url_video: st.url_video
          };
        }
      });
    }
  }


  function updateData(chart)
  {
      var make15 = 0;
      var make20 = 0;

      var station = stationList.names[currentStationName];
      if (!station)
      {
        return;
      }

      //station data
      $.get(serviceRoot + "/meteostanice_webkamery/meteostanice_api.php?id="+station.id_meteostanice+"&key="+userKey, function(dataCurr) {
          dataCurr = JSON.parse(dataCurr.replace('(','').replace(');',''));
              
          var currData = [];

            
          $.each(dataCurr.data,function(kdp,datapoint) {
            currData.push({
                date: new Date(datapoint.Dat),
                currV: parseFloat(datapoint.V),
                currVN: parseFloat(datapoint.VN)
              });
              
              if (parseFloat(datapoint.VN) > 12) {make15++;}
              if (parseFloat(datapoint.VN) > 15) {make20++;}
          });
      
          chart.series.values.find(s => s.name = 'Stanice').data = currData;
          
          if (make15>0) chart.yAxes.values[0].max = 15 
          else if (make20>0) chart.yAxes.values[0].max = 20
          else chart.yAxes.values[0].max = 12;
          
        },"text").fail(function(e,textStatus, error) {
          console.log("failCur",e,textStatus,error);
      });

      

      //forecast data
      $.get(serviceRoot+"/data_predpovedi_meteostanice_api.php?lat="+station.lat_meteostanice+"&lng="+station.lng_meteostanice+"&key="+userKey, function(dataFor) {
          dataFor = JSON.parse(dataFor.replace('(','').replace(');',''));
          $.each(dataFor.json, function(ksf,sf) {
              var linedata = [];
              $.each(sf.data,function(kdp,datapoint) {
                  linedata.push(
                              {
                              date: new Date(datapoint.Dat),
                              FOR_V: parseFloat(datapoint.V),
                              FOR_VN: parseFloat(datapoint.VN)
                              });
                  if (parseFloat(datapoint.VN) > 12) {make15++;}
                  if (parseFloat(datapoint.VN) > 15) {make20++;}
              });

              var sr = chart.series.values.find(s => s.name == sf.nazevModelu);
              //console.log(chart.series.values);
              if (sr) sr.data = linedata;

              if (make15>0) chart.yAxes.values[0].max = 15 
              else if (make20>0) chart.yAxes.values[0].max = 20
              else chart.yAxes.values[0].max = 12;
              
          });
          },"text").fail(function(e,textStatus, error) {
          console.log("failFor",e,textStatus,error);
        });;
      
  }

  function setCurrentStationNameFromHash(hash)
  {
    currentStationName = decodeURIComponent(hash.replace("#\/",""));
    console.log("Current station name set: "+currentStationName);
    $("#navbarTitle").text(currentStationName);
    $(document).prop('title', currentStationName);
    //console.log($("#navbarTitle"));
  }

  $(document).ready(function () {

    //userKey = 246947219;

    if (localStorage.userKey)
    {
      userKey = localStorage.userKey;
      $("#userKeyInput").val(userKey);
    }


    if (!userKey)
    {
      $("#chartSection").hide();
      
      //todo deactivate navbar
      // $("#navbarResponsive").hide();
      // $("navbarMainCtrls").hide();

      $("#userKeyButton").on('click', function() {
        var newval = $("#userKeyInput").val();
        console.log("Setting new userKey " + newval);
        localStorage.userKey = newval;
        location.reload();
      });
    }
    else
    {
      $("#regBanner").hide();
      $("#pocasimeteo").hide();
      $("#footer").hide();

      var chart = null;

      loadStations( function() {

        setCurrentStationNameFromHash(window.location.hash);
        if(!(stationList.names[currentStationName]))
        {
          window.location = "/#/Lipno";
          setCurrentStationNameFromHash(window.location.hash);
        }


        //todo
        $("#stationInput").autocomplete({
          source: {"test": 1, "pepa": 2,"Lipno": 3}
        });
        

        chart = createChart("chartContainer");
        initChartData(chart,forSeriesConfig);
        updateData(chart);


        chart.events.on("ready", function () {
            //zoom to initial extent
            chart.xAxes.values[0].zoomToDates(new Date().setHours(6,0,0,0),new Date().setHours(6,0,0,0)+36*60*60*1000  );

            //enable reload button action
            $("#reloadButton").on('click', function() {
              console.log("update trigger");
              updateData(chart);
            });

            //enable station selections
            $(".station-link").on('click',function(e){
              $('.navbar-collapse').collapse('hide');
            });

            $(window).bind( 'hashchange', function(e) { 
              setCurrentStationNameFromHash(window.location.hash);
              updateData(chart);
            });
        });

      });

    };

    $("#settingsButton").on('click', function() {
      window.localStorage.removeItem("userKey");
      location.reload();
    });

  });

})(jQuery); // End of use strict