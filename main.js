// Options for svg map
var map = {
  width: 610,
  height: 600,
  colors: ['rgb(247,251,255)', 'rgb(222,235,247)', 'rgb(198,219,239)', 'rgb(158,202,225)', 'rgb(107,174,214)', 'rgb(66,146,198)', 'rgb(33,113,181)', 'rgb(8,81,156)', 'rgb(8,48,107)'],
  provincesKr: {
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
}



map.projection = d3.geo.mercator()
  .center([128, 36])
  .scale(4000)
  .translate([map.width/3, map.height/2]);

map.path = d3.geo.path().projection(map.projection);

map.svgMap = d3.select('#map').append('svg')
  .attr('width', map.width)
  .attr('height', map.height)

$('#fileupload').change(function(file) {
  var csv = file.target.files[0];

  // Draw Table
  parseCsvDataset(csv, {type: 'file'})
    .done(function (dataset) {
      drawTable('#table', dataset);
    });
    
  var reader = new FileReader();
  reader.readAsText(csv);
  reader.onload = function(e) {
    // Draw Map
    Promise.all([readMap('/map/provinces-topo-simple.json'), readCsv(reader.result, {type: 'upload'})])
      .done(function (results) {
        var provinces = results[0];
        var csvData = results[1];
        
        var pops = popByName(csvData);
        var quantize = setQuantize(csvData);
        
        drawLegend(quantize);
        
        setProvinces(provinces, pops, quantize)
          .then(drawProvinces)
      })
  }
});

  
function readMap(path) {
  return new Promise(function (fulfill, reject) {
    d3.json(path, function(err, json) {
      var provinces = topojson.feature(json, json.objects['provinces-geo']).features;
      
      if (err) reject(err);
      fulfill(provinces);
    });
  })
}

function readCsv(file, options) {
  var options = options || {};
  
  return new Promise(function (fulfill, reject) {
    if (options.type === 'xhr') {
      d3.csv(file, function(err, result) {
        fulfill(result);
      });
    } else if (options.type === 'upload') {
      fulfill(d3.csv.parse(file));
    }
  })
}

function parseCsvDataset(data, options) {
  if (options.type === 'file') {
    var dataset = new recline.Model.Dataset({
      file: data,
      backend: 'csv'
    });
  } else if (options.type === 'array') {
    var dataset = new recline.Model.Dataset({
      records: data
    });
  }
  
  return new Promise(function (fulfill, reject) {
    dataset.fetch()
      .done(function (data) {
        fulfill(data);
      });
  });
}

function popByName(data) {
  var pops = d3.map();
  
  data.forEach(function (r) {
    pops.set(r.name, +r.data)
  });

  return pops;
}

function setQuantize(data) {
  var data = data.map(function (r) {
    return +r.data;
  });

  return d3.scale.quantize()
    .domain([Math.min.apply(null, data), Math.max.apply(null, data)])
    .range(map.colors)
  // drawLegend('Legend', quantize);
}

function setProvinces(provinces, pops, quantize) {
  console.log(quantize);
  provinces.forEach(function (p) {
    p.properties.data = pops.get(p.properties.name_eng);
    p.properties.quantized = quantize(p.properties.data);
  });
  
  return new Promise(function (fulfill, reject) {
    fulfill(provinces);
  });
}

function drawProvinces(provinces) {
  var paths = map.svgMap.selectAll('path').data(provinces);
  
  paths.transition().duration(1000)
    .attr('d', map.path)
    .attr('fill', function (p) { return p.properties.quantized; })

  paths.enter()
    .append('path')
    .attr('d', map.path)
    .attr('class', 'province')
    .attr('fill', function (p) { return p.properties.quantized; });
    
  paths.exit().remove();
        
  map.svgMap.selectAll('text')
    .data(provinces.filter(function(p) { return p.properties.name_eng; }))
  .enter().append('text')
    .attr('transform', function(p) { return 'translate(' + map.path.centroid(p) + ')'; })
    .attr('dx', function (p) {
      switch(p.properties.name_eng) {
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
    .attr('dy', function(p) {
      switch(p.properties.name_eng) {
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
    .text(function(p) { return map.provincesKr[p.properties.name_eng]; });
}

function drawLegend(scale) {
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

function drawTestMap() {
  Promise.all([readMap('/map/provinces-topo-simple.json'), readCsv('data.csv', {type: 'xhr'})])
    .done(function (results) {
      var provinces = results[0];
      var csvData = results[1];

      var pops = popByName(csvData);
      var quantize = setQuantize(csvData);
      
      // draw Table
      parseCsvDataset(csvData, {type: 'array'})
        .done(function (dataset) {
          drawTable('#table', dataset);
        });
      
      drawLegend(quantize);
      
      setProvinces(provinces, pops, quantize)
        .then(drawProvinces)
    });
}

drawTestMap();
