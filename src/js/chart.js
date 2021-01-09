//var urlFor = "https://gisdemo.cadstudio.cz/_jb_test/forecast.json";
//var urlCurr ="https://gisdemo.cadstudio.cz/_jb_test/current.json";
var urlFor = "https://giscloud.cadstudio.cz/_jb_test/forecast.json";
var urlCurr ="https://giscloud.cadstudio.cz/_jb_test/current.json";
//urlCurr = "https://api.pocasimeteo.cz/meteostanice_webkamery/meteostanice_api.php?id=1&key=246947219";
//urlFor = "https://api.pocasimeteo.cz/data_predpovedi_meteostanice_api.php?lat=48.714780&lng=14.071328&key=246947219";
urlCurr = "https://giscloud.cadstudio.cz/_jb_test/pm/meteostanice_webkamery/meteostanice_api.php?id=1&key=246947219";
urlFor = "https://giscloud.cadstudio.cz/_jb_test/pm/data_predpovedi_meteostanice_api.php?lat=48.714780&lng=14.071328&key=246947219";


window.onload = function () {

// Themes begin
am4core.useTheme(am4themes_animated);
am4core.useTheme(am4themes_material);
// Themes end

// Create chart instance
var chart = am4core.create("chartContainer", am4charts.XYChart);


// Create axes
var dateAxis = chart.xAxes.push(new am4charts.DateAxis());
dateAxis.renderer.minGridDistance = 50;
dateAxis.dateFormats.setKey("day", "dd.MM.");
dateAxis.periodChangeDateFormats.setKey("day", "[bold]dd.MM.YYYY[/]");
dateAxis.periodChangeDateFormats.setKey("week", "[bold]dd.MM.YYYY[/]");
dateAxis.periodChangeDateFormats.setKey("hour", "[bold]dd.MM.[/]");




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


chart.scrollbarX = new am4charts.XYChartScrollbar();
//chart.scrollbarX.parent = chart.bottomAxesContainer;


chart.cursor = new am4charts.XYCursor();
chart.cursor.xAxis = dateAxis;

chart.legend = new am4charts.Legend();
chart.legend.position = "bottom";
chart.legend.maxHeight = 500;
chart.legend.scrollable = true;

chart.responsive.enabled = true;
chart.responsive.useDefault = false;

// chart.responsive.rules.push({
//   relevant: function(target) {
//     if (target.pixelWidth <= 600) {
//       return true;
//     }
    
//     return false;
//   },
//   state: function(target, stateId) {
//     if (target instanceof am4charts.Legend) {
//     //   var state = target.states.create(stateId);
//     //   state.properties.position = "bottom";
//     //   return state;
//     }  

//   return null;
//   }
// });

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
      state.properties.maxHeight = 220;
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

/* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/
chart.events.on("ready", function () {
       dateAxis.zoomToDates(new Date().setHours(6,0,0,0),new Date().setHours(6,0,0,0)+36*60*60*1000  );
});

// Aktualni data


 //$.getJSON(urlCurr, function(dataCurr,stat,xhr) {
 $.get(urlCurr, function(dataCurr) {
		dataCurr = JSON.parse(dataCurr.replace('(','').replace(');',''));
		
       var currData = [];
	   
		$.each(dataCurr.data,function(kdp,datapoint) {
      currData.push({
          date: new Date(datapoint.Dat),
          currV: parseFloat(datapoint.V),
          currVN: parseFloat(datapoint.VN)
        });
		if (parseFloat(datapoint.VN) > 12) {valueAxis.max = 15;}
		if (parseFloat(datapoint.VN) > 15) {valueAxis.max = 20;}
     });
  
      var srCurr = chart.series.push(new am4charts.LineSeries());
    srCurr.dataFields.valueY = "currV";
    srCurr.dataFields.dateX = "date";
    srCurr.strokeWidth = 1.1;
    srCurr.stroke = am4core.color("#555");
    srCurr.fill = am4core.color("#555");
    srCurr.fillOpacity = 0.3;
    srCurr.minBulletDistance = 10;
    srCurr.name = "Skutečnost";
    //srCurr.hiddenInLegend = true;
    srCurr.data = currData;
     

     
     chart.scrollbarX.series.push(srCurr);
	 
	 
     

     
		 //chart.cursor.snapToSeries = srCurr;
  },"text").fail(function(e,textStatus, error) {
    console.log("failCur",e,textStatus,error);
  });


   //$.getJSON(urlFor, function(dataFor) {
   $.get(urlFor, function(dataFor) {
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
           //console.log(chartData);
        });
        

          var srFor = chart.series.push(new am4charts.LineSeries());
          srFor.dataFields.valueY = "FOR_V";
          srFor.dataFields.dateX = "date";
          srFor.data = linedata;
          srFor.strokeWidth = 1.4;
          srFor.name = sf.nazevModelu;
          
          
          switch (sf.nazevModelu)
          {
          	case 'MASTER':
            	srFor.strokeWidth = 2.5;
              srFor.stroke = am4core.color("#800");
			  
              break;
          }
          
          chart.scrollbarX.series.push(srFor);
          


/*
          var range0 = valueAxis.createSeriesRange(srFor);
          range0.value = 0;
          range0.endValue = 2;
          range0.contents.stroke = srFor.stroke;
          range0.contents.strokeWidth = 0.8;
          range0.contents.fill =range0.contents.stroke;
          range0.contents.fillOpacity = 0.1;

          var range = valueAxis.createSeriesRange(srFor);
          range.value = 2;
          range.endValue = 4;
          range.contents.stroke = srFor.stroke;
          range.contents.strokeWidth = 1.5;
          range.contents.fill =range.contents.stroke;
          range.contents.fillOpacity = 0.2;
          
          var range2 = valueAxis.createSeriesRange(srFor);
          range2.value = 4;
          range2.endValue = 20;
          range.contents.stroke = srFor.stroke;
          range2.contents.strokeWidth = 2.5;
          range.contents.fill = range2.contents.stroke;
          range2.contents.fillOpacity = 0.4;*/
          
        
      });
      

           

    },"text").fail(function(e,textStatus, error) {
    console.log("failFor",e,textStatus,error);
  });;

}

