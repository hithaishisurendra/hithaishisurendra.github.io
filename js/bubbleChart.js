// bubbleChart.js
function drawBubbleChart(container) {
  const sel = d3.select(container);
  sel.selectAll("*").remove();

  const { width, height } = container.getBoundingClientRect();
  const diameter = Math.min(width, height);


  const tooltip = d3.select("body")
  .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("pointer-events", "none");

  d3.csv("/data/driver_race_wins.csv").then(data => {

    const winsByDriver = d3.rollup(
      data,
      v => v.length,
      d => d.forename + " " + d.surname
    );
    const formattedData = Array.from(
      winsByDriver,
      ([name, wins]) => ({ name, wins })
    );

 
    const root = d3.pack()
      .size([diameter, diameter])
      .padding(5)(
        d3.hierarchy({ children: formattedData })
          .sum(d => d.wins)
      );

  
    const svg = sel
      .append("svg")
        .attr("viewBox", `0 0 ${diameter} ${diameter}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("width", "100%")
        .style("height", "100%");

    const color = d3.scaleOrdinal(d3.schemeTableau10);

   
    const node = svg.selectAll("g")
      .data(root.leaves())
      .join("g")
        .attr("transform", d => `translate(${d.x},${d.y})`);

    node.append("circle")
      .attr("r", d => d.r)
      .attr("fill", d => color(d.data.name))
      .on("mouseover", (e, d) => {
        tooltip.style("visibility", "visible") 
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip
          .html(`<strong>${d.data.name}</strong><br/>🏁 ${d.data.wins} wins`)
          .style("left", `${e.pageX + 10}px`)
          .style("top",  `${e.pageY - 20}px`);
      })
      .on("mousemove", (e) => {
        tooltip
          .style("left", `${e.pageX + 10}px`)
          .style("top",  `${e.pageY - 20}px`);
      })
      .on("mouseout", () =>
        tooltip.transition().duration(300).style("opacity", 0)
      );

    node.append("text")
      .attr("dy", "0.3em")
      .style("text-anchor", "middle")
      .style("fill", "#fff")
      .style("font-size", d => Math.min(2*d.r/d.data.name.length, 14))
      .text(d => d.data.name);
  }).catch(console.error);
}


window.drawBubbleChart = drawBubbleChart;
