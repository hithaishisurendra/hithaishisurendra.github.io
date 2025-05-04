
const intro     = document.querySelector('.intro');
const svg       = document.getElementById('raceTrack');
const path      = document.getElementById('trackPath');
const car       = document.getElementById('car');
const startLine = document.getElementById('startLine');
const backdrop  = document.getElementById('backdrop');

const ORIGINAL_W = 726, ORIGINAL_H = 576;
const TRACK_CX   = ORIGINAL_W / 2, TRACK_CY = ORIGINAL_H / 2;
const BASE_ZOOM  = 1.1, MAX_ZOOM = 5, ZOOM_END = 0.2;

let targetPct = 0, currentPct = 0;


const pathLen = path.getTotalLength();
const { x: sx, y: sy } = path.getPointAtLength(0);


const LINE_LEN = 45, LINE_TH = 20;
startLine.setAttribute('width', LINE_LEN);
startLine.setAttribute('height', LINE_TH);
startLine.setAttribute('x', sx - LINE_LEN/2);
startLine.setAttribute('y', sy - LINE_TH/2);

const p1 = path.getPointAtLength(1);
const angle = Math.atan2(p1.y - sy, p1.x - sx) * 180/Math.PI;
startLine.setAttribute(
  'transform',
  `rotate(${angle + 105} ${sx} ${sy})`
);


const checkpoints = [
  {
    pct:    0.07,
    id:     'text-box-1',
    radius: 0.02,
    loaded: false,
    init:   () => {}    
  },
  {
    pct:    0.14,         
    id:     'chart-car',
    radius: 0.02,
    loaded: false,
    init:   () => {}     
  },
  {
    pct:    0.21,
    id:     'text-box-2',
    radius: 0.02,
    loaded: false,
    init:   () => {}   
  },
  {
    pct:    0.28,
    id:     'bumpChart',
    radius: 0.02,
    loaded: false,
    init:   el => drawBumpChart(el)
  },
  {
    pct:    0.35,      
    id:     'barChartRace',
    radius: 0.02,
    loaded: false,
    init:   el => drawBarChartRace(el)    
  },
  {
    pct:    0.42,
    id:     'text-box-3',
    radius: 0.02,
    loaded: false,
    init:   () => {}  
  },
  {
    pct:    0.49,              
    id:     'chart-bubble',   
    radius: 0.02,              
    loaded: false,
    init:   el => drawBubbleChart(el)
  },
  {
  pct:    0.56,            
  id:     'chart-champions',   
  radius: 0.02,
  loaded: false,
  init:   el => drawChampionsChart(el)
},
{
    pct:    0.63,
    id:     'text-box-6',
    radius: 0.02,
    loaded: false,
    init:   () => {}  
  },
  {
  pct:    0.70,           
  id:     'chart-hexbin',
  radius: 0.02,
  loaded: false,
  init:   el => drawPitHexbin(el)
},
  {
    pct:    0.75,
    id:     'text-box-4',
    radius: 0.02,
    loaded: false,
    init:   () => {} 
  },
  {
  pct:    0.82,          
  id:     'chart-crash',
  radius: 0.02,
  loaded: false,
  init:   drawCrashChart 
},


{
    pct:    0.88,
    id:     'text-box-5',
    radius: 0.02,
    loaded: false,
    init:   () => {}    
  },

  {
    pct:    0.95,        
    id:     'chart-world',
    radius: 0.02,
    loaded: false,
    init:   () => {}
  },
  {
    pct:    0.98,
    id:     'text-box-7',
    radius: 0.02,
    loaded: false,
    init:   () => {} 
  },
];

window.addEventListener('scroll', () => {
  const sc = window.scrollY;
  const max = document.body.scrollHeight - window.innerHeight;
  targetPct = Math.min(sc / max, 1);
  if (sc > 0 && !intro.classList.contains('hidden')) {
    intro.classList.add('hidden');
  }
});

function toggleCheckpoint(cp, show) {
  backdrop.classList.toggle('visible', show);
  const el = document.getElementById(cp.id);
  el.classList.toggle('visible', show);
  if (show && !cp.loaded) {

   +    cp.init(el);

    if (cp.id === 'chart-world') {
      const intro = el.querySelector('.intro');
      setTimeout(() => intro && intro.classList.add('hide'), 1000);
    }
    cp.loaded = true;
  }
}

function render() {
  currentPct += (targetPct - currentPct) * 0.25;
  const alpha = Math.min(currentPct / ZOOM_END, 1);

const pinWrapper = document.querySelector('#chart-world .pin-wrapper');
if (pinWrapper) {
  if (currentPct > 0.28) {
    pinWrapper.classList.add('disable-pin');
  } else {
    pinWrapper.classList.remove('disable-pin');
  }
}



  let z0 = MAX_ZOOM, dx = sx, dy = sy;
  if (currentPct < ZOOM_END) {
    const t = currentPct / ZOOM_END;
    z0 = 1 + (MAX_ZOOM - 1) * t;
  } else {
    const movePct = (currentPct - ZOOM_END) / (1 - ZOOM_END);
    checkpoints.forEach(cp => {
      const d = Math.abs(movePct - cp.pct);
      toggleCheckpoint(cp, d < cp.radius);
    });
    const pt = path.getPointAtLength(movePct * pathLen);
    dx = pt.x; dy = pt.y;
  }

  const dynZoom = BASE_ZOOM * z0;
  const zoom    = BASE_ZOOM * (1 - alpha) + dynZoom * alpha;
  const viewX   = TRACK_CX * (1 - alpha) + dx * alpha;
  const viewY   = TRACK_CY * (1 - alpha) + dy * alpha;

  const carX = sx * (1 - alpha) + dx * alpha;
  const carY = sy * (1 - alpha) + dy * alpha;
  car.setAttribute('cx', carX);
  car.setAttribute('cy', carY);

  const boxW = ORIGINAL_W / zoom, boxH = ORIGINAL_H / zoom;
  svg.setAttribute('viewBox',
    `${viewX - boxW/2} ${viewY - boxH/2} ${boxW} ${boxH}`
  );

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
