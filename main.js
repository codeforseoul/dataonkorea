$('#fileupload').change(function(file) {
  var csv = file.target.files[0];

  // Draw Table
  var dataset = new recline.Model.Dataset({
    file: file.target.files[0],
    backend: 'csv'
  });
  dataset.fetch();
  drawTable('#table', dataset);

  // read csv file
  var reader = new FileReader();
  reader.readAsText(csv);
  reader.onload = function(e) {
    // Draw Map
    readFiles(setRows, reader.result, {
      csvSource: 'text'
    });
  }
});


// Options for svg map
var map = {}
map.width = 610;
map.height = 600;
map.colors = ['rgb(247,251,255)', 'rgb(222,235,247)', 'rgb(198,219,239)', 'rgb(158,202,225)', 'rgb(107,174,214)', 'rgb(66,146,198)', 'rgb(33,113,181)', 'rgb(8,81,156)', 'rgb(8,48,107)']
map.provincesKr = {
  'Seoul': '서울특별시',
  'Busan': '부산광역시',
  'Daejeon': '대전광역시',
  'Daegu': '대구광역시',
  'Gwangju': '광주광역시',
  'Sejongsi': '세종시',
  'Jeju-do': '제주도',
  'Jeollanam-do': '전라남도',
  'Jeollabuk-do': '전라북도',
  'Gyeonggi-do': '경기도',
  'Gyeongsangbuk-do': '경상북도',
  'Gyeongsangnam-do': '경상남도',
  'Gangwon-do': '강원도',
  'Incheon': '인천광역시',
  'Chungcheongnam-do': '충청남도',
  'Chungcheongbuk-do': '충청북도'
}

var quantize = d3.scale.quantize()
  .domain([0, 1000])
  .range(d3.range(9).map(function(i) { return 'p' + i; }));

var projection = d3.geo.mercator()
  .center([128, 36])
  .scale(4000)
  .translate([map.width/3, map.height/2]);

var path = d3.geo.path().projection(projection);

var svgMap = d3.select('#map').append('svg')
  .attr('width', map.width)
  .attr('height', map.height)

var popByName = d3.map();

function setRows(data, options, callback) {
  var options = options || {};
  
  if (options.csvSource === 'text') {
    var rows = d3.csv.parse(data);
  } else if (options.csvSource === 'file') {
    var rows = data;
  }
  
  rows.forEach(function (r) {
    popByName.set(r.name, +r.data)
  });
  
  callback(null, rows);
}

function setQuantize(rows, callback) {
  var data = rows.map(function (r) {
    return +r.data;
  });

  // TODO: Refactoring(Merge quantize and testQuantize)
  // var quantize = d3.scale.quantize()
  //   .domain([Math.min.apply(null, data), Math.max.apply(null, data)])
  //   .range(d3.range(9).map(function(i) { return 'p' + i; }));
  
  quantize = d3.scale.quantize()
    .domain([Math.min.apply(null, data), Math.max.apply(null, data)])
    .range(map.colors)
      
  drawLegend('Legend', quantize);
    
  callback(null, quantize);
}

function setProvinces(mapData, callback) {
  var provinces = topojson.feature(mapData, mapData.objects['provinces-geo']).features;

  provinces.forEach(function (p) {
    p.properties.data = popByName.get(p.properties.name_eng);
    p.properties.quantized = quantize(p.properties.data);
  });
  
  callback(null, provinces)
}

function drawProvinces(err, _, provinces) {
  var paths = svgMap.selectAll('path').data(provinces);
  
  paths.transition().duration(1000)
    .attr('d', path)
    .attr('fill', function (d) { return quantize(d.properties.data); })

  paths.enter()
    .append('path')
    .attr('d', path)
    .attr('fill', function (d) { return quantize(d.properties.data); });
    
  paths.exit().remove();
        
    svgMap.selectAll('text')
      .data(provinces.filter(function(d) { return d.properties.name_eng; }))
    .enter().append('text')
      .attr('transform', function(d) { return 'translate(' + path.centroid(d) + ')'; })
      .attr('dx', function (d) {
        switch(d.properties.name_eng) {
          case 'Chungcheongnam-do':
            return '-3em';
          case 'Daejeon':
            return '-2em';
          case 'Gyeonggi-do':
            return '-1em';
          case 'Incheon':
            return '-2em';
          case 'Jeju-do':
            return '3em';
          case 'Sejongsi':
            return '-1.3em';
          default:
            return '1em';
        }
      })
      .attr('dy', function(d) {
        switch(d.properties.name_eng) {
          case 'Chungcheongbuk-do':
            return '3em';
          case 'Daejeon':
            return '1em';
          case 'Gyeonggi-do':
            return '4em';
          case 'Sejongsi':
            return '-1.5em';
          default:
            return '.35em';
        }
      })
      .attr('class', 'region-label')
      .text(function(d) { return map.provincesKr[d.properties.name_eng]; });
      
    // svgMap.remove();
}

function drawLegend(title, scale) {
  var legend = d3.legend.color()
    .labelFormat(d3.format(',.0f'))
    .cells(9)
    .scale(scale);

  var div = d3.select('#map').append('div')
    .attr('class', 'legend');
    
  var svg = div.append('svg');

  svg.append('g')
    .attr('class', 'legendQuant')
    .attr('transform', 'translate(20,20)');

  svg.select('.legendQuant')
    .call(legend);
};

function drawTable(target, dataset) {
  var grid = new recline.View.Grid({
    model: dataset,
    el: $(target)
  });

  grid.visible = true;
  grid.render();
  // End - Draw Table
}

function readFiles(parser, file, options) {
  queue()
    // get svg data from map file
    .defer(d3.json, 'map/provinces-topo-simple.json')
    // set rows from csv
    .defer(parser, file, options)
    .await(drawMap)
}

function drawMap(err, mapData, rows) {
  queue()
    // set quantize based on the the range of csv data
    .defer(setQuantize, rows)
    .defer(setProvinces, mapData)
    .await(drawProvinces)
}

d3.csv('data.csv')
  .get(function (err, rows) {
    var dataset = new recline.Model.Dataset({
      records: rows
    });
    
    drawTable('#table', dataset)
    readFiles(setRows, rows, {
      csvSource: 'file'
    });
  })
