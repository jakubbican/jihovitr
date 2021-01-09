
var urlFor = "https://giscloud.cadstudio.cz/_jb_test/forecast.json";
var urlCurr ="https://giscloud.cadstudio.cz/_jb_test/current.json";
//urlCurr = "https://api.pocasimeteo.cz/meteostanice_webkamery/meteostanice_api.php?id=1&key=246947219";
//urlFor = "https://api.pocasimeteo.cz/data_predpovedi_meteostanice_api.php?lat=48.714780&lng=14.071328&key=246947219";
urlCurr = "https://giscloud.cadstudio.cz/_jb_test/pm/meteostanice_webkamery/meteostanice_api.php?id=1&key=246947219";
urlFor = "https://giscloud.cadstudio.cz/_jb_test/pm/data_predpovedi_meteostanice_api.php?lat=48.714780&lng=14.071328&key=246947219";

var forSeriesConfig = [
    {name: "MASTER"},
    {name: "WRF"},
    {name: "GFS"},
    {name: "ICON"},
    {name: "COSMO"},
    {name: "YRno"},
    //{name: "WRF"},
];

function createChart(container)
{
    //init chart    -----------------------------------------------------------
    am4core.useTheme(am4themes_animated);
    am4core.useTheme(am4themes_material);
    var chart = am4core.create(container, am4charts.XYChart);

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
            console.log(target);
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

function updateData(chart)
{
    var make15 = 0;
    var make20 = 0;

    //station data
    $.get(urlCurr, function(dataCurr) {
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
        
      },"text").fail(function(e,textStatus, error) {
        console.log("failCur",e,textStatus,error);
    });

    

    //forecast data
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
                if (parseFloat(datapoint.VN) > 12) {make15++;}
                if (parseFloat(datapoint.VN) > 15) {make20++;}
            });

            var sr = chart.series.values.find(s => s.name == sf.nazevModelu);
            //console.log(chart.series.values);
            if (sr) sr.data = linedata;
            
        });
        },"text").fail(function(e,textStatus, error) {
        console.log("failFor",e,textStatus,error);
      });;

      if (make15>0) chart.xAxes.values[0].max = 15;
      if (make20>0) chart.xAxes.values[0].max = 20;
      
}

window.onload = function () {

    var chart = createChart("chartContainer");

    initChartData(chart,forSeriesConfig);


    updateData(chart);


    chart.events.on("ready", function () {
        
        chart.xAxes.values[0].zoomToDates(new Date().setHours(6,0,0,0),new Date().setHours(6,0,0,0)+36*60*60*1000  );
    });

    $(document).ready(function() {
      console.log("doc ready");
      $("#reloadButton").on('click', function() {
        console.log("update trigger");
        updateData(chart);
      });
    })


}

