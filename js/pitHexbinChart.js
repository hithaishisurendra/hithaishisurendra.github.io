
function drawPitHexbin(container) {

const sel = d3.select(container).classed("visible", true);

const margin = { top: 40, right: 20, bottom: 30, left: 40 };
  const width  = +sel.style("width").replace("px","")  || 800;
  const height = +sel.style("height").replace("px","") || 600;

const innerWidth  = width  - margin.left - margin.right;
const innerHeight = height - margin.top  - margin.bottom;

  console.log("Hexbin dimensions:", width, height, margin);


d3.select(container).classed("visible", true);
const svg = d3.select(container)
   .append("svg")
     .attr("viewBox", `0 0 ${width} ${height}`)
     .attr("preserveAspectRatio", "xMidYMid meet")
     .style("width",  "100%")
     .style("height", "100%");

const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);


const tooltip = d3.select("body")
  .append("div")
    .attr("class", "tooltip");


d3.csv("/data/processed_pit_dashboard.csv", d => ({
  lap:         +d.lap,
  pitDuration: +d.pitDuration_s
})).then(rawData => {
  const data = rawData.filter(d => d.pitDuration > 0);

  const durations = data.map(d => d.pitDuration).sort(d3.ascending);
  const p95 = d3.quantile(durations, 0.95);
  const yMax = Math.min(Math.max(p95, 40), 60);

 
  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.lap))
    .range([0, innerWidth]);

  const y = d3.scaleLinear()
    .domain([10, yMax]).nice()
    .range([innerHeight, 0]);

  const hex = d3.hexbin()                
    .x(d => x(d.lap))
    .y(d => y(d.pitDuration))
    .radius(12)
    .extent([[0, 0], [innerWidth, innerHeight]]);

  const bins = hex(data);

  const maxCount = d3.max(bins, b => b.length);
  const color = d3.scaleSequential()
      .domain([0, maxCount])
      .interpolator(d3.interpolateRgb("#660000", "#ff3333"));

  g.append("g")
  .selectAll("path")
  .data(bins)
  .join("path")
    .attr("class", "hexbin-hexagon")
    .attr("d", hex.hexagon())
    .attr("transform", d => `translate(${d.x},${d.y})`)
    .attr("fill", d => color(d.length))
    .attr("stroke", "#222")
    .attr("stroke-width", 0.5)
  .on("mouseover", (event, bin) => {
    const laps  = bin.map(p => p.lap);
    const range = [d3.min(laps), d3.max(laps)];
    const avg   = d3.mean(bin, d => d.pitDuration).toFixed(1);

    tooltip
      .style("visibility", "visible")
      .style("opacity", 1)
      .style("left",  (event.pageX + 12) + "px")
      .style("top",   (event.pageY - 36) + "px")
      .html(`
        <strong>Count:</strong> ${bin.length}<br/>
        <strong>Lap range:</strong> ${range[0]}–${range[1]}<br/>
        <strong>Avg duration:</strong> ${avg} s
      `);
  })
  .on("mousemove", event => {
    tooltip
      .style("left", (event.pageX + 12) + "px")
      .style("top",  (event.pageY - 36) + "px");
  })
  .on("mouseout", () => {
    tooltip
      .style("opacity", 0)
      .style("visibility", "hidden");
  });

  const xAxis = d3.axisBottom(x)
      .ticks(10)
      .tickSize(-innerHeight)
      .tickPadding(8);

  const yAxis = d3.axisLeft(y)
      .ticks(6)
      .tickFormat(d => `${d}s`)
      .tickSize(-innerWidth)
      .tickPadding(8);

 
  g.append("g")
    .attr("class", "y-axis axis")
    .call(yAxis)
    .call(g => g.selectAll("line").attr("stroke", "#444"))
    .call(g => g.selectAll("path").remove())
    .call(g => g.selectAll("text").attr("fill", "#ddd"));


  g.append("g")
    .attr("class", "x-axis axis")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(xAxis)
    .call(g => g.selectAll("line").attr("stroke", "#444"))
    .call(g => g.selectAll("path").remove())
    .call(g => g.selectAll("text").attr("fill", "#ddd"));


  g.append("text")
    .attr("x", innerWidth/2)
    .attr("y", innerHeight + 40)
    .attr("text-anchor", "middle")
    .attr("fill", "#ddd")
    .text("Lap Number");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerHeight/2)
    .attr("y", -45)
    .attr("text-anchor", "middle")
    .attr("fill", "#ddd")
    .text("Pit Duration (s)");
});
}

window.drawPitHexbin = drawPitHexbin;