////////////// GLOBAL SCOPE //////////////////
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

const voConst = {
  char: {
    Sine: '&#8764;',
    Square: '&#928;',
    DC: '&#8212;',
    Triangle: '&#923;',
    Duty: '&#172;'
  }
}

let d = {
  ratio: 5 / 4,
  padding: 10,
  dims: {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0
  },
  props: {
    //screenColor: "#81BFB0",
    //lineColor: "#B8FFFE",
    screenColor: "#222",
    textColor: "#F0F0F0",
    gridLineColor: "#999",
    out1: {
      lineColor: "#00FF00"
    },
    out2: {
      lineColor: "#FFFF00"
    },
    lineWidth: 8
  },
  scope: {
    timePerDivRaw: 1,
    timeUnit: "ms",
    timePerDiv: function() { return getUnitMultiplier(this.timePerDivRaw, this.timeUnit)},
    ch1: {
      voltsPerDivRaw: 1,
      voltsPerDivUnit: "V",
      voltsPerDiv: function() { return getUnitMultiplier(this.voltsPerDivRaw, this.voltsPerDivUnit)}
    },
    ch2: {
      voltsPerDivRaw: 1,
      voltsPerDivUnit: "V",
      voltsPerDiv: function() { return getUnitMultiplier(this.voltsPerDivRaw, this.voltsPerDivUnit)}
    }
  },
  signal: {
    out1: {
      enable: true,
      type: "Sine",
      voltRaw: 4,
      voltUnit: "V",
      volts: function() { return getUnitMultiplier(this.voltRaw, this.voltUnit)},
      freqRaw: 250,
      freqUnit: "Hz",
      freq: function() { return getUnitMultiplier(this.freqRaw, this.freqUnit)},
      offsetRaw: 0,
      offsetUnit: "V",
      offset: function() { return getUnitMultiplier(this.offsetRaw, this.offsetUnit)},
      phase: 0
    },
    out2: {
      enable: false,
      type: "(off)",
      voltRaw: 2,
      voltUnit: "V",
      volts: function() { return getUnitMultiplier(this.voltRaw, this.voltUnit)},
      freqRaw: 436,
      freqUnit: "Hz",
      freq: function() { return getUnitMultiplier(this.freqRaw, this.freqUnit)},
      offsetRaw: -3,
      offsetUnit: "V",
      offset: function() { return getUnitMultiplier(this.offsetRaw, this.offsetUnit)},
      phase: 0
    }
  }
}


///////////////////////////////////////////////////////////////
///////        CANVAS FUNCTIONS          /////////////////////
//////////////////////////////////////////////////////////////


/////  RENDER FOR INIT & RESIZE 
var render = function() {
  
  /// responsive canvas  
  canvas.width = 1000;
  canvas.style.width = "100%";
  canvas.height = canvas.width / d.ratio;
  
  /// responsive signal line width
  d.props.lineWidth = (canvas.width/80) > 8 ? 8 : (canvas.width/80);
  
  draw();
}


//////////  DRAW CANVAS, GRID, AND SIGNAL ////////////
var draw = function() {  
  
  // DEFINE CANVAS AND GRID DIMS
  var gridWidth = canvas.width - d.padding;
  var gridHeight = canvas.height - d.padding;  
  d.dims.top = -gridHeight / 2;
  d.dims.bottom = gridHeight / 2;
  d.dims.left = -gridWidth / 2;
  d.dims.right = gridWidth / 2;
    
  // DRAW CANVAS
  ctx.fillStyle = d.props.screenColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.translate(canvas.width/2, canvas.height/2);    // put 0,0 coordinates in center of canvas
  
  ctx.drawGrid();
  
  drawText();
  
  /// CHECK WHICH FUNCTION GEN OUTPUTS ARE ENABLED ////
  let arrOut = [];
  if (d.signal.out1.enable && !d.signal.out2.enable) {arrOut.push(1)} // out1 only
  else if (!d.signal.out1.enable && d.signal.out2.enable) {arrOut.push(2)} // out2 only
  else if (d.signal.out1.enable && d.signal.out2.enable) {arrOut.push(1); arrOut.push(2)} // out1 & out2
  
  /// DRAW SIGNAL FOR EACH OUTPUT ENABLED///
  arrOut.forEach(function (value, index) {    
    
    let strOut = "out" + value;
    
    setDrawingProps(strOut); //set up drawing properties for line
    
    switch (d.signal[strOut].type.toLowerCase()) {
      case "sine":
        var waveForm = ctx.drawSineWave(strOut);
        break;

      case "square":
        var waveForm = ctx.drawSquareWave(strOut);
        break;

      case "dc":
        var waveForm = ctx.drawDC(strOut);
        break;

      default:
        break;      
    }
    
  });
}




/////////////////////////////////////////////////////////////////////////////
////////////////           PROTOTYPES FOR CANVAS            /////////////////
/////////////////////////////////////////////////////////////////////////////

//*********** DRAW GRID LINES ******************//
CanvasRenderingContext2D.prototype.drawGrid = function () {
  
  var scopeWidth = document.getElementsByClassName("monitor")[0].offsetWidth;
  
  var gridWidth = d.dims.right * 2;
  var gridHeight = d.dims.bottom * 2;
  
  // reponsive grid line width
  let minorLine = scopeWidth < 400 ? 2 : 2;
  let majorLine = scopeWidth < 400 ? 4 : 6;
  
  var xScale = gridWidth / 10;
  var yScale = gridHeight / 8;  
  
  ctx.strokeStyle = d.props.gridLineColor;
  ctx.lineWidth = minorLine;
  
  // vertical lines
  for (var i=0; i<11; i++) {
    
    ctx.beginPath();
    ctx.lineWidth = i === 5 ? majorLine : minorLine;
    ctx.moveTo(d.dims.left + xScale * i, d.dims.top);
    ctx.lineTo(d.dims.left + xScale * i, d.dims.bottom,);    
    ctx.stroke();
  }
  
  // horizontal lines
  for (i=0; i<9; i++) {
    ctx.lineWidth = i === 4 ? majorLine : minorLine;
    ctx.beginPath();
    ctx.moveTo(d.dims.left, d.dims.top + yScale * i);
    ctx.lineTo(d.dims.right, d.dims.top + yScale * i);    
    ctx.stroke();
  }  
}



//*********** DIRECT CURRENT SIGNAL  ******************//
CanvasRenderingContext2D.prototype.drawDC = function (out) {
  
  let y = -getSignalPix(out).offsetPix;
  
  ctx.beginPath();
  ctx.moveTo(d.dims.left, y);
  ctx.lineTo(d.dims.right, y);
  ctx.stroke();
}






//*********** SINE WAVE SIGNAL ******************//
CanvasRenderingContext2D.prototype.drawSineWave = function (out) {  
  
  ctx.beginPath();
  
  for(let x = d.dims.left; x < (d.dims.right * 2)/2; x++) {
    let y = Math.sin(2 * Math.PI * (d.signal[out].freq() / getSignalPix(out).pixPerSec) *
                     (x + getSignalPix(out).phaseShiftPix)) *
                      getSignalPix(out).peakVoltPix - getSignalPix(out).offsetPix;
    if (x===d.dims.left) {
      ctx.moveTo(d.dims.left, y);      
    } else {
      ctx.lineTo(x,y);
    }
  }  
  ctx.stroke();  
}



//*********** SQUARE WAVE SIGNAL ******************//
CanvasRenderingContext2D.prototype.drawSquareWave = function (out) {
    
  //time
  let pixPerCycle = getSignalPix(out).pixPerSec / d.signal[out].freq();         //pixels per cycle (e.g. 50000 / 250 = 200)
  let pixDutyBase = pixPerCycle * (1-0.5);         //pixels per 50% duty cycle (e.g. 200 * (1-80%) = 40)
  let pixDutyVpeak = pixPerCycle * (0.5);          //pixels per 50% duty cycle (e.g. 200 * (80%) = 160)
  //volts
  let vPeak = -getSignalPix(out).peakVoltPix;
  let offset = -getSignalPix(out).offsetPix;
  //looping
  let k = 2* Math.ceil((d.dims.right*2) / pixPerCycle); //total pixel width divided by pixels per cycle
  let leadingEdge = true;
  
  ctx.beginPath();
  ctx.moveTo(d.dims.left, offset); 
  
  for (let i = 1; i<(k + 1); i++) {
    if (leadingEdge) {      
      ctx.lineTo(d.dims.left + pixDutyBase * i, offset);
      ctx.lineTo(d.dims.left + pixDutyBase * i, offset + vPeak);  //leading edge
    } else {      
      ctx.lineTo(d.dims.left + pixDutyVpeak * i, offset + vPeak)
      ctx.lineTo(d.dims.left + pixDutyVpeak * i, offset);  //falling edge
    }
    leadingEdge = !leadingEdge;
  } 
  
  ctx.stroke();
}

// ************  DRAW TEXT  ************************************//
function drawText () {
  
  let x, y;
  
  //font settings
  ctx.font = "40px Arial";
  ctx.fillStyle = d.props.textColor;
  ctx.textAlign = "left";
  
  //time
  x = d.dims.left + 20;
  y = d.dims.top + 50;
  let strTimeUnit = d.scope.timeUnit === "us" ? "µs" : d.scope.timeUnit;
  let strTime = d.scope.timePerDivRaw + strTimeUnit + "/div";  
  ctx.fillText(strTime, x, y);
  
  //ch1
  x = d.dims.left + 20;
  y = d.dims.bottom - 20;
  let strCh = "Ch1: " + d.scope.ch1.voltsPerDivRaw + d.scope.ch1.voltsPerDivUnit + "/div";
  ctx.fillText(strCh, x, y);
  
  //ch2
  y = d.dims.bottom - 20;
  strCh = "Ch2: " + d.scope.ch2.voltsPerDivRaw + d.scope.ch2.voltsPerDivUnit + "/div";  
  var text = ctx.measureText(strCh);
  x = d.dims.right - 20 - text.width;;
  ctx.fillText(strCh, x, y);
}


function setDrawingProps(out) {
  // glow & transparency
  ctx.shadowColor = d.props[out].lineColor;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur = 20;
  ctx.globalAlpha = 0.8; 
  
  ctx.lineWidth = d.props.lineWidth * 0.6;
  ctx.strokeStyle = d.props[out].lineColor;
}



////////////////////////////////////////////////////////////////
///////         CUSTOM ROUTINES                 ///////////////
//////////////////////////////////////////////////////////////


/// FUNCTION: UPDATE SIGNAL SUMMARY
function updateSignalSummary() {
  
  var waveSummary = document.getElementsByClassName('signal-summary')[0].children;
  
  for (var i=1; i<3; i++) {
    let strOut = "out" + i;
    
    let thisChar = voConst.char[d.signal[strOut].type.toString()];
    
    if (d.signal[strOut].enable) {    
      waveSummary[i-1].innerHTML = "Out" + i + ": <b>" + thisChar + "</b>, " 
          + d.signal[strOut].freqRaw + d.signal[strOut].freqUnit + ", "
          + d.signal[strOut].voltRaw + d.signal[strOut].voltUnit + ", "
          + d.signal[strOut].offsetRaw + d.signal[strOut].offsetUnit + ", "
          + d.signal[strOut].phase;
    } else {
      waveSummary[i-1].innerHTML = "Out" + i + ": ---";
    }
  }
 
}

///  UPDATE INPUTS ON FUNCTION GENERATOR & SIGNAL DATA
function updateFormData (target) {
    
  let arrOut = target === "all" ? ["out2", "out1"] : [target];
  
  arrOut.forEach(function (out,index) {
    document.getElementById('inpFreq').value =  d.signal[out].freqRaw.toString();
    document.getElementById('inpVolt').value =  d.signal[out].voltRaw.toString();
    //document.getElementById('enableOut').checked =  d.signal[out].enable;
    document.getElementById('signalSelect').value =  d.signal[out].type;
    document.getElementById('selFreqUnit').value =  d.signal[out].freqUnit;
    document.getElementById('selVoltUnit').value =  d.signal[out].voltUnit;
    document.getElementById('inpOff').value =  d.signal[out].offsetRaw.toString();
    document.getElementById('selOffUnit').value =  d.signal[out].offsetUnit;
    document.getElementById('inpPhase').value =  d.signal[out].phase.toString();
  });  
 
  document.getElementById('inpTime').value = d.scope.timePerDivRaw.toString();
  document.getElementById('selTimeUnit').value = d.scope.timeUnit;
  document.getElementById('inpVoltsCh1').value = d.scope.ch1.voltsPerDivRaw.toString();
  //document.getElementById('selVoltsCh1').value = d.scope.ch1.voltsPerDivUnit;
  document.getElementById('inpVoltsCh2').value = d.scope.ch2.voltsPerDivRaw.toString();
  //document.getElementById('selVoltsCh2').value = d.scope.ch2.voltsPerDivUnit;
  
}


////  FUNCTION: HANDLE ALL FUNCTION GENERATOR INPUTS   
function eventInputAll(e) {
  
  //determine which output
  let outSelection = document.querySelector(".output-select");
  let out = "";
  if (outSelection.children[0].className === "selected-output") {
    out = "out1";
  } else if (outSelection.children[1].className === "selected-output") {
    out = "out2";
  }

  //function generator
  if (e.target.matches('#inpFreq')) {d.signal[out].freqRaw = e.target.value};
  if (e.target.matches ('#inpVolt')) {d.signal[out].voltRaw = e.target.value};
  //if (e.target.matches ('#enableOut')) {d.signal[out].enable = e.target.checked};
  if (e.target.matches ('#signalSelect')) {
    d.signal[out].type = e.target.value;
    d.signal[out].enable = d.signal[out].type !== "(off)" ? true : false;
  };
  if (e.target.matches ('#selFreqUnit')) {d.signal[out].freqUnit = e.target.value};
  if (e.target.matches ('#selVoltUnit')) {d.signal[out].voltUnit = e.target.value};
  if (e.target.matches ('#inpOff')) {d.signal[out].offsetRaw = e.target.value};
  if (e.target.matches ('#selOffUnit')) {d.signal[out].offsetUnit = e.target.value};
  if (e.target.matches ('#inpPhase')) {d.signal[out].phase = e.target.value};
  //scope settings
  if (e.target.matches ('#inpTime')) {d.scope.timePerDivRaw = e.target.value};
  if (e.target.matches ('#selTimeUnit')) {d.scope.timeUnit = e.target.value};
  if (e.target.matches ('#inpVoltsCh1')) {d.scope.ch1.voltsPerDivRaw = e.target.value};
  if (e.target.matches ('#inpVoltsCh2')) {d.scope.ch2.voltsPerDivRaw = e.target.value};
  
  updateSignalSummary();  
  render();  
}


////  FUNCTION: RETURN VALUE BASED ON UNITS
  

function getUnitMultiplier(val, unit) {
  
  switch (unit.toLowerCase()) {
    case "uv":
    case "us":
      return 0.000001 * val;
      break;
      
    case "mv":
    case "ms":
      return 0.001 * val;
      break;
      
    case "v":
    case "hz":
    case "s":
      return 1 * val;
      break;
      
    case "kv":
    case "khz":
      return 1000 * val;
      break;
    
    case "mhz":
      return 1000000 * val;
      break;
    
    default:
      return (null);
      break;    
  }
}


/// GET SIGNAL INFORMATION IN UNITS OF PIXELS
let getSignalPix = (out) => {
  
  let obj = {
    pixPerSec: 0,
    pixPerVolt: 0,
    peakVoltPix: 0,
    offsetPix: 0,
    phaseShiftPix: 0    
  };
  
  let chan = out === 'out2' ? 'ch2' : 'ch1';  
  
  let gridWidth = (d.dims.right * 2);
  let gridHeight = (d.dims.bottom * 2);
  obj.pixPerSec = gridWidth / (10 * d.scope.timePerDiv());     // x pix per sec
  obj.pixPerVolt = gridHeight / (8 * d.scope[chan].voltsPerDiv());   // y pix per V
  obj.peakVoltPix = (obj.pixPerVolt * d.signal[out].volts() / 2);
  obj.offsetPix = obj.pixPerVolt * d.signal[out].offset();
  obj.phaseShiftPix = obj.pixPerSec * d.signal[out].phase / (360 * d.signal[out].freq());
  
  return obj;
  
}


////////////////////////////////////////////////////////////////
///////             EVENTS                     ///////////////
//////////////////////////////////////////////////////////////

//// ON LOAD ////
window.onload = function() {
  updateFormData("all");
  updateSignalSummary();  
  render();
}

// RESPONSIVE CANVAS
window.addEventListener("resize", render);


// USER INPUT CHANGE
document.querySelectorAll('input').forEach(item => {
  item.addEventListener('input', event => {
    eventInputAll(event);
  })
})

// USER SELECT CHANGE
document.querySelectorAll('select').forEach(item => {
  item.addEventListener('change', event => {
    eventInputAll(event);
  })
})


// SELECT WHICH OUTPUT AND UPDATE FUNCTION GEN VALUES 
let outSelect = document.querySelector(".output-select");

outSelect.addEventListener("click", event => {  
  if (event.target.className !== "selected-output") {
    outSelect.children[0].classList.toggle("selected-output");
    outSelect.children[1].classList.toggle("selected-output");
  }
  
  updateFormData(event.target.innerText.toLowerCase()); // either "out1" or "out2"
  updateSignalSummary();
});


