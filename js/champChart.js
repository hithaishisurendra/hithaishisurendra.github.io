function drawChampionsChart(container) {

d3.csv("/data/champions.csv").then(data => {
  const margin = { top: 40, right: 200, bottom: 40, left: 200 },
        width = 1200 - margin.left - margin.right,
        height = 800 - margin.top - margin.bottom;

  const svg = d3.select(container)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .style("overflow", "visible")  
    .attr("transform", `translate(${margin.left},${margin.top})`);

  data.forEach(d => {
    d.year = +d.year;
  });

  const years = [...new Set(data.map(d => d.year))].sort((a, b) => a - b);
  const drivers = d3.groups(data, d => d.driver)
    .map(([driver, wins]) => ({ driver, wins }));

  const multiChampions = drivers.filter(d => d.wins.length > 1);
  const driversSorted = multiChampions.sort((a, b) => b.wins.length - a.wins.length);

  const xScale = d3.scalePoint()
    .domain(years)
    .range([0, width]);

  const xLinear = d3.scaleLinear()
    .domain(d3.extent(years))
    .range([0, width]);

  const yScale = d3.scalePoint()
    .domain(driversSorted.map(d => d.driver))
    .range([0, height]);

  const color = d3.scaleOrdinal(d3.schemeTableau10);

  
  const eras = [
    { name: "Pre-War Influence Era", start: 1950, end: 1958, color: "#3a3a3a" },
    { name: "Cosworth DFV Era", start: 1967, end: 1975, color: "#2a2a2a" },
    { name: "Turbo Era", start: 1977, end: 1988, color: "#242424" },
    { name: "V10 Era", start: 1995, end: 2005, color: "#3f3f3f" },
    { name: "Hybrid Era", start: 2014, end: 2020, color: "#4a4a4a" }
  ];


  const eraCount = eras.length;
  const bandWidth = width / eraCount;

  svg.selectAll(".era-band")
    .data(eras)
    .enter()
    .append("rect")
    .attr("class", "era-band")
    .attr("x", (d, i) => i * bandWidth)
    .attr("y", -margin.top)
    .attr("width", bandWidth)
    .attr("height", height + margin.top + margin.bottom)
    .attr("fill", d => d.color)
    .attr("opacity", 0.3);

  svg.selectAll(".era-label")
    .data(eras)
    .enter()
    .append("text")
    .attr("x", (d, i) => i * bandWidth + 5)
    .attr("y", -10)
    .attr("text-anchor", "start")
    .attr("fill", "#aaa")
    .style("font-size", "12px")
    .text(d => d.name);

  
  
  const tooltip = d3.select("body").append("div")
    .style("position", "absolute")
    .style("background", "#333")
    .style("color", "#fff")
    .style("padding", "6px 10px")
    .style("border-radius", "5px")
    .style("font-size", "13px")
    .style("pointer-events", "none")
    .style("display", "none");


  svg.selectAll(".slope-line")
    .data(driversSorted)
    .enter()
    .append("path")
    .attr("class", "slope-line")
    .attr("fill", "none")
    .attr("stroke", d => color(d.driver))
    .attr("stroke-width", d => d.wins.length > 3 ? 4 : 2)
    .each(function(d) {
      const path = d3.select(this);
      const lineGen = d3.line()
        .x(win => xScale(win.year))
        .y(() => yScale(d.driver));
      const pathData = lineGen(d.wins);
      path.attr("d", pathData);
      const totalLength = path.node().getTotalLength();
      path
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(2000)
        .attr("stroke-dashoffset", 0);
    })
    .attr("d", d => {
      return d3.line()
        .x(win => xScale(win.year))
        .y(() => yScale(d.driver))
        (d.wins);
    })
    .on("mouseover", function (event, d) {
      d3.selectAll(".slope-line").style("opacity", 0.1);
      d3.select(this).style("opacity", 1).attr("stroke-width", 4);
    })
    .on("mouseout", function () {
      d3.selectAll(".slope-line").style("opacity", 1)
        .attr("stroke-width", d => d.wins.length > 3 ? 4 : 2);
    });


  svg.selectAll(".win-dot")
    .data(multiChampions.flatMap(d => d.wins.map(w => ({ ...w, driver: d.driver }))))
    .enter()
    .append("circle")
    .attr("cx", d => xScale(d.year))
    .attr("cy", d => yScale(d.driver))
    .attr("r", 4)
    .attr("fill", d => color(d.driver))
    .on("mouseover", (event, d) => {
      tooltip.style("display", "block")
        .html(`<strong>${d.driver}</strong><br>Year: ${d.year}<br>Team: ${d.team}<br>Titles: ${driversSorted.find(x => x.driver === d.driver).wins.length}`);
    })
    .on("mousemove", (event) => {
      tooltip.style("left", (event.pageX + 12) + "px")
             .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => tooltip.style("display", "none"));


  svg.selectAll(".label-left")
    .data(driversSorted)
    .enter()
    .append("text")
    .attr("x", -10)
    .attr("y", d => yScale(d.driver))
    .attr("dy", "0.35em")
    .attr("text-anchor", "end")
    .attr("fill", "#ccc")
    .text(d => d.driver);


  svg.selectAll(".label-right")
    .data(driversSorted)
    .enter()
    .append("text")
    .attr("x", width + 10)
    .attr("y", d => yScale(d.driver))
    .attr("dy", "0.35em")
    .attr("text-anchor", "start")
    .attr("fill", "#ccc")
    .text(d => d.driver);


  svg.append("g")
    .attr("transform", `translate(0,${height + 20})`)
    .call(d3.axisBottom(xScale).tickValues(years.filter(y => y % 5 === 0)));
});
}

window.drawChampionsChart = drawChampionsChart;
