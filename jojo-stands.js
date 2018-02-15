/* 26th July 2017
 * Written by Valkyrs
 *
 * New and improved dynamic ranking based on Jojo's Bizarre Adventure
 *  * Now more efficient by not re-drawing the background stuff
 *    every frame woo (＃￣ω￣)
 *  * Changed the way the rank changes from
 *    one to another by using lerp, still a hack job, but it works
 *  * Can now change the color of everything (ﾉ>ω<)ﾉ :｡･:*:･ﾟ’★,｡･:*:･ﾟ’☆
 *
 *  TODO add export to png function and choose size to export as
 *
 * example use:
 *
 * <button onclick=
 *   "ranking.set_rank('A', 'A', 'C', 'A', 'A', 'A');"
 * >Star Platinum</button>
 *
 * <button onclick="ranking.set_color(
 * 'rgb(255, 0, 0)',      // ranking
 * 'rgb(255, 255, 255)',  // letters
 * 'rgba(0, 0, 0, 0.5)')" // shadows
 * >Change Ranking</button>
 *
 * <button onclick="background.set_color(
 * 'rgb(255, 255, 255)',  // text
 * 'rgb(255, 255, 255)',  // circle
 * 'rgba(0, 0, 0, 0.5)')" // shadows
 * >Change Background</button>
 *
 * <canvas id="dr_top" style="position: absolute; z-index: -1;"></canvas>
 * <canvas id="dr_bot" style="position: absolute; z-index: -2;"></canvas>
 *
 * two canvas's need to be positioned
 * on top of each other, each with the id dr_top and dr_bot
*/

var requestAnimationFrame = window.requestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.msRequestAnimationFrame;

/**************************** Helper Functions *******************************/

// classic a squared plus b squared equals c squared
function pythagA(b, c) {
  "use strict";
  var a = Math.sqrt(Math.pow(c, 2) - Math.pow(b, 2));
  return a;
}

// thank god for lerping
function lerp(A, B, t) {
  "use strict";
  return A + t * (B - A);
}

// round to nth decimal place
function round(val, place) {
  "use strict";
  var multi = Math.pow(10, place);
  return Math.round(val * multi) / multi;
}

// convert the number to a corresponding jojo rank letter
function convert2Number(letter) {
  "use strict";
  var number = 0;

  if (letter === 'A') {
    number = 0;
  } else if (letter === 'B') {
    number = 1;
  } else if (letter === 'C') {
    number = 2;
  } else if (letter === 'D') {
    number = 3;
  } else if (letter === 'E') {
    number = 4;
  } else if (letter === '?') {
    number = 5;
  } else {
    number = 5.1;
  }

  return number;
}

// convert a Letter to a jojo rank number
// noStat is the destination number
function convert2Letter(number, noStat) {
  "use strict";

  var letter = "?";

  if (-10 < number && number <= 0) {
    letter = "A";
  } else if (0 < number && number <= 1) {
    letter = "B";
  } else if (1 < number && number <= 2) {
    letter = "C";
  } else if (2 < number && number <= 3) {
    letter = "D";
  } else if (3 < number && number <= 4) {
    letter = "E";
  } else {
    if (noStat === 5.1) {
      letter = " ";
    } else {
      letter = "?";
    }
  }

  return letter;
}

/***************************** Canvas Objects ********************************/

// everything to do with background stuff
var background = {
  ctx: null,
  ctxW: null,
  ctxH: null,
  edge: null,
  color_text: "rgb(255, 255, 255)", // default colors
  color_background: "rgb(255, 255, 255)",
  color_shadow: "rgba(0, 0, 0, 0.5)",
  counterGhost: false,
  init: function (new_canvas, new_width, new_height) {
    "use strict";
    this.ctx = new_canvas.getContext('2d');
    this.ctxW = new_width; // add room for shadows
    this.ctxH = new_height;
    this.ctx.canvas.width = new_width * 1.01; // add room for shadows
    this.ctx.canvas.height = new_height * 1.01;
    this.edge = (this.ctxW / Math.sqrt(3)) / 2;

    this.draw();
  },
  draw: function () {
    "use strict";
    // clear
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    // shadows
    this.ctx.shadowBlur = 1;
    this.ctx.shadowOffsetX = (this.ctxW / 190);
    this.ctx.shadowOffsetY = (this.ctxH / 190);

    // shadows
    this.ctx.shadowColor = this.color_shadow;
    this.ctx.strokeStyle = this.color_background;
    this.draw_circles();
    this.draw_labels();
    this.draw_notches();
    this.draw_lines();
    this.draw_outerNotch();
    this.draw_text();

    this.ctx.shadowColor = "rgba(0, 0, 0, 0)";
    this.ctx.strokeStyle = this.color_background;
    this.draw_notches();
    this.draw_circles();
  },
  draw_circles: function () {
    "use strict";
    var middle = this.edge * (19 / 12), // idk why these constants work
      outer = this.edge * (19 / 12 + 10 / 78),
      circles  = [this.edge, middle, outer], // dist from center
      thickLine = 200,
      i = 0;

    this.ctx.strokeStyle = this.color_background;
    this.ctx.lineWidth = this.ctxH / thickLine;

    for (i = 0; i < circles.length; i += 1) {
      this.ctx.beginPath();
      this.ctx.arc(this.ctxW / 2, this.ctxH / 2, circles[i], 0, 2 * Math.PI);
      this.ctx.stroke();
      this.ctx.closePath();
    }
  },
  draw_labels: function () {
    "use strict";
    var s = this.ctxW / 20,
      w = (this.ctxW / 2) + (this.ctxW / 100),
      h = this.ctxH / 2;

    if (this.counterGhost) {
      // a ghost moves the labels after the second draw
      // go away ghost
      w += w / 32;
    }

    this.ctx.fillStyle = this.color_text;

    this.ctx.font = String(s) + "px  Arial";
    this.ctx.fillText("A", w, h - (this.edge * 5 / 6));
    this.ctx.fillText("B", w, h - (this.edge * 4 / 6));
    this.ctx.fillText("C", w, h - (this.edge * 2.95 / 6));
    this.ctx.fillText("D", w, h - (this.edge * 1.9 / 6));
    this.ctx.fillText("E", w, h - (this.edge * 0.8 / 6));
  },
  draw_text: function () {
    "use strict";
    var scale = this.ctxW / 20,
      centerX = this.ctxW / 2,
      centerY = this.ctxH / 2,
      angle = Math.PI, // radians
      radius = this.edge * 2 - this.edge / 4 - this.edge / 6 - this.edge / 6;


    this.ctx.fillStyle = this.color_text;
    // dont even ask
    this.ctx.font = "bold " + String(scale) + "px Arial";
    this.ctx.textAlign = "center";
    this.draw_text_arc(this.ctx, "   POTENTIAL                              ", centerX, centerY, radius, angle, false);

    angle = Math.PI / 2;
    this.draw_text_arc(this.ctx, "      POWER      ", centerX, centerY, radius, angle, false);

    angle = Math.PI;
    this.draw_text_arc(this.ctx, "                             SPEED    ", centerX, centerY, radius, angle, false);


    radius = this.edge * 2 - this.edge / 4 - this.edge / 4 + this.edge / 6 / 3;
    angle = Math.PI * -1;
    this.draw_text_arc(this.ctx, "                             RANGE   ", centerX, centerY, radius, angle, true);

    radius = this.edge * 2 - this.edge / 4 - this.edge / 4 + this.edge / 6 / 3;
    angle = Math.PI * -1;
    this.draw_text_arc(this.ctx, "                 DURABILITY             ", centerX, centerY, radius, angle, true);

    radius = this.edge * 2 - this.edge / 4 - this.edge / 4 + this.edge / 6 / 3;
    angle = Math.PI * -2;
    this.draw_text_arc(this.ctx, "                                                                    PRECISION      ", centerX, centerY, radius, angle, true);

  },
  draw_text_arc: function (context, str, centerX, centerY, radius, angle, backwards) {
    "use strict";

    var n = 0,
      char = "a",
      realStrLen = str.length;

    for (n = 0; n < str.length; n += 1) {
      char = str[n];
      if (char === "I") {
        realStrLen += 2;
      }
    }

    context.save();
    context.translate(centerX, centerY);

    if (backwards) {
      context.rotate(angle / 2);
    } else {
      context.rotate(-1 * angle / 2);
    }

    context.rotate(-1 * (angle / realStrLen) / 2);

    for (n = 0; n < str.length; n += 1) {
      context.rotate(angle / realStrLen);
      context.save();
      context.translate(0, -1 * radius);

      if (backwards) {
        context.rotate(Math.PI);
      }

      char = str[n];

      if (char === "O") {
        context.translate(-1.1, 0);
      }
      if (char === "I") {
        context.translate(-1.1, 0);
      }

      context.fillText(char, 0, 0);
      context.restore();
    }

    context.restore();
  },
  draw_lines: function () {
    "use strict";

    var w2 = this.ctxW / 2,
      h2 = this.ctxW / 2,
      e2 = this.edge / 2;

    this.ctx.strokeStyle = this.color_background;
    this.ctx.beginPath();
    // up down
    this.ctx.moveTo(w2, h2 - this.edge);
    this.ctx.lineTo(w2, h2 + this.edge);
    this.ctx.stroke();
    //diag
    this.ctx.moveTo((w2 + pythagA(e2, this.edge)), (h2 + e2));
    this.ctx.lineTo((w2 - pythagA(e2, this.edge)), (h2 - e2));
    this.ctx.stroke();
    this.ctx.moveTo((w2 + pythagA(e2, this.edge)), (w2 - e2));
    this.ctx.lineTo((w2 - pythagA(e2, this.edge)), (w2 + e2));
    this.ctx.stroke();
    this.ctx.closePath();
  },
  draw_notches: function () {
    "use strict";
    var thinLine = 300, // dont even ask about this constants...
      notchLen = (this.ctxW / 3) / (this.ctxW + (this.edge * 6)),
      sevonsix = 7 / 6,
      pie = 1.5,
      w2 = this.ctxW / 2,
      h2 = this.ctxH / 2,
      e6 = this.edge / 6,
      multi = 5,
      notchLoc = [
        'up',
        'upright',
        'downright',
        'down',
        'downleft',
        'upleft'
      ],
      notchFunc = {
        up: function (multi) {
          var deg = 1.5;
          return [w2, h2 - (e6 * multi), e6,
            (deg * Math.PI) - notchLen,
            (deg * Math.PI) + notchLen
            ];
        },
        upright: function (multi) {
          var deg = 1.8333,
            y = 0;
          if (multi === 1) {
            y = h2 - e6 / 2;
          } else { // why the hell does this work??
            y = h2 - pythagA(e6 / 2, e6) * sevonsix * (multi / 2);
          }
          return [
            w2 + pythagA(e6 / 2, e6) * multi,
            y,
            e6,
            (deg * Math.PI) - notchLen,
            (deg * Math.PI) + notchLen
          ];
        },
        downright: function (multi) {
          var deg = 0.1667,
            y = 0;
          if (multi === 1) {
            y = h2 + e6 / 2;
          } else { // why the hell does this work??
            y = h2 + pythagA(e6 / 2, e6) * sevonsix * (multi / 2);
          }
          return [
            w2 + pythagA(e6 / 2, e6) * multi,
            y,
            e6,
            (deg * Math.PI) - notchLen,
            (deg * Math.PI) + notchLen
          ];
        },
        down: function (multi) {
          var deg = 0.5;
          return [
            w2,
            h2 + (e6 * multi),
            e6,
            (deg * Math.PI) - notchLen,
            (deg * Math.PI) + notchLen
          ];
        },
        downleft: function (multi) {
          var deg = 0.8333,
            y = 0;
          if (multi === 1) {
            y = h2 + e6 / 2;
          } else {
            y = h2 + pythagA(e6 / 2, e6) * sevonsix * (multi / 2);
          }
          return [
            w2 - pythagA(e6 / 2, e6) * multi,
            y,
            e6,
            (deg * Math.PI) - notchLen,
            (deg * Math.PI) + notchLen
          ];
        },
        upleft: function (multi) {
          var deg = 1.1667,
            y = 0;
          if (multi === 1) {
            y = h2 - e6 / 2;
          } else { // why the hell does this work??
            y = h2 - pythagA(e6 / 2, e6) * sevonsix * (multi / 2);
          }
          return [
            w2 - pythagA(e6 / 2, e6) * multi,
            y,
            e6,
            (deg * Math.PI) - notchLen,
            (deg * Math.PI) + notchLen
          ];
        }
      },
      i = 0,
      j = 0,
      all = [];

    this.ctx.lineWidth = this.ctxH / thinLine;

    for (i = 0; i < notchLoc.length; i += 1) {
      for (j = 0; j < multi; j += 1) {
        all = notchFunc[notchLoc[i]](j);
        this.ctx.beginPath();
        this.ctx.arc(all[0], all[1], // x,y pos
                     all[2], // length of line
                     all[3], // start of line
                     all[4]); // end of line
        this.ctx.stroke();
      }
    }

  },
  draw_outerNotch: function () {
    "use strict";
    var i = 0,
      thickLine = 30,
      thinLine = 35,
      w2 = this.ctxW / 2,
      h2 = this.ctxH / 2,
      middle = this.edge * (19 / 12), // idk why these constants work
      outer = this.edge * (19 / 12 + 10 / 78);

    this.ctx.strokeStyle = this.color_background;
    for (i = 0; i < 22; i += 1) {
      if (i === 0 || i === 22) { // for top and bottom lines to be thicker
        this.ctx.lineWidth = w2 / thickLine;
      } else {
        this.ctx.lineWidth = w2 / thinLine;
      }

      this.ctx.beginPath();
      this.ctx.moveTo(w2 + Math.sin((Math.PI * i) / 11) * (middle),
                      h2 - Math.cos((Math.PI * i) / 11) * (middle));
      this.ctx.lineTo(w2 + Math.sin((Math.PI * i) / 11) * (outer),
                      h2 - Math.cos((Math.PI * i) / 11) * (outer));
      this.ctx.stroke();
      this.ctx.closePath();
    }
  },
  set_color: function (text, background, shadow) {
    "use strict";
    this.color_text = text;
    this.color_background = background;
    this.color_shadow = shadow;
    this.counterGhost = true;
    this.draw();
  }
};

// the actual rank stuff in the middle and lettering
var ranking = {
  canvas: null,
  ctx: null,
  ctxW: null,
  ctxH: null,
  edge: null,
  color_ranking: "rgba(255, 5, 180, 0.72)",
  color_letters: "rgb(255, 255, 255)",
  color_shadow: "rgba(0, 0, 0, 0.5)",
  speed: 0.015,
  dt: 0,
  dt_limit: 1,
  // power speed range durability precision potential
  stats_init: [5.1, 5.1, 5.1, 5.1, 5.1, 5.1],
  stats_final: [0, 1, 3, 1, 1, 0], // this is the initial one that shows, hmmmmm
  stats_temp: [0, 0, 0, 0, 0, 0],
  init: function (new_canvas, new_width, new_height) {
    "use strict";
    this.ctx = new_canvas.getContext('2d');
    this.ctxW = new_width;
    this.ctxH = new_height;
    this.ctx.canvas.width = new_width * 1.01; // add room for shadows
    this.ctx.canvas.height = new_height * 1.01;
    this.edge = (this.ctxW / Math.sqrt(3)) / 2;


    this.update();
  },
  draw: function () {
    "use strict";
    // clear each frame
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    // shadows
    this.ctx.shadowColor = this.color_shadow;
    this.ctx.shadowBlur = 1;
    this.ctx.shadowOffsetX = (this.ctxW / 200);
    this.ctx.shadowOffsetY = (this.ctxH / 200);

    this.draw_rank(this.stats_temp);
    this.draw_letters(this.stats_temp, this.stats_final);
  },
  draw_rank: function (stats) {
    "use strict";
    var w2 = this.ctxW / 2,
      h2 = this.ctxH / 2,
      e1 = this.edge,
      e2 = this.edge / 2,

      // aces are high, 5's are low
      pwr = stats[0],
      spd = stats[1],
      ran = stats[2],
      dur = stats[3],
      prc = stats[4],
      pot = stats[5],

      pos_power     = [w2, h2 - e1], // can't remember why this works
      pos_duration  = [w2, h2 + e1],

      pos_range     = [w2 + pythagA(e2, e1), h2 + e2],
      pos_precision = [w2 - pythagA(e2, e1), h2 + e2],

      pos_speed     = [w2 + pythagA(e2, e1), h2 - e2],
      pos_potential = [w2 - pythagA(e2, e1), h2 - e2],

      // fine tuning with magic numbers
      ft_x = (this.ctxW / 23.9),
      ft_y_top = (this.ctxH / 21),
      ft_y_bot = (this.ctxH / 42);

    this.ctx.beginPath();

    this.ctx.moveTo(pos_power[0],
                    pos_power[1] + (ft_y_top * (pwr + 1)));
    this.ctx.lineTo(pos_speed[0] - (ft_x * (spd + 1)),
                    pos_speed[1] + (ft_y_bot * (spd + 1)));

    this.ctx.lineTo(pos_range[0] - (ft_x * (ran + 1)),
                    pos_range[1] - (ft_y_bot * (ran + 1)));
    this.ctx.lineTo(pos_duration[0],
                    pos_duration[1] - (ft_y_top * (dur + 1)));

    this.ctx.lineTo(pos_precision[0] + (ft_x * (prc + 1)),
                    pos_precision[1] - (ft_y_bot * (prc + 1)));
    this.ctx.lineTo(pos_potential[0] + (ft_x * (pot + 1)),
                    pos_potential[1] + (ft_y_bot * (pot + 1)));

    this.ctx.lineTo(pos_power[0],
                    pos_power[1] + (ft_y_top * (pwr + 1)));

    this.ctx.closePath();

    this.ctx.lineWidth = 0;
    this.ctx.fillStyle = this.color_ranking;
    this.ctx.fill();
  },
  draw_letters: function (A, B) {
    "use strict";
    this.draw_letter("power",      convert2Letter(A[0], B[0]));
    this.draw_letter("speed",      convert2Letter(A[1], B[1]));
    this.draw_letter("range",      convert2Letter(A[2], B[2]));
    this.draw_letter("durability", convert2Letter(A[3], B[3]));
    this.draw_letter("precision",  convert2Letter(A[4], B[4]));
    this.draw_letter("potential",  convert2Letter(A[5], B[5]));
  },
  draw_letter: function (category, rank) {
    // category: lowercase string of position
    // rank: string of rank
    "use strict";
    var w2 = this.ctxW / 2,
      h2 = this.ctxH / 2,
      e1 = this.edge,
      e2 = this.edge / 2,
      position = [w2, h2],
      w10 = w2 / 5,
      w30 = w2 / 15,
      smidge = this.ctxW / (w10 * 2);

    // all this is fine tuning with magic numbers woops
    switch (category) {
    case "power":
      position = [w2 * (14 / 15), (w2 / 2) - (w10)];
      break;
    case "speed":
      position = [(w2 + pythagA(e2, e1)) + w30, (w2 - e2) - w30];
      break;
    case "range":
      position = [(w2 + pythagA(e2, e1)) + (w10 / 3), (w2 + e2) + (w10 / 3)];
      break;
    case "durability":
      position = [w2 * (14 / 15), (w2 * (3 / 2)) + (w10)];
      break;
    case "precision":
      position = [(w2 - pythagA(e2, e1)) - (w10), (w2 + e2) + (w10 / 3)];
      break;
    case "potential":
      position = [(w2 - pythagA(e2, e1)) - (w10), (w2 - e2) - (w10 / 3)];
      break;
    default:
      position = [w2 * (14 / 15), (w2 / 2) - (w10)];
      break;
    }
    this.ctx.fillStyle = this.color_letters;
    this.ctx.font = "bold " + String(w10) + "px Arial";
    this.ctx.fillText(rank, position[0], position[1] + w10 / 3);
  },
  update: function () {
    "use strict";
    var i = 0,
      dx = 0;
    // if someone can help me explain why the rank
    // change is slow the first time but faster after that'd be great :P
    for (i = 0; i < this.stats_init.length; i += 1) {
      dx = lerp(this.stats_init[i], this.stats_final[i], this.dt);
      this.stats_temp[i] = round(dx, 3);
    }

    if (this.dt < this.dt_limit) {
      this.draw();
      this.dt = round(this.dt + this.speed, 3);
      requestAnimationFrame(this.update.bind(this));
    } else {
      this.dt = this.dt_limit;
      this.stats_init = this.stats_temp = this.stats_final;
      this.draw();
      window.cancelAnimationFrame(requestAnimationFrame);
    }
  },
  set_rank: function (new_stats) {
    "use strict";
    var i = 0,
      converted = [0, 0, 0, 0, 0, 0];

    // praise the lerp
    for (i = 0; i < new_stats.length; i += 1) {
      converted[i] = convert2Number(new_stats[i]);
    }

    // something here makes it go faster the second time it runs, onwards
    // store current position as initial
    this.stats_init = this.stats_temp;
    // replace final stats with new destination
    this.stats_final = converted;
    this.dt_limit = 0.38; // hack fix for how it speeds up after the first rank

    // restart the lerp or begin animation loop again
    if (this.dt < this.dt_limit) {
      this.dt = 0;
    } else {
      this.dt = 0;
      this.update();
    }
  },
  set_color: function (ranking, letters, shadow) {
    "use strict";
    this.color_ranking = ranking;
    this.color_letters = letters;
    this.color_shadow = shadow;
    this.draw();
  }
};

// init everything
var init = function () {
  "use strict";
  var canvas_top = document.getElementById("dr_top"),
    canvas_bot = document.getElementById("dr_bot"),
    size = 500;
  background.init(canvas_top, size, size);
  ranking.init(canvas_bot, size, size);
};

window.onload = init;