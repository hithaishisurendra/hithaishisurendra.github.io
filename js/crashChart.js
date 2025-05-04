function drawCrashChart(containerEl) {

  
  const fullW = containerEl.clientWidth;
  const fullH = containerEl.clientHeight;
  const margin = { top: 80, right: 80, bottom: 80, left: 80 };
  const width  = fullW - margin.left - margin.right;
  const height = fullH - margin.top  - margin.bottom;


  const svgBox = d3.select(containerEl)
      .append('svg')
      .attr('width',  fullW)
      .attr('height', fullH);

  const g = svgBox.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

  const tooltip = d3.select(containerEl)
     .append('div')
     .attr('class','tooltip')
     .style('opacity',0);

d3.select(containerEl)
  .on("mouseleave", () => {
    tooltip
      .style("opacity", 0)
      .style("visibility", "hidden");
  });

  d3.json('/data/crashes_and_fatalities_by_year.json').then(data => {
    data.forEach((d) => {
      d.year = +d.year;
      d.crashes = +d.crashes;
      d.fatalities = +d.fatalities;
    });

    const x = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.year))
      .range([0, width]);

    const y1 = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.crashes)])
      .nice()
      .range([height, 0]);

    g.append("g")
      .attr("class", "grid y-grid")
      .call(d3.axisLeft(y1).ticks(5).tickSize(-width).tickFormat(""))
      .call((g) =>
        g
          .selectAll("line")
          .attr("stroke", "#333")
          .attr("stroke-dasharray", "2,2")
      )
      .call((g) => g.selectAll("path").remove());

    const xAxis = g
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .attr("class", "x axis")
      .call(
        d3
          .axisBottom(x)
          .tickFormat(d3.format("d"))
          .tickSize(-height * 0.1)
          .tickPadding(8)
      )
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll("line").attr("stroke", "#555"))
      .call((g) =>
        g
          .selectAll("text")
          .attr("fill", "#aaa")
          .style("font-size", "12px")
          .style("font-family", "Orbitron")
      );

   
    const yAxis = g
      .append("g")
      .attr("class", "y axis")
      .call(
        d3
          .axisLeft(y1)
          .ticks(5)
          .tickSize(-width * 0.02) 
          .tickPadding(8)
      )
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll("line").attr("stroke", "#555"))
      .call((g) =>
        g
          .selectAll("text")
          .attr("fill", "#aaa")
          .style("font-size", "12px")
          .style("font-family", "Orbitron")
      );


    svgBox
      .append("text")
      .attr("class", "x-label")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 20)
      .attr("text-anchor", "middle")
      .attr("fill", "#ccc")
      .style("font-size", "14px")
      .style("font-family", "Orbitron")
      .text("Year");

    svgBox
      .append("text")
      .attr("class", "y-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -margin.left + 20)
      .attr("text-anchor", "middle")
      .attr("fill", "#ccc")
      .style("font-size", "14px")
      .style("font-family", "Orbitron")
      .text("Number of Accidents");

   
    const crashLine = d3
      .line()
      .x((d) => x(d.year))
      .y((d) => y1(d.crashes));

    const crashPath = g
      .append("path")
      .datum(data)
      .attr("class", "crash-line")
      .attr("d", crashLine);

    const animationDuration = 10000;
    const totalLength = crashPath.node().getTotalLength();
    crashPath
      .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(animationDuration)
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0);

    
    const bisectYear = d3.bisector((d) => d.year).left;

    g.append("rect")
      .attr("class", "hover-overlay")
      .attr("width", width)
      .attr("height", height)
      .style("fill", "none")
      .style("pointer-events", "all")
      .on("mousemove", (event) => {
        const [mx] = d3.pointer(event);
        const x0 = x.invert(mx); 
        const i = bisectYear(data, x0);
        const d0 = data[i - 1];
        const d1 = data[i];
        const dClosest = !d1 || x0 - d0.year < d1.year - x0 ? d0 : d1;

        tooltip
          .style("visibility", "visible")
          .style("opacity", 1)  
          .html(
            `<strong>${dClosest.year}</strong><br/>` +
              `${dClosest.crashes} accident${dClosest.crashes > 1 ? "s" : ""}`
          )
          const [cx, cy] = d3.pointer(event, containerEl);
     tooltip
        .style("top",  `${cy - 10}px`)
        .style("left", `${cx + 10}px`);
      })
      .on("mouseout", () => {
              tooltip
        .style("opacity", 0)
        .style("visibility", "hidden");
      });

    const rScale = d3
      .scaleSqrt()
      .domain([0, d3.max(data, (d) => d.fatalities)])
      .range([0, 8]);

    g.selectAll(".fatality-dot")
      .data(data.filter((d) => d.fatalities > 0))
      .enter()
      .append("circle")
      .attr("class", "fatality-dot")
      .attr("cx", (d) => x(d.year))
      .attr("cy", (d) => y1(d.crashes) - 10)
      .attr("r", (d) => rScale(d.fatalities))
      .attr("opacity", 0)
      .on("mouseover", (e, d) => {
        tooltip
          .style("visibility", "visible")
          .style("opacity", 1)
          .html(
            `<strong>${d.year}</strong><br/>` +
              `${d.fatalities} fatalit${d.fatalities > 1 ? "ies" : "y"}`
          );
      })
      .on("mousemove", (e) => {
        tooltip
          .style("top", `${e.pageY - 10}px`)
          .style("left", `${e.pageX + 10}px`);
      })
      .on("mouseout", () => tooltip.style("visibility", "hidden"))
      .transition()
      .delay((d) => (x(d.year) / width) * animationDuration)
      .duration(200)
      .attr("opacity", 0.7);

    const safety = [
      { year: 1952, name: "Mandatory Helmets" },
      { year: 1962, name: "Lotus 25 Monocoque" },
      { year: 1973, name: "Safety Car Debut" },
      { year: 1975, name: "Fire-Resistant Suits" },
      { year: 1981, name: "Survival Cell" },
      { year: 1996, name: "Headrests" },
      { year: 2003, name: "HANS Device" },
      { year: 2018, name: "Halo Protection" },
    ];

    const crashMap = new Map(data.map((d) => [d.year, d.crashes]));
    const stemLength = 150;

    const annos = g
      .selectAll(".annotation")
      .data(safety)
      .enter()
      .append("g")
      .attr("class", "annotation")
      .attr("opacity", 0)
      .attr("transform", (d) => {
        const cx = x(d.year);
        const cy = y1(crashMap.get(d.year));
        return `translate(${cx}, ${cy})`;
      })
      .each(function (d) {
        const g = d3.select(this);
        g.append("line")
          .attr("class", "annotation-line")
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", 0)
          .attr("y2", -stemLength);
        const txt = g
          .append("text")
          .attr("class", "annotation-text")
          .attr("x", 0)
          .attr("y", -stemLength - 4)
          .attr("text-anchor", "middle");
        txt
          .append("tspan")
          .attr("x", 0)
          .attr("dy", "0em")
          .style("font-weight", "bold")
          .text(d.year);
        txt.append("tspan").attr("x", 0).attr("dy", "1.2em").text(d.name);
      });

    annos
      .transition()
      .delay((d) => (x(d.year) / width) * animationDuration)
      .duration(200)
      .attr("opacity", 1);
  });
}
