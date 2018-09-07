//TODO: fix when zipcode or country has no companies

var config = {
	zoom: .8,
}

var global = {
	city1:null,
	geojson1: null,
	city2:null,
	geojson2:null,
	usMapWidth:800,
	usMapHeight:800,
	max:250000,
	maxIncome:999999999,
	gradientStart:"#ffffff",
	gradientEnd:"#3CA733",
	overallVariance:null
}
$(function() {
	queue()
		.defer(d3.json, geojson1)
		.defer(d3.csv, csv1)
		.await(dataDidLoad);
})

function dataDidLoad(error, geojson, data) {
	global.city1 = data
	global.geojson1 = geojson
	//var overallVariance = calculateDistribution(data).variance
	//global.overallVariance = overallVariance	
	initNycMap(geojson, data, "Median", "#svg-1",0,global.maxIncome)
	drawChart(data,"#chart1",1)
	//drawVarianceGraph(data)
}
function drawVarianceDistribution(data){
	//divide data into income groups
	//calculate variance for each group
	//graph variance over income
	var varianceGraphData = []
	var interval = 20000
	for(var i = 0; i < 220000; i += interval ){
		var currentData = filterData(data,i,i+interval-1)
		//console.log(currentData)
		var distribution = calculateDistribution(currentData)
		varianceGraphData.push({interval:[i,i+interval-1], variance:distribution.variance})
	}
	return varianceGraphData
//	filterData(data,low,high)
}
function drawVarianceGraph(data){
	var varianceData = drawVarianceDistribution(data)
  	var varianceScale = d3.scale.linear().domain([0,global.overallVariance/2]).range([0,400])
	var incomeScale = d3.scale.linear().domain([0,220000]).range([0,400])
	var margin = 20
	
	var line = d3.svg.line()
		.x(function(d){
			return incomeScale(d.interval[0])+margin
		})
		.y(function(d){
			return 400-100-varianceScale(d.variance)			
		})
	var varianceGraph =d3.select("#variance-chart")
		.append("svg")
		.attr("width",400)
		.attr("height",500)
		
	varianceGraph.append("svg:path")
		.attr("d",line(varianceData))
		.attr("fill","none")
		.attr("stroke","#000")
	varianceGraph.selectAll("circle")
		.data(varianceData)
		.enter()
		.append("circle")
		.attr("cx",function(d){
			return incomeScale(d.interval[0])+margin
		})
		.attr("cy",function(d){
			return 400-100-varianceScale(d.variance)
		})
		.attr("r",2)
		
	varianceGraph.selectAll("text .incomeLabel")
		.data(varianceData)
		.enter()
		.append("text")
		.attr("class","incomeLabel")
		.attr("x",function(d){
			return incomeScale(d.interval[0])+margin
		})
		.attr("y",function(d){
			return 320
		})
		.text(function(d){ return "$"+d.interval[0]+" to $"+d.interval[1]})
	
	varianceGraph.selectAll("text .varianceLabel")
		.data(varianceData)
		.enter()
		.append("text")
		.attr("class","varianceLabel")
		.attr("x",function(d){
			return incomeScale(d.interval[0])+margin
		})
		.attr("y",function(d){
			return 400-100-varianceScale(d.variance)
		})
		.text(function(d){ return Math.round(d.variance)})
		
	
	varianceGraph.append("text")
		.attr("class","title")
		.attr("x",20)
		.attr("y",20)
		.text("Variance over Income")
}
function drawCurrentVariance(variance,income){
  	var varianceScale = d3.scale.linear().domain([0,global.overallVariance/2]).range([0,400])
	var incomeScale = d3.scale.linear().domain([0,220000]).range([0,400])
	var varianceChart = d3.select("#variance-chart svg")
	varianceChart.append("circle")
	.attr("cy", 400-100-varianceScale(variance))
	.attr("cx", incomeScale(income))
	.attr("r",3)
	.attr("fill","red")
}
function calculateDistribution(data){
	var keys = ["Less than $10,000","$10,000 to $14,999","$15,000 to $19,999","$20,000 to $24,999","$25,000 to $29,999","$30,000 to $34,999","$35,000 to $39,999","$40,000 to $44,999","$45,000 to $49,999","$50,000 to $59,999","$60,000 to $74,999","$75,000 to $99,999","$100,000 to $124,999","$125,000 to $149,999","$150,000 to $199,999","$200,000 or more"]
	var max = 0
	var chartData = {}
	var justValues = []
	var total = 0
	for(var key in keys){
		columnSum = sumEachColumnChartData(data,keys[key])
		if(columnSum>max){
			max = columnSum
		}
		chartData[keys[key]]=columnSum
		total += columnSum
		justValues.push(columnSum)
	}
	
	var mean = total/keys.length
	var difSqSum = 0
	for(var value in justValues){
		var difSq = (justValues[value]-mean)*(justValues[value]-mean)
		difSqSum = difSqSum+difSq
	}
	var variance = difSqSum/justValues.length
	var deviation = Math.sqrt(variance)
	return {data:chartData,variance:variance,deviation:deviation,mean:mean,max:max,total:total}
}
function drawChart(data, svg, svgNumber){
	//console.log(data)
	//console.log(sumEachColumnChartData(data,"a"))
	var keys = ["Less than $10,000","$10,000 to $14,999","$15,000 to $19,999","$20,000 to $24,999","$25,000 to $29,999","$30,000 to $34,999","$35,000 to $39,999","$40,000 to $44,999","$45,000 to $49,999","$50,000 to $59,999","$60,000 to $74,999","$75,000 to $99,999","$100,000 to $124,999","$125,000 to $149,999","$150,000 to $199,999","$200,000 or more"]
	var data = calculateDistribution(data)
	var chartData = data.data
	var max = data.max
	var total = data.total
	var keyLength = keys.length
	
	var height = 280
	var width = 460
	var margin = 150
	var barGap = 2
	var barWidth = (width-80)/keyLength-barGap
	var svg = d3.select(svg)
		.append("svg").attr("height",height).attr("width",width)
	var yScale = d3.scale.linear().domain([0,max/total*100.0]).range([5,height-margin])
	var chart = svg.selectAll("rect")
		.data(keys)
		.enter()
		.append("rect")
		.attr("x",function(d,i){
			return i*(barWidth+barGap)+20
		})
		.attr("y",function(d){
			var value = chartData[d]
			var percentage = parseInt(value/total*100.0)
			return height-yScale(percentage)-margin
		})
		.attr("width",barWidth)
		.attr("height",function(d){
			var value = chartData[d]
			var percentage = parseInt(value/total*100.0)
			return yScale(percentage)
		})
		.attr("fill","#888")
		//.attr("opacity",0.6)
		.on("mouseover",function(d){
			var value = chartData[d]
			var label = d
			var percentage = parseInt(value/total*100.0)
		})
		.on("click",function(d){
			//global.max = 100
			//console.log(d)
			//renderNycMap(global.city1, d, "#svg-1",0, global.maxIncome)
			//renderNycMap(global.city2, d, "#svg-2",0, global.maxIncome)
		})
		
	svg.selectAll("text")
		.data(keys)
		.enter()
		.append("text")
		.attr("class","chartLabel")
		.text(function(d){
			return d
		})
		.attr("x",function(d,i){
			return i*(barWidth+barGap)+32
		})
		.attr("y",height-margin+5)
		.attr("text-anchor","center")
		
	svg.selectAll(".percentLabel")
		.data(keys)
		.enter()
		.append("text")
		.attr("class","percentLabel")
		.text(function(d){
			var value = chartData[d]
			var label = d
			var percentage = parseInt(value/total*100)
			return percentage+"%"
		})
		.attr("x",function(d,i){
			return i*(barWidth+barGap)+21
		})
		.attr("y",function(d,i){
			var value = chartData[d]
			var percentage = parseInt(value/total*100)
			return height-yScale(percentage)-margin+10
		})
		.attr("text-anchor","center")

	svg.append("text")
		.attr("class","axisLabel")
		.text("Income Distribution")
		.attr("x",20)
		.attr("y",10)
}
function getSizeOfObject(obj){
    var size = 0, key;
     for (key in obj) {
         if (obj.hasOwnProperty(key)) size++;
     }
     return size;
}
function sumEachColumnChartData(data,column){
	//console.log(data)
	//console.log(data)
	var groupLength = getSizeOfObject(data)
	var sum = 0
	for(var i =0; i<groupLength; i++){
		//var columns = getSizeOfObject(data[i])
		var columnValue = parseInt(data[i][column])
		sum += columnValue
	}
	return sum
}
function redrawFilteredMaps(low,high,gini,income){
	d3.select("#chart1 svg").remove()
	d3.select("#chart2 svg").remove()
	d3.select("#scatter svg").remove()
	
	var filtered1 = filterData(global.city1,low,high)
	renderNycMap(global.city1, "Median", "#svg-1", low,high,gini)
	drawChart(filtered1,"#chart1",1)
	drawScatterPlot(global.city1,gini,income)
	
	d3.select(".filterHighlight").remove()
		
	var y = d3.scale.linear().range([0,400]).domain([0,global.max]);
	//d3.select("#income-label").html("Showing locations with median household income between $"+low+" and $"+high)
	
	d3.select("#details").html("The selected area has a gini score of "+ gini+", and it is income distribution is below.")
}
function drawScatterPlot(data,centerGini,centerIncome){
	var scatterData = []
	for(var i in data){
		var gini = parseFloat(data[i].Gini)
		var median = parseInt(data[i].Median)
		if(!(isNaN(gini)) && !(isNaN(median))){
			scatterData.push([gini,median])
		}
	}
	var margin = 20

	var height = 250 - margin*2
	var width = 400 - margin*2
	
	var xScale = d3.scale.linear().domain([0,250000]).range([0,width])
	//var yScale = d3.scale.linear().domain([0,.8]).range([0,height])
	var yScaleR = d3.scale.linear().domain([1,0]).range([0,height])

	var xAxis = d3.svg.axis()
		.scale(xScale)
		.orient("bottom")
		.ticks(4)
	
	var yAxis = d3.svg.axis()
		.scale(yScaleR)
		.orient("left")
		.ticks(4)
	
	var scatterPlot = d3.select("#scatter").append("svg")
		.attr("height",height+margin*2)
		.attr("width", width+margin*2)
		.attr("transform", "translate("+margin+","+margin+")");
		var scale = d3.scale.linear().domain([0.1,gini,.8]).range(["green","#eee","red"]);
	
	var colorScale = d3.scale.linear().domain([0.1,centerGini,.8]).range(["green","#aaa","red"])
	scatterPlot.selectAll("circle")
		.data(scatterData)
		.enter()
		.append("circle")
		.attr("cx", function(d){
			return xScale(d[1])
		})
		.attr("cy", function(d){
			return yScaleR(d[0])
		})
		.attr("r",1)
		.attr("opacity",function(d){
			return 1
		})
		.attr("fill",function(d){
			return  colorScale(d[0])
			if(d[0]>centerGini){
					return "red"
			}
			else{
				return "green"
			}
		})
		.attr("transform", "translate("+margin+","+margin+")")
		
	scatterPlot.append("g")
		.attr("class","x axis")
		.call(xAxis)
		.attr("transform", "translate("+margin+","+(height+margin)+")");
		
	scatterPlot.append("g")
		.attr("class","y axis")
		.call(yAxis)
		.attr("transform", "translate("+margin+","+margin+")");
		
	scatterPlot.append("g")
		.attr("class", "division")
		.append("rect")
		.attr("x", 0)
		.attr("y",function(){
			return yScaleR(centerGini)
		})
		.attr("width", width)
		.attr("height",1)
		.attr("transform", "translate("+margin+","+margin+")")
		
	scatterPlot.append("g")
		.attr("class","label")
		.append("text")
		.text(centerGini +" (city-wide gini = 0.535)")
		.attr("x", 200)
		.attr("y",function(){
			return yScaleR(centerGini)-10
		})
		.attr("transform", "translate("+margin+","+margin+")")
		
	scatterPlot.append("g")
		.attr("class","label income")
		.append("text")
		.text("$"+centerIncome+" (city-wide median income = $54,057)")
		.attr("y", 200)
		.attr("x",function(){
			return xScale(centerIncome)+10
		})
		.attr("transform", "translate("+margin+","+margin+")")
		
	scatterPlot.append("g")
		.attr("class", "division income")
		.append("rect")
		.attr("y", 0)
		.attr("x",function(){
			return xScale(centerIncome)
		})
		.attr("width", 1)
		.attr("height",height)
		.attr("transform", "translate("+margin+","+margin+")")
		
}
//put currentSelection in to global
var currentSelection = {
	zipcode: null,
	jurisdiction: null
}
var utils = {
	range: function(start, end) {
		var data = []

		for (var i = start; i < end; i++) {
			data.push(i)
		}
		return data
	}
}
var table = {
	group: function(rows, fields) {
		var view = {}
		var pointer = null

		for(var i in rows) {
			var row = rows[i]

			pointer = view
			for(var j = 0; j < fields.length; j++) {
				var field = fields[j]

				if(!pointer[row[field]]) {
					if(j == fields.length - 1) {
						pointer[row[field]] = []
					} else {
						pointer[row[field]] = {}
					}
				}

				pointer = pointer[row[field]]
			}

			pointer.push(row)
		}

		return view
	},

	maxCount: function(view) {
		var largestName = null
		var largestCount = null

		for(var i in view) {
			var list = view[i]

			if(!largestName) {
				largestName = i
				largestCount = list.length
			} else {
				if(list.length > largestCount) {
					largestName = i
					largestCount = list.length
				}
			}
		}

		return {
			name: largestName,
			count: largestCount
		}
	},

	filter: function(view, callback) {
		var data = []

		for(var i in view) {
			var list = view[i]
			if(callback(list, i)) {
				data = data.concat(list)
			}
		}

		return data
	}
}
/*function drawFilterHighlight(high,low){
	d3.select("#filters svg")
	.append("rect")
	.attr("class","filterHighlight")
	.attr("width", 20)
	.attr("height",(high)-parseInt(low))
	.attr("y",400-high)
	.attr("stroke","#fff")
	.attr("opacity",.3)
	.attr("stroke-width",4)
	.attr("fill","#666")
}*/
function filterData(data,low,high){
	//console.log(data)
	var filteredData = table.filter(table.group(data, ["Median"]), function(list, income) {
		income = parseFloat(income)
		return (income >= low && income <= high)
	})
	//console.log(filteredData)
	return filteredData
}
function initNycMap(paths, data, column, svg,low,high) {
	renderMap(paths, svg, global.usMapWidth,global.usMapHeight)
	var cityWideGini = 0.535
	var cityWideMedian = 54057
	renderNycMap(data, column,svg,low,high,cityWideGini)
	drawScale(cityWideGini)
	drawScatterPlot(data,cityWideGini,cityWideMedian)
}
function zoomed() {
	console.log("zoomed")
  map.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
 // map.select(".state-border").style("stroke-width", 1.5 / d3.event.scale + "px");
//  map.select(".county-border").style("stroke-width", .5 / d3.event.scale + "px");
}
//sets scale of each initial map to fit svg
function renderMap(data, selector,width,height) {
	var projection = d3.geo.mercator().scale(1).translate([0, 0])
	var path = d3.geo.path().projection(projection);
	var b = path.bounds(data)
	var s = config.zoom / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height)
	var t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2]
	//console.log([b,s,t])

	projection.scale(s).translate(t);
	
	var zoom = d3.behavior.zoom()
	    .translate([0, 0])
	    .scale(1)
	    .scaleExtent([1, 8])
	    .on("zoom", zoomed);
		
	var svg = d3.select(selector).append("svg")
		.attr('height', width)
		.attr('width', height);
		
	map =  svg.selectAll(".map").append("g")
		
	svg.append("rect")
	    .attr("class", "overlay")
	    .attr("width", width)
	    .attr("height", height)
		.attr("fill","#fff")
	    .call(zoom);
			
	map.append("path")
		.data(data.features)
		.enter()
		.append("path")
		.attr("d", path)
		.attr("class", "map-item")
		.attr("cursor", "pointer");

	return map
}
function drawScale(gini){
	var scale = d3.scale.linear().domain([0.1,gini,.8]).range(["green","#eee","red"]);
	var w = 200
	var h = 200
	var svg = d3.select("#scale").append("svg")
		.attr("width",w)
		.attr("height",h)
	var gradient = svg.append("svg:linearGradient")
	    .attr("x1", "0%")
	    .attr("y1", "0%")
	    .attr("x2", "100%")
	    .attr("y2", "100%")
	    .attr("spreadMethod", "pad");
	gradient.append("svg:stop")
	    .attr("offset", "0%")
	    .attr("stop-color", "#0c0")
	    .attr("stop-opacity", 1);
	gradient.append("svg:stop")
	    .attr("offset", "100%")
	    .attr("stop-color", "#c00")
	    .attr("stop-opacity", 1);
	svg.append("svg:rect")
	    .attr("width", w)
	    .attr("height", h)
	    .style("fill", "url(#gradient)");
}
function renderNycMap(data, column,svg,low,high,gini) {
	var map = d3.select(svg).selectAll(".map-item")
	var companiesByZipcode = table.group(data, ["Id"])
	var colorScale = function(d) {
		//var greenscale = d3.scale.linear().domain([0,1]).range(["#aaa","green"]); 
		//var redscale = d3.scale.linear().domain([0,1]).range(["#aaa","red"]); 
		var scale = d3.scale.linear().domain([0.1,gini,.8]).range(["green","#eee","red"]);
		
		var x = companiesByZipcode[d.properties.GEOID]
		if(!x){
			return "#fff"
		}else{
			if(isNaN(x[0]["Gini"])) {
				return "#fff"
			}
			return scale(x[0]["Gini"])
		}
	}
	//var column = "Gini"


	map.attr("stroke-opacity", 0)
		.attr("stroke","#000")
		.attr("fill-opacity", 1)
		.attr("fill",  colorScale)
		.attr("opacity",1)
		
		var tip = d3.tip()
		  .attr('class', 'd3-tip-nyc')
		  .offset([-10, 0])
	
		map.call(tip);
		map.on('mouseover', function(d){
			var currentZipcode = d.properties.GEOID
			var currentIncome = table.group(data, ["Id"])[currentZipcode][0][column]
			var currentGini = companiesByZipcode[d.properties.GEOID][0].Gini
			
			if(table.group(data, ["Id"])[currentZipcode]){
				if(isNaN(currentIncome)){
					currentIncome = "NA"
				}
				tipText = "Median Household Income: $"+ currentIncome +"<br/> Gini: "+currentGini
				tip.html(function(d){return tipText})
				tip.show()
			}else{
				tip.html("not in income range")
				tip.show()
			}
			var currentZipcode = d.properties.GEOID
			var currentIncome = table.group(data, ["Id"])[currentZipcode][0][column]
			
			
		})
		.on('mouseout', function(d){
			tip.hide()
		})
		.on("click",function(d){
			var currentZipcode = d.properties.GEOID
			var currentIncome = table.group(data, ["Id"])[currentZipcode][0][column]
			if(!isNaN(currentIncome)){
				var high = parseInt(currentIncome*1.1)
				var low = parseInt(currentIncome*0.9)
				d3.select("#income-label").html("You selected household income of $"+currentIncome
				+"<br/>Showing income 10% above and below selection: $"+low+" - $"+high)
				tip.hide()
			var filteredData = filterData(data,low,high)
				var distribution = calculateDistribution(filteredData)
				var variance = distribution.variance
				drawCurrentVariance(variance,currentIncome)
				var currentGini = companiesByZipcode[d.properties.GEOID][0].Gini
				redrawFilteredMaps(low,high,currentGini,currentIncome)
			}		
			d3.select(this).attr("fill","#000")
				
		})
	return map
}
