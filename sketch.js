// Hand Pose Detection with ml5.js
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/hand-pose

let video;
let handPose;
let hands = [];
let stars = []; // 星空
// 關卡資料
let levels = [
  { letters: ['A', 'B', 'T', 'A', 'D'], target: 'T' },
  { letters: ['C', 'U', 'E', 'Y', 'K'], target: 'K' },
  { letters: ['T', 'K', 'U', 'B', 'T'], target: 'U' },
  { letters: ['U', 'W', 'S', 'K', 'E'], target: 'E' },
  { letters: ['E', 'L', 'M', 'U', 'T'], target: 'T' }
];
let currentLevel = 0;
let letterObjs = [];
let grabbedLetter = null;
let boxX, boxY, boxW, boxH;

function preload() {
  handPose = ml5.handPose({ flipped: true });
}

function mousePressed() {
  console.log(hands);
}

function gotHands(results) {
  hands = results;
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO, { flipped: true });
  video.hide();

  // 初始化星星
  stars = [];
  for (let i = 0; i < 150; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      r: random(0.5, 2.5),
      alpha: random(80, 255)
    });
  }

  initLevel();
  handPose.detectStart(video, gotHands);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // 重新分布星星
  stars = [];
  for (let i = 0; i < 150; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      r: random(0.5, 2.5),
      alpha: random(80, 255)
    });
  }

  initLevel();
}

function initLevel() {
  // 計算鏡頭畫面區域
  let baseSize = min(width, height) / 10;
  let titleY = height * 0.07;
  let camScale = 0.7;
  let camW, camH;
  if (width / height > 16 / 9) {
    camH = height * camScale;
    camW = camH * 16 / 9;
  } else {
    camW = width * camScale;
    camH = camW * 9 / 16;
  }
  let camTop = titleY + baseSize + 30;
  let camBottom = height;
  let availableH = camBottom - camTop;
  let camY = camTop + (availableH - camH) / 2;
  let camX = (width - camW) / 2;

  // 隨機分布字母（只在鏡頭畫面內）
  letterObjs = [];
  let letters = levels[currentLevel]?.letters || [];
  for (let i = 0; i < letters.length; i++) {
    letterObjs.push({
      char: letters[i],
      x: random(camX + camW * 0.1, camX + camW * 0.9),
      y: random(camY + camH * 0.1, camY + camH * 0.9),
      size: min(width, height) / 8,
      grabbed: false
    });
  }
  // 箱子位置
  boxW = min(width, height) / 6;
  boxH = boxW;
  boxX = width / 2 - boxW / 2;
  boxY = height * 0.15;
  grabbedLetter = null;
}
function draw() {
  // 星空背景
  background(10, 10, 30);
  noStroke();
  for (let s of stars) {
    fill(255, 255, 255, s.alpha);
    ellipse(s.x, s.y, s.r, s.r);
  }

  // 標題
  let title = "教科抓抓王";
  textAlign(CENTER, TOP);
  let baseSize = min(width, height) / 10;
  textSize(baseSize);
  textFont('Microsoft JhengHei', 'bold');
  let titleY = height * 0.07;
  for (let i = 10; i > 0; i--) {
    fill(0, 255, 255, 6);
    stroke(0, 255, 255, 10);
    strokeWeight(i * 2.5);
    textSize(baseSize + i * 3);
    text(title, width / 2, titleY - i);
  }
  fill(255);
  stroke(200);
  strokeWeight(baseSize / 5);
  textSize(baseSize);
  text(title, width / 2, titleY);
  noStroke();
  fill(255);
  text(title, width / 2, titleY);

  // ==== 鏡頭畫面置中在標題底部和視窗底部之間 ====
  let camScale = 0.7;
  let camW, camH;
  if (width / height > 16 / 9) {
    camH = height * camScale;
    camW = camH * 16 / 9;
  } else {
    camW = width * camScale;
    camH = camW * 9 / 16;
  }
  let camTop = titleY + baseSize + 30;
  let camBottom = height;
  let availableH = camBottom - camTop;
  let camY = camTop + (availableH - camH) / 2;
  let camX = (width - camW) / 2;

  // 畫圓角框
  stroke(255);
  strokeWeight(6);
  fill(20, 20, 40, 220);
  rect(camX, camY, camW, camH, 40);

  // 將攝影機畫面畫在圓角框內（鏡像）
  push();
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.roundRect(camX, camY, camW, camH, 40);
  drawingContext.clip();

  // 鏡像攝影機畫面
  push();
  translate(camX + camW, camY);
  scale(-1, 1);
  image(video, 0, 0, camW, camH);
  pop();

  drawingContext.restore();
  pop();

  // 畫目標箱子
  fill(255, 255, 0, 180);
  stroke(200, 150, 0);
  strokeWeight(4);
  rect(boxX, boxY, boxW, boxH, 20);
  noStroke();
  fill(0);
  textSize(boxW * 0.6);
  textAlign(CENTER, CENTER);
  if (currentLevel < levels.length) {
    text(levels[currentLevel].target, boxX + boxW / 2, boxY + boxH / 2);
  }

  // 畫所有字母
  for (let obj of letterObjs) {
    fill(obj.grabbed ? 'red' : 'white');
    stroke(0, 100);
    strokeWeight(2);
    textSize(obj.size);
    textAlign(CENTER, CENTER);
    text(obj.char, obj.x, obj.y);
  }

  // 手勢抓字母與拖曳判斷
  if (hands.length > 0 && currentLevel < levels.length) {
    let hand = hands[0];
    if (hand.confidence > 0.1) {
      let indexFinger = hand.keypoints[8];
      let thumb = hand.keypoints[4];
      let mx = (indexFinger.x + thumb.x) / 2;
      let my = (indexFinger.y + thumb.y) / 2;
      let pinchDist = dist(indexFinger.x, indexFinger.y, thumb.x, thumb.y);

      // 抓取字母
      if (pinchDist < 40) { // 兩指靠近
        if (!grabbedLetter) {
          // 檢查是否有字母被夾住
          for (let obj of letterObjs) {
            let d = dist(mx, my, obj.x, obj.y);
            if (d < obj.size / 2) {
              grabbedLetter = obj;
              obj.grabbed = true;
              break;
            }
          }
        } else {
          // 拖曳字母
          grabbedLetter.x = mx;
          grabbedLetter.y = my;
        }
      } else {
        // 放開
        if (grabbedLetter) {
          // 判斷是否放進箱子
          if (
            grabbedLetter.char === levels[currentLevel].target &&
            grabbedLetter.x > boxX && grabbedLetter.x < boxX + boxW &&
            grabbedLetter.y > boxY && grabbedLetter.y < boxY + boxH
          ) {
            // 過關
            currentLevel++;
            if (currentLevel >= levels.length) {
              // 全部完成
              setTimeout(() => {
                fill(255, 255, 0);
                textSize(min(width, height) / 8);
                textAlign(CENTER, CENTER);
                text("全部過關！", width / 2, height / 2);
                noLoop();
              }, 100);
            } else {
              initLevel();
            }
          } else {
            grabbedLetter.grabbed = false;
          }
          grabbedLetter = null;
        }
      }
    }
  }

  // 完成提示
  if (currentLevel >= levels.length) {
    fill(255, 255, 0);
    textSize(min(width, height) / 8);
    textAlign(CENTER, CENTER);
    text("全部過關！", width / 2, height / 2);
  }
}
