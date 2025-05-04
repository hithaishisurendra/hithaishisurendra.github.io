function drawBumpChart(container) {

  d3.csv("data/Constructor_bumpchart.csv").then(rawData => {

    rawData.forEach(d => {
      d.year        = +d.year;
      d.rank        = +d.rank;
      d.points      = +d.points;
      d.constructor = d.constructor.trim();
    });
  const nameMap = {
    "Force India Mercedes": "Aston Martin",
    "Racing Point BWT Mercedes": "Aston Martin",
    "Aston Martin Mercedes": "Aston Martin",
    "Aston Martin Aramco Mercedes": "Aston Martin",
    "Red Bull Racing Renault": "Red Bull",
    "Red Bull Racing TAG Heuer": "Red Bull",
    "Red Bull Racing Honda": "Red Bull",
    "Red Bull Racing RBPT": "Red Bull",
    "Red Bull Racing Honda RBPT": "Red Bull",
    "RB Honda RBPT": "Alpha Tauri",
    "STR Renault": "Alpha Tauri",
    "Toro Rosso": "Alpha Tauri",
    "Toro Rosso Ferrari": "Alpha Tauri",
    "Scuderia Toro Rosso Honda": "Alpha Tauri",
    "AlphaTauri": "Alpha Tauri",
    "AlphaTauri Honda": "Alpha Tauri",
    "AlphaTauri RBPT": "Alpha Tauri",
    "McLaren Honda": "McLaren",
    "McLaren Renault": "McLaren",
    "McLaren Mercedes": "McLaren",
    "Alfa Romeo Racing Ferrari": "Alfa Romeo",
    "Alfa Romeo Ferrari": "Alfa Romeo",
    "Williams Mercedes": "Williams",
    "Lotus Mercedes": "Lotus",
    "Sauber Ferrari": "Sauber",
    "Haas Ferrari": "Haas"
  };
  rawData.forEach(d => {
    if (nameMap[d.constructor]) d.constructor = nameMap[d.constructor];
  });

  const years        = Array.from(new Set(rawData.map(d => d.year))).sort((a,b)=>a-b);
    const constructors = Array.from(new Set(rawData.map(d => d.constructor))).sort();

    const engineMap = {
    "Ferrari": y => "Ferrari",
    "Mercedes": _ => "Mercedes",
    "Red Bull": y => y <= 2018 ? "Renault" : y <= 2024 ? "Honda" : "Red Bull Powertrains",
    "McLaren": y => y === 2014 ? "Mercedes" : y <= 2017 ? "Honda" : y <= 2020 ? "Renault" : "Mercedes",
    "Renault": _ => "Renault",
    "Alpine Renault": _ => "Renault",
    "Williams": _ => "Mercedes",
    "Lotus": _ => "Mercedes",
    "Aston Martin": _ => "Mercedes",
    "Alpha Tauri": y => y === 2015 ? "Renault" : y <= 2018 ? "Ferrari" : "Honda",
    "Alfa Romeo": _ => "Ferrari",
    "Sauber": _ => "Ferrari",
    "Haas": _ => "Ferrari"
  };

  const engineLetters = {
    "Ferrari": "F", "Mercedes": "M", "Renault": "R", 
    "Honda": "H", "Red Bull Powertrains": "P"
  };
  const teamColors = {
    "Ferrari": "#DC0000", "Mercedes": "#00D2BE", "Red Bull": "#1E41FF",
    "McLaren": "#FF8700", "Renault": "#FFF500", "Alpine Renault": "#0090FF",
    "Williams": "#005AFF", "Lotus": "#004225", "Aston Martin": "#006F62",
    "Alpha Tauri": "#2B4562", "Alfa Romeo": "#900000", "Sauber": "#9B0000",
    "Haas": "#B388FF"
  };
  const defaultColor = "#888";


    const bumpData = constructors.map(name => ({
      name,
      ranks: years.map(year => {
        const row = rawData.find(r => r.constructor===name && r.year===year);
        return {
          year,
          rank: row   ? row.rank   : null,
          points: row ? row.points : 0,
          engine: row && engineMap[name] ? engineMap[name](year) : null
        };
    })
  }));

  const margin = { top:60, right:280, bottom:60, left:100 };
  const width = 1400, height = 700;
  const chartWidth = width - margin.left - margin.right;

  const svg = d3.select(container)
    .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
    .append("g");
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "#222")
    .style("color", "#fff")
    .style("padding", "8px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("opacity", 0);
  svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "#000");
  
  svg.append("text")
    .attr("class", "chart-title")
    .attr("x", width/2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .attr("fill", "#fff")
    .text("Bump Chart: Top 8 Constructors by Season");
  const x = d3.scaleLinear()
    .domain([d3.min(years)-0.5, d3.max(years)+0.5])
    .range([margin.left, width-margin.right]);

  const y = d3.scaleLinear()
    .domain([0.5, 8.5])
    .range([margin.top, height-margin.bottom]);
  const rowHeight = y(2) - y(1);
  svg.selectAll(".row-background")
    .data(d3.range(1,9))
    .enter().append("rect")
      .attr("class", "row-background")
      .attr("x", margin.left)
      .attr("y", d => y(d) - rowHeight/2)
      .attr("width", width - margin.left - margin.right)
      .attr("height", rowHeight)
      .attr("fill", (d,i) => i%2 ? "#111" : "#222");
  const lineGen = d3.line()
    .defined(d => d.rank != null)
    .x(d => x(d.year))
    .y(d => y(d.rank))
    .curve(d3.curveMonotoneX);

  let selectedEngine = null;

  bumpData.forEach(team => {
      const color = teamColors[team.name] || defaultColor;

      svg.append("path")
        .datum(team.ranks)
        .attr("class","bump-line")
        .attr("d", d3.line()
                     .defined(d=>d.rank!=null)
                     .x(d=>x(d.year))
                     .y(d=>y(d.rank))
                     .curve(d3.curveMonotoneX)
        )
        .attr("stroke", color)
        .attr("opacity", 0)
        .transition()
          .delay(d=>( (x(d[0].year)-margin.left)/chartWidth )*2000)
          .duration(1000)
          .attr("opacity",1);
    team.ranks.forEach(d => {
      if (!d.rank) return;
      
      const nodeGroup = svg.append("g")
        .attr("class", "point-group")
        .attr("data-team", team.name)
        .attr("data-engine", d.engine)
        .attr("transform", `translate(${x(d.year)},${y(d.rank)})`)
        .attr("opacity", 0);

      nodeGroup.transition()
        .delay(((x(d.year) - margin.left)/chartWidth) * 2000)
        .duration(500)
        .attr("opacity", 1);

      nodeGroup.append("circle")
        .attr("class", "data-point")
        .attr("r", 14)
        .attr("fill", color)
        .on("mouseover", function(event) {
          tooltip.style("visibility", "visible")
          tooltip.transition().duration(200).style("opacity", 1000);
          tooltip.html(
            `<strong>${team.name}</strong><br>
            Year: ${d.year}<br>
            Position: ${d.rank}<br>
            Points: ${d.points}<br>
            Engine: ${d.engine}`
          )
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
          tooltip.transition().duration(500).style("opacity", 0)
          tooltip.on("end", () => tooltip.style("visibility", "hidden"));
        });

      nodeGroup.append("text")
        .attr("class", "node-label")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("fill", "#fff")
        .text(team.name.charAt(0));
    });
    const finalYear = d3.max(years);
    const last = team.ranks.find(d => d.year === finalYear && d.rank != null);
    if (last) {
      svg.append("text")
        .attr("class", "team-label")
        .attr("x", width - margin.right + 10)
        .attr("y", y(last.rank))
        .attr("fill", color)
        .attr("opacity", 0)
        .transition()
        .delay(((x(last.year) - margin.left)/chartWidth) * 2000)
        .duration(500)
        .attr("opacity", 1)
        .text(team.name);
    }
  });
  const engines = Array.from(
    new Set(bumpData.flatMap(t => t.ranks.map(r => r.engine).filter(e => e)))
  ).sort();

  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width - margin.right + 120},${margin.top})`);

  legend.append("text")
    .attr("class", "axis-label")
    .attr("y", -20)
    .attr("text-anchor", "end")
    .attr("fill", "#fff")
    .text("Engine");
  const items = legend.selectAll(".legend-item")
    .data(engines)
    .enter().append("g")
      .attr("class", "legend-item")
      .attr("transform", (d,i) => `translate(0,${i*30})`)
      .on("click", (event, eng) => {
        selectedEngine = selectedEngine === eng ? null : eng;
        updateFilter();
      });

  items.append("circle")
    .attr("r", 12)
    .attr("fill", "#444")
    .attr("stroke", "#fff")
    .attr("stroke-width", 2);

  items.append("text")
    .attr("class", "engine-letter")
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .attr("fill", "#fff")
    .text(d => engineLetters[d] || "?");

  items.append("text")
    .attr("x", 20)
    .attr("dy", "0.35em")
    .attr("fill", "#fff")
    .text(d => d);
  function updateFilter() {
    const teamsWithEngine = new Set();
    if (selectedEngine) {
      bumpData.forEach(team => {
        if (team.ranks.some(r => r.engine === selectedEngine)) teamsWithEngine.add(team.name);
      });
    }
    svg.selectAll(".bump-line")
      .classed("inactive", function() {
        if (!selectedEngine) return false;
        return !teamsWithEngine.has(d3.select(this).attr("data-team"));
      })
      .attr("opacity", function() {
        if (!selectedEngine) return 0.9;
        return teamsWithEngine.has(d3.select(this).attr("data-team")) ? 0.9 : 0.2;
      });

    svg.selectAll(".point-group")
      .classed("inactive", function() {
        if (!selectedEngine) return false;
        return d3.select(this).attr("data-engine") !== selectedEngine;
      });

    svg.selectAll(".data-point")
      .attr("opacity", function() {
        return d3.select(this.parentNode).classed("inactive") ? 0.2 : 1;
      });

    items.classed("active", d => d === selectedEngine);
  }
  svg.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", `translate(0,${height-margin.bottom})`)
    .call(d3.axisBottom(x).ticks(years.length).tickFormat(d3.format("d")))
    .selectAll("text").attr("dy", "1.2em").attr("fill", "#fff");

  svg.append("g")
    .attr("class", "axis axis--y")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(8).tickFormat(d3.format("d")))
    .selectAll("text").attr("dx", "-0.8em").attr("fill", "#fff");

  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", width/2)
    .attr("y", height - margin.bottom/4)
    .attr("text-anchor", "middle")
    .attr("fill", "#fff")
    .text("Season");

  svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -height/2)
    .attr("y", margin.left/3)
    .attr("text-anchor", "middle")
    .attr("fill", "#fff")
    .text("Final Standing");
});
}

window.drawBumpChart = drawBumpChart;