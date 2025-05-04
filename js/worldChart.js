const SEASON            = 2024;
const LOOP_DELAY        = 2000;
const DURATION_PER_HOP  = 2000;
const FADE_MS           = 600;
const EARTH_RADIUS_KM   = 6371;

const mapSvg    = d3.select("#worldMap");
const width  = parseInt(mapSvg.style("width"));

const projection = d3.geoNaturalEarth1()
                     .scale(width / 1.7 / Math.PI)
                     .translate([width / 2, parseInt(mapSvg.style("height")) / 2]);
const geoPath = d3.geoPath().projection(projection);

let gaugeScaleDeg, gaugeScaleRad;
let needle, progressArc;
let gaugeRInner, gaugeROuter;
let progressAngle = -Math.PI / 2;

d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
  .then(world => {
    mapSvg.append("g")
       .selectAll("path")
       .data(topojson.feature(world, world.objects.countries).features)
       .enter().append("path")
       .attr("class", "land")
       .attr("d", geoPath);

    loadF1();
  });

function loadF1() {
  Promise.all([
    d3.csv("/data/circuits.csv", d3.autoType),
    d3.csv("/data/races.csv",    d3.autoType)
  ]).then(([circuits, races]) => {

    const racedCount = d3.rollup(races, v => v.length, d => d.circuitId);
    const maxCount   = d3.max(racedCount.values());
    const rScale     = d3.scaleSqrt().domain([1, maxCount]).range([4, 12]);
    const circuitById = new Map(circuits.map(d => [d.circuitId, d]));

    const seasonRaces = races
      .filter(d => d.year === SEASON)
      .sort((a, b) => d3.ascending(a.round, b.round));

    const steps = seasonRaces.map(r => {
      const c = circuitById.get(r.circuitId);
      return {
        round : r.round,
        name  : r.name,
        coords: [+c.lng, +c.lat],
        races : racedCount.get(r.circuitId)
      };
    });

    const totalKm = d3.sum(steps.slice(1), (d, i) =>
      EARTH_RADIUS_KM *
      d3.geoDistance(steps[i].coords, steps[i + 1].coords)
    );

    drawGauge(totalKm);
    animateSeason(steps, rScale);

    d3.interval(
      () => animateSeason(steps, rScale),
      steps.length * DURATION_PER_HOP + LOOP_DELAY
    );
  });
}

function drawGauge(maxKm) {
  const size   = 160 * 1.15;
  gaugeROuter  = 65  * 1.15;
  gaugeRInner  = 55  * 1.15;

  const g = d3.select("#speedometer")
              .attr("viewBox", `0 0 ${size} ${size / 2}`)
              .append("g")
              .attr("transform", `translate(${size / 2},${size / 2})`);

  gaugeScaleDeg = d3.scaleLinear().domain([0, maxKm]).range([-90, 90]);
  gaugeScaleRad = d3.scaleLinear().domain([0, maxKm]).range([-Math.PI / 2, Math.PI / 2]);

  g.append("path")
   .attr("class", "gauge-arc")
   .attr("d",
      d3.arc()
        .innerRadius(gaugeRInner)
        .outerRadius(gaugeROuter)
        .startAngle(-Math.PI / 2)
        .endAngle(Math.PI / 2)
   );

  progressArc = g.append("path")
                 .attr("fill", "#e10600")
                 .attr("d",
                   d3.arc()
                     .innerRadius(gaugeRInner)
                     .outerRadius(gaugeROuter)
                     .startAngle(-Math.PI / 2)
                     .endAngle(-Math.PI / 2)
                 );

  g.append("g")
    .attr("class", "gauge-ticks")
    .selectAll("line")
    .data(d3.range(0, 1.01, 0.1))
    .enter().append("line")
      .attr("y1", -gaugeROuter)
      .attr("y2", d => (d % 0.2 === 0 ? -gaugeROuter + 10 : -gaugeROuter + 5))
      .attr("transform", d => `rotate(${d * 180 - 90})`);

  needle = g.append("line")
            .attr("class", "needle")
            .attr("x1", 0).attr("y1", 0)
            .attr("x2", 0).attr("y2", -gaugeRInner);

  g.append("circle").attr("class", "needle-cap").attr("r", 5);
}

function animateSeason(steps, rScale) {
  d3.select("#seasonLabel").text(`Season ${SEASON}`);

  let kmTravelled   = 0;
  progressAngle     = -Math.PI / 2;
  updateGauge(0);

  mapSvg.selectAll(".route, .circuit, .location-label").remove();

  const dots = mapSvg.append("g")
    .selectAll("circle")
    .data(steps)
    .enter().append("circle")
      .attr("class", "circuit")
      .attr("r", d => rScale(d.races))
      .attr("transform", d => `translate(${projection(d.coords)})`)
      .style("opacity", 0);

  const labels = mapSvg.append("g")
    .selectAll("text")
    .data(steps)
    .enter().append("text")
      .attr("class", "location-label")
      .attr("transform", d => {
        const [x, y] = projection(d.coords);
        return `translate(${x},${y - rScale(d.races) - 6})`;
      })
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", "12px")
      .style("fill", "#f4f4f4")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .text(d => d.name);

  steps.forEach((d, i) => {
    dots.filter((_, j) => j === i)
        .transition()
        .delay(i * DURATION_PER_HOP)
        .duration(FADE_MS)
        .style("opacity", 1);

    if (i === 0) {
      labels.filter((_, j) => j === 0)
        .transition().delay(FADE_MS).duration(FADE_MS).style("opacity", 1)
        .transition().delay(DURATION_PER_HOP - 2 * FADE_MS)
                     .duration(FADE_MS)
                     .style("opacity", 0);
      return;
    }

    const prev = steps[i - 1].coords,
          curr = d.coords,
          dist = EARTH_RADIUS_KM * d3.geoDistance(prev, curr);

    const path = mapSvg.append("path")
      .attr("class", "route")
      .attr("d", geoPath({ type: "LineString", coordinates: [prev, curr] }))
      .attr("stroke-dasharray", function () { return this.getTotalLength(); })
      .attr("stroke-dashoffset", function () { return this.getTotalLength(); });

    path.transition()
        .delay(i * DURATION_PER_HOP)
        .duration(DURATION_PER_HOP)
        .attr("stroke-dashoffset", 0)
        .tween("gaugeFill", () => {
          const startKm = kmTravelled;
          const endKm   = kmTravelled + dist;
          return t => updateGauge(startKm + (endKm - startKm) * t);
        })
        .on("end", () => {
          kmTravelled += dist;
          updateGauge(kmTravelled);

          labels.filter((_, j) => j === i)
            .transition().duration(FADE_MS).style("opacity", 1)
            .transition().delay(DURATION_PER_HOP - 2 * FADE_MS)
                         .duration(FADE_MS)
                         .style("opacity", 0);
        });
  });
}

function updateGauge(km) {
  d3.select("#km").text(Math.round(km).toLocaleString("en-US"));
  if (!needle) return;

  needle.attr("transform", `rotate(${gaugeScaleDeg(km)})`);

  const next = gaugeScaleRad(km);
  progressArc.attr("d",
    d3.arc()
      .innerRadius(gaugeRInner)
      .outerRadius(gaugeROuter)
      .startAngle(-Math.PI / 2)
      .endAngle(next)
  );
  progressAngle = next;
}
