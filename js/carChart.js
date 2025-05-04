const panel = d3.select("#chartPanel");
const chartArea = d3.select("#chartArea");
const chartTitle = d3.select("#chartTitle");

d3.select("#closeBtn").on("click", () => panel.classed("hidden", true));

function clearChart() {
  chartArea.selectAll("*").remove();
}

function openPanel() {
  panel.classed("hidden", false);
}

const drsSpeedData = [
  { driver: "VER", withDRS: 343, withoutDRS: 320 },
  { driver: "LEC",    withDRS: 338, withoutDRS: 319 },
  { driver: "HAM",   withDRS: 336, withoutDRS: 317 },
  { driver: "NOR",     withDRS: 334, withoutDRS: 315 },
  { driver: "RUS",    withDRS: 333, withoutDRS: 314 },
  { driver: "SAI",      withDRS: 332, withoutDRS: 313 }
];

function loadFrontWingViz() {
  clearChart();
  openPanel();
  chartTitle.text("Front Wing Aerodynamics: Downforce vs Drag");

  const margin = { top: 40, right: 30, bottom: 80, left: 60 },
        width = 500 - margin.left - margin.right,
        height = 350 - margin.top - margin.bottom;

  const svg = chartArea.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const data = [
    { scenario: "Low Downforce", downforce: 40, drag: 20 },
    { scenario: "High Downforce", downforce: 80, drag: 50 }
  ];

  const x = d3.scaleBand()
    .domain(data.map(d => d.scenario))
    .range([0, width])
    .padding(0.4);

  const y = d3.scaleLinear()
    .domain([0, 100])
    .range([height, 0]);

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("fill", "#fff");

  svg.append("g")
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`))
    .selectAll("text")
    .style("fill", "#fff");

  svg.selectAll(".bar-downforce")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", d => x(d.scenario))
    .attr("y", height)
    .attr("width", x.bandwidth() / 2 - 5)
    .attr("height", 0)
    .attr("fill", "blue")
    .transition()
    .duration(1000)
    .attr("y", d => y(d.downforce))
    .attr("height", d => height - y(d.downforce));

  svg.selectAll(".bar-drag")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", d => x(d.scenario) + x.bandwidth() / 2 + 5)
    .attr("y", height)
    .attr("width", x.bandwidth() / 2 - 5)
    .attr("height", 0)
    .attr("fill", "orange")
    .transition()
    .duration(1000)
    .attr("y", d => y(d.drag))
    .attr("height", d => height - y(d.drag));

  svg.selectAll(".label-downforce")
    .data(data)
    .enter()
    .append("text")
    .attr("x", d => x(d.scenario) + x.bandwidth() / 4)
    .attr("y", d => y(d.downforce) - 10)
    .attr("text-anchor", "middle")
    .text(d => `${d.downforce}%`)
    .style("fill", "#fff")
    .style("font-size", "12px");

  svg.selectAll(".label-drag")
    .data(data)
    .enter()
    .append("text")
    .attr("x", d => x(d.scenario) + (3 * x.bandwidth()) / 4)
    .attr("y", d => y(d.drag) - 10)
    .attr("text-anchor", "middle")
    .text(d => `${d.drag}%`)
    .style("fill", "#fff")
    .style("font-size", "12px");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("fill", "#fff")
    .style("font-size", "16px")
    .text("Front Wing Aerodynamics");

  svg.append("text")
    .attr("x", -height / 2)
    .attr("y", -40)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .style("fill", "#fff")
    .style("font-size", "14px")
    .text("Percentage");

  chartArea.append("p")
    .style("color", "#fff")
    .style("font-size", "14px")
    .style("margin-top", "10px")
    .text("This graph compares the aerodynamic characteristics of the front wing in terms of downforce and drag under different scenarios. High downforce increases drag, while low downforce reduces it.");
}

function loadTyreViz() {
    clearChart();
    openPanel();
    chartTitle.text("Tyre Compound Characteristics (Pirelli 2024)");
  
    const margin = { top: 50, right: 80, bottom: 100, left: 80 },
          width = 350,
          height = 250,
          radius = Math.min(width, height) / 2,
          levels = 5;
  
    const svg = chartArea.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${width / 2 + margin.left}, ${height / 2 + margin.top})`);

    const data = [
      { axis: "Grip", Soft: 90, Medium: 75, Hard: 60, Intermediate: 70, Wet: 55 },
      { axis: "Warm-up Speed", Soft: 85, Medium: 70, Hard: 50, Intermediate: 80, Wet: 60 },
      { axis: "Durability", Soft: 40, Medium: 70, Hard: 90, Intermediate: 60, Wet: 50 },
      { axis: "Temperature Range", Soft: 60, Medium: 80, Hard: 95, Intermediate: 70, Wet: 100 },
      { axis: "Degradation", Soft: 50, Medium: 70, Hard: 90, Intermediate: 50, Wet: 60 }
    ];
  
    const angleSlice = (Math.PI * 2) / data.length;
    const rScale = d3.scaleLinear().domain([0, 100]).range([0, radius]);

    for (let i = 0; i < levels; i++) {
      const levelFactor = (i + 1) / levels;
      svg.selectAll(`.grid-level-${i}`)
        .data([data])
        .enter()
        .append("polygon")
        .attr("points", d => d.map((point, j) => {
          const x = rScale(100 * levelFactor) * Math.cos(angleSlice * j - Math.PI / 2);
          const y = rScale(100 * levelFactor) * Math.sin(angleSlice * j - Math.PI / 2);
          return `${x},${y}`;
        }).join(" "))
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("stroke-dasharray", "2,2");
    }

    svg.selectAll(".axis-line")
      .data(data)
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", (d, i) => rScale(100) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y2", (d, i) => rScale(100) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr("stroke", "#ccc");
  
    svg.selectAll(".axis-label")
      .data(data)
      .enter()
      .append("text")
      .attr("x", (d, i) => (rScale(128) * Math.cos(angleSlice * i - Math.PI / 2)))
      .attr("y", (d, i) => (rScale(128) * Math.sin(angleSlice * i - Math.PI / 2)))
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .text(d => d.axis)
      .style("fill", "#fff");

    const colors = {
      Soft: "red",
      Medium: "yellow",
      Hard: "grey",
      Intermediate: "green",
      Wet: "blue"
    };

    Object.keys(colors).forEach(compound => {
      const path = svg.append("path")
        .datum(data.map(d => ({ axis: d.axis, value: d[compound] })))
        .attr("d", d3.lineRadial()
          .radius(d => rScale(d.value))
          .angle((d, i) => i * angleSlice))
        .attr("fill", colors[compound])
        .attr("fill-opacity", 0.2)
        .attr("stroke", colors[compound])
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", function() { return this.getTotalLength(); })
        .attr("stroke-dashoffset", function() { return this.getTotalLength(); });
  
      path.transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);
    });
  
    const legend = svg.append("g")
      .attr("transform", `translate(${-width / 2 - 40}, ${height / 2 + 50})`);

    const legendOrder = ["Soft", "Medium", "Hard", "Intermediate", "Wet"];
  
    legendOrder.forEach((compound, i) => {
      legend.append("circle")
        .attr("cx", i * 100)
        .attr("cy", 0)
        .attr("r", 6)
        .style("fill", colors[compound]);
  
      legend.append("text")
        .attr("x", i * 100 + 15)
        .attr("y", 5)
        .text(compound)
        .style("fill", "#fff")
        .style("font-size", "12px");
    });
}  

function loadCockpitViz() {
  clearChart();
  openPanel();
  chartTitle.text("Driver Impact Statistics: With vs Without Halo");

  const margin = { top: 40, right: 30, bottom: 80, left: 60 },
        width = 500 - margin.left - margin.right,
        height = 350 - margin.top - margin.bottom;

  const svg = chartArea.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const data = [
    { scenario: "Without Halo", impact: 80 },
    { scenario: "With Halo", impact: 20 }
  ];

  const x = d3.scaleBand()
    .domain(data.map(d => d.scenario))
    .range([0, width])
    .padding(0.4);

  const y = d3.scaleLinear()
    .domain([0, 100])
    .range([height, 0]);

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("fill", "#fff");

  svg.append("g")
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`))
    .selectAll("text")
    .style("fill", "#fff");

  svg.selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", d => x(d.scenario))
    .attr("y", height)
    .attr("width", x.bandwidth())
    .attr("height", 0)
    .attr("fill", d => d.scenario === "With Halo" ? "green" : "red")
    .transition()
    .duration(1000)
    .attr("y", d => y(d.impact))
    .attr("height", d => height - y(d.impact));

  svg.selectAll(".label")
    .data(data)
    .enter()
    .append("text")
    .attr("x", d => x(d.scenario) + x.bandwidth() / 2)
    .attr("y", d => y(d.impact) - 10)
    .attr("text-anchor", "middle")
    .text(d => `${d.impact}%`)
    .style("fill", "#fff")
    .style("font-size", "12px");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("fill", "#fff")
    .style("font-size", "16px")
    .text("Driver Impact Statistics");

  svg.append("text")
    .attr("x", -height / 2)
    .attr("y", -40)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .style("fill", "#fff")
    .style("font-size", "14px")
    .text("Impact Percentage");

  chartArea.append("p")
    .style("color", "#fff")
    .style("font-size", "14px")
    .style("margin-top", "10px")
    .text("This graph compares the impact on drivers with and without the halo. The halo significantly reduces the impact percentage, enhancing driver safety.");
}

function loadEngineViz() {
    clearChart();
    openPanel();
    chartTitle.text("F1 Engine Evolution: Power vs RPM");
  
    const margin = { top: 50, right: 30, bottom: 70, left: 80 },
          width = 500 - margin.left - margin.right,
          height = 350 - margin.top - margin.bottom;
  
    const svg = chartArea.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    const engineEraData = [
      { engine: "V12", power: 760, rpm: 15000 },
      { engine: "V10", power: 900, rpm: 19000 },
      { engine: "V8", power: 750, rpm: 18000 },
      { engine: "V6 Hybrid", power: 1050, rpm: 15000 }
    ];
  
    const x = d3.scaleBand()
      .domain(engineEraData.map(d => d.engine))
      .range([0, width])
      .padding(0.2);
  
    const yPower = d3.scaleLinear()
      .domain([700, 1100])
      .range([height, 0]);
  
    const ballSizeScale = d3.scaleLinear()
      .domain([12000, 20000])
      .range([10, 25]);

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-20)")
      .style("text-anchor", "end")
      .style("fill", "#fff");

    svg.append("g")
      .call(d3.axisLeft(yPower))
      .selectAll("text")
      .style("fill", "#fff");
  
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height/2)
      .attr("y", -50)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("fill", "#fff")
      .style("font-size", "14px")
      .text("BHP");

    svg.selectAll(".stick")
      .data(engineEraData)
      .enter()
      .append("line")
      .attr("x1", d => x(d.engine) + x.bandwidth()/2)
      .attr("x2", d => x(d.engine) + x.bandwidth()/2)
      .attr("y1", yPower(700))
      .attr("y2", yPower(700))
      .attr("stroke", "#888")
      .attr("stroke-width", 10)
      .transition()
      .duration(1000)
      .attr("y2", d => yPower(d.power));
  
    svg.selectAll(".ball")
      .data(engineEraData)
      .enter()
      .append("circle")
      .attr("cx", d => x(d.engine) + x.bandwidth()/2)
      .attr("cy", yPower(700))
      .attr("r", 0)
      .style("fill", "#ff4040")
      .transition()
      .delay((d, i) => i * 300)
      .duration(500)
      .attr("r", d => ballSizeScale(d.rpm))
      .attr("cy", d => yPower(d.power));
  
    svg.selectAll(".rpm-label")
      .data(engineEraData)
      .enter()
      .append("text")
      .attr("x", d => x(d.engine) + x.bandwidth()/2)
      .attr("y", d => yPower(d.power) + 4) 
      .attr("text-anchor", "middle")
      .text(d => `${d.rpm/1000}k`)
      .style("fill", "#fff")
      .style("font-size", "9.6px")
      .style("pointer-events", "none");

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 10)
      .attr("text-anchor", "middle")
      .style("fill", "#fff")
      .style("font-size", "14px")
      .text("Engine type");
}

function loadRearWingViz() {
    clearChart();
    openPanel();
    chartTitle.text("DRS vs Non-DRS Average Top Speeds (Selected 2024 Races)");

    const margin = {top: 40, right: 30, bottom: 80, left: 60},
          width = 500 - margin.left - margin.right,
          height = 350 - margin.top - margin.bottom;

    const svg = chartArea.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const drivers = drsSpeedData.map(d => d.driver);

    const x = d3.scalePoint()
      .domain(drivers)
      .range([0, width])
      .padding(0.5);

    const y = d3.scaleLinear()
      .domain([300, 350])
      .nice()
      .range([height, 0]);

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .style("opacity", 0)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-25)")
      .style("text-anchor", "end")
      .style("fill", "#fff");

    svg.append("g")
      .style("opacity", 0)
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("fill", "#fff");

    svg.selectAll("g")
      .transition()
      .duration(1000)
      .style("opacity", 1);

    const lineWithDRS = d3.line()
      .x(d => x(d.driver))
      .y(d => y(d.withDRS))
      .curve(d3.curveMonotoneX);

    const lineWithoutDRS = d3.line()
      .x(d => x(d.driver))
      .y(d => y(d.withoutDRS))
      .curve(d3.curveMonotoneX);

    const pathWithDRS = svg.append("path")
      .datum(drsSpeedData)
      .attr("fill", "none")
      .attr("stroke", "green")
      .attr("stroke-width", 3)
      .attr("d", lineWithDRS)
      .attr("stroke-dasharray", function() { return this.getTotalLength(); })
      .attr("stroke-dashoffset", function() { return this.getTotalLength(); });

    const pathWithoutDRS = svg.append("path")
      .datum(drsSpeedData)
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 3)
      .attr("d", lineWithoutDRS)
      .attr("stroke-dasharray", function() { return this.getTotalLength(); })
      .attr("stroke-dashoffset", function() { return this.getTotalLength(); });

    pathWithDRS.transition()
      .duration(2000)
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0);

    pathWithoutDRS.transition()
      .duration(2000)
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0);

    svg.selectAll(".dot-drs")
      .data(drsSpeedData)
      .enter()
      .append("circle")
      .attr("cx", d => x(d.driver))
      .attr("cy", d => y(d.withDRS))
      .attr("r", 0)
      .attr("fill", "green")
      .transition()
      .delay((d, i) => i * 200)
      .duration(500)
      .attr("r", 4);

    svg.selectAll(".dot-nondrs")
      .data(drsSpeedData)
      .enter()
      .append("circle")
      .attr("cx", d => x(d.driver))
      .attr("cy", d => y(d.withoutDRS))
      .attr("r", 0)
      .attr("fill", "red")
      .transition()
      .delay((d, i) => i * 200)
      .duration(500)
      .attr("r", 4);

    svg.append("circle").attr("cx", 10).attr("cy", height + 40).attr("r", 6).style("fill", "green");
    svg.append("text").attr("x", 25).attr("y", height + 45).text("With DRS").style("fill", "#fff").style("font-size", "12px");

    svg.append("circle").attr("cx", 130).attr("cy", height + 40).attr("r", 6).style("fill", "red");
    svg.append("text").attr("x", 145).attr("y", height + 45).text("Without DRS").style("fill", "#fff").style("font-size", "12px");
}

d3.select("#hotspot-frontwing").on("click", loadFrontWingViz);
d3.select("#hotspot-frontleftwheel").on("click", loadTyreViz);
d3.select("#hotspot-frontrightwheel").on("click", loadTyreViz);
d3.select("#hotspot-rearleftwheel").on("click", loadTyreViz);
d3.select("#hotspot-rearrightwheel").on("click", loadTyreViz);
d3.select("#hotspot-cockpit").on("click", loadCockpitViz);
d3.select("#hotspot-rearwing").on("click", loadRearWingViz);
d3.select("#hotspot-engine").on("click", loadEngineViz);
