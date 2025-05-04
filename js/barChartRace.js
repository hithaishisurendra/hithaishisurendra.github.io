

function drawBarChartRace(container) {

  d3.csv("data/F1_Constructors_Champions__1958-2024_.csv").then(data => {
    data.forEach(d => {
      d.year        = +d.year;
      d.constructor = d.constructor.trim();
    });

    const startYear    = d3.min(data, d => d.year),
          endYear      = d3.max(data, d => d.year),
          years        = d3.range(startYear, endYear + 1),
          constructors = Array.from(new Set(data.map(d => d.constructor)));


    const colorMap = {
      Ferrari:    "#DC0000",
      McLaren:    "#FF8700",
      Mercedes:   "#00D2BE",
      "Red Bull": "#1E41FF",
      Williams:   "#005AFF",
      Lotus:      "#004225",
      Renault:    "#FFF500",
      Brabham:    "#FF9800",
      Cooper:     "#99CCFF",
      BrawnGP:    "#FFFFFF"
    };
    const defaultColor = "#888";


    const titleCountByYear = {}, cum = {};
    constructors.forEach(c => cum[c] = 0);
    const champByYear = {};
    data.forEach(d => champByYear[d.year] = d.constructor);
    years.forEach(y => {
      const win = champByYear[y];
      if (win) cum[win]++;
      titleCountByYear[y] = { ...cum };
    });


    const step = 5;
    let intervals = years.filter(y => (y - startYear) % step === 0);
    if (!intervals.includes(endYear)) intervals.push(endYear);
    const dateValues = intervals.map(y => [
      new Date(y, 0, 1),
      new Map(constructors.map(c => [c, titleCountByYear[y][c] || 0]))
    ]);

    function rank(getVal) {
      return constructors
        .map(name => ({ name, value: getVal(name) }))
        .sort((a,b) => d3.descending(a.value,b.value))
        .map((d,i) => ((d.rank = i), d));
    }

    const keyframes = [];
    const k = 10;
    for (const [[d0,m0],[d1,m1]] of d3.pairs(dateValues)) {
      const span = d1.getFullYear() - d0.getFullYear();
      for (let i=0; i<k; ++i) {
        const t = i/k;
        keyframes.push([
          new Date(d0.getFullYear() + span*t,0,1),
          rank(name => m0.get(name) + (m1.get(name)-m0.get(name))*t)
        ]);
      }
    }
    keyframes.push([
      dateValues[dateValues.length-1][0],
      rank(name => dateValues[dateValues.length-1][1].get(name))
    ]);


    const margin = { top: 60, right: 130, bottom: 40, left: 140 },
          width  = 900,
          barH   = 50,
          n      = Math.min(constructors.length, 8),
          height = margin.top + barH * n + margin.bottom;

    const x = d3.scaleLinear()
      .domain([0, d3.max(keyframes[keyframes.length-1][1], d => d.value)])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleBand()
      .domain(d3.range(n))
      .range([margin.top, margin.top + barH * n])
      .padding(0.1);

 
    const iconW = 54;
const iconH =32;
    iconPad = -2;
    const svg = d3.select(container)
      .append("svg")
         .attr("viewBox", `0 0 ${width + iconW + iconPad*2} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("overflow", "visible")
        .style("overflow", "visible");

svg.append("g")
  .attr("class", "axis axis-x")
  .attr("transform", `translate(0,${margin.top})`)
  .call(d3.axisTop(x)
    .ticks(Math.ceil((width - margin.left - margin.right) / 100))
    .tickSize(-barH * n)
    .tickFormat(d3.format("d")))
  .call(g => g.select(".domain").remove());


svg.append("text")
  .attr("class", "axis-label")
  .attr("x", margin.left + ((width - margin.left - margin.right) / 2))
  .attr("y", margin.top - 30)         
  .attr("text-anchor", "middle")
  .text("Title Wins");

svg.append("g")
  .attr("class", "axis axis-y")
  .attr("transform", `translate(${margin.left},0)`)
  .call(
    d3.axisLeft(y)
      .tickSize(0)
      .tickFormat(i => constructors[i])
      .tickPadding(-35)  
  )
  .call(g => g.select(".domain").remove())

 
  .call(g => g.selectAll(".tick text").attr("x", -20));  

svg.append("text")
  .attr("class", "axis-label")
  .attr("transform", "rotate(-90)")
  .attr("x", -(margin.top + (barH * n) / 2))  
  .attr("y", margin.left - 70)                
  .attr("text-anchor", "middle")
  .text("Constructor");


    let prevFrame = null;

    function bars([, data], t) {
      const prevMap = prevFrame
        ? new Map(prevFrame[1].map(d => [d.name, d]))
        : new Map();

      svg.selectAll("rect.bar")
        .data(data.slice(0, n), d => d.name)
        .join(
          enter => enter.append("rect")
            .attr("class", "bar")
            .style("fill", d => colorMap[d.name] || defaultColor)
            .attr("x", x(0))
            .attr("y", d => y(prevMap.get(d.name)?.rank ?? d.rank))
            .attr("height", y.bandwidth())
            .attr("width", 0),
          update => update,
          exit => exit.remove()
        )
        .transition(t)
          .attr("y", d => y(d.rank))
          .attr("width", d => x(d.value) - x(0));

      prevFrame = [ , data ];
    }

    function labels([, data], t) {
      const top = data.slice(0, n).filter(d => d.value >= 1);
      svg.selectAll("text.label")
        .data(top, d => d.name)
        .join(
          enter => enter.append("text")
            .attr("class", "label")
            .attr("text-anchor", "end")
            .attr("fill", "#fff")
            .attr("font-weight", "bold")
            .attr("x", d => x(d.value) - 8)
            .attr("y", d => y(d.rank) + y.bandwidth()/2)
            .attr("dy","0.35em")
            .style("font-size","16px")
            .text(d => d.name),
          update => update,
          exit => exit.remove()
        )
        .transition(t)
          .attr("x", d => x(d.value) - 8)
          .attr("y", d => y(d.rank) + y.bandwidth()/2);
    }

    function images([, data], t) {
      const top = data.slice(0, n).filter(d => d.value >= 1);
      const sel = svg.selectAll("image.car-icon")
        .data(top, d => d.name);

      sel.exit()
        .transition(t).style("opacity",0).remove();

      const enter = sel.enter().append("image")
        .attr("class","car-icon")
        .attr("width", iconW)
        .attr("height", iconH)
        .attr("preserveAspectRatio","xMidYMid slice")
        .attr("href","/images/f1-car-svgrepo-com.jpg")        
        .attr("xlink:href","/images/f1-car-svgrepo-com.jpg")
        .style("opacity",0)
        .enter().merge(sel)
  .transition(t)
    .style("opacity", 1)
    .attr("x", d => {
      const ideal = x(d.value) + iconPad;
      return Math.min(ideal, width + iconPad);
    })
          .attr("y", d => y(d.rank) + (y.bandwidth() - iconH)/2);
    }

    function values([, data], t) {
      const top = data.slice(0, n).filter(d => d.value >= 1);
      svg.selectAll("text.value")
        .data(top, d => d.name)
        .join(
          enter => enter.append("text")
            .attr("class","value")
            .attr("x", d => {
          const base = Math.min(x(d.value), width - margin.right);
          return base + iconPad + iconW + 6;
        })
            .attr("y", d => y(d.rank) + y.bandwidth()/2)
            .attr("dy","0.35em")
            .attr("fill","#fff")
            .style("font-size","15px")
            .text(d => d.value),
          update => update,
          exit => exit.remove()
        )
        .transition(t)
          .attr("x", d => {
        const base = Math.min(x(d.value), width - margin.right);
        return base + iconPad + iconW + 6;
      })
          .attr("y", d => y(d.rank) + y.bandwidth()/2)
          .text(d => d.value)
          .on("end", function() { d3.select(this).raise(); });
    }

    function ticker([date], t) {
      svg.selectAll("text.ticker")
        .data([date])
        .join(
          enter => enter.append("text")
            .attr("class","ticker")
            .attr("x", width - margin.right)
            .attr("y", height - margin.bottom + 30)
            .attr("text-anchor","end")
            .style("font-size","36px")
            .attr("fill","#ff4444"),
          update => update
        )
        .transition(t)
          .text(d3.timeFormat("%Y")(date));
    }

    (async function run() {
      for (const frame of keyframes) {
        const t = svg.transition().duration(50).ease(d3.easeLinear);
        bars(frame, t);
        labels(frame, t);
        images(frame, t);
        values(frame, t);
        ticker(frame, t);
        await t.end();
      }
    })();

  });
}

window.drawBarChartRace = drawBarChartRace;
