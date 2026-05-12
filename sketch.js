let faceMesh;
let video;
let faces = [];
let handPose;
let hands = [];
let earringImgs = [];
let currentEarringIdx = 0; // 目前顯示的耳環索引 (0~4)

function preload() {
  // 載入最新的 ml5.js FaceMesh 模型
  faceMesh = ml5.faceMesh();
  // 載入最新的 ml5.js HandPose 模型
  handPose = ml5.handPose();
  // 載入 5 款耳環圖片
  earringImgs.push(loadImage('pic/acc/acc1_ring.png'));
  earringImgs.push(loadImage('pic/acc/acc2_pearl.png'));
  earringImgs.push(loadImage('pic/acc/acc3_tassel.png'));
  earringImgs.push(loadImage('pic/acc/acc4_jade.png'));
  earringImgs.push(loadImage('pic/acc/acc5_phoenix.png'));
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  
  // 開始對攝影機影像進行臉部偵測
  faceMesh.detectStart(video, gotFaces);
  // 開始對攝影機影像進行手勢偵測
  handPose.detectStart(video, gotHands);
}

// 將偵測結果存入變數
function gotFaces(results) {
  faces = results;
}

function gotHands(results) {
  hands = results;
}

function draw() {
  // 設定畫布的背景顏色為 #e7c6ff
  background('#e7c6ff');
  
  // 在置中上方加上文字
  fill(0);
  noStroke();
  textAlign(CENTER, TOP);
  textSize(32);
  text("412737198林黃知婕", width / 2, 40);
  textSize(24);
  text("作品為影像辨識_耳環臉譜", width / 2, 80);
  
  // 顯示的影像寬高為整個畫布寬高的 50%
  let imgW = width * 0.5;
  let imgH = height * 0.5;
  let startX = (width - imgW) / 2;
  let startY = (height - imgH) / 2;

  push();
  // 將座標原點移至影像的右上角，以便進行左右顛倒並將影像置中
  translate(startX + imgW, startY);
  scale(-1, 1);
  
  // 繪製攝影機影像
  image(video, 0, 0, imgW, imgH);
  
  // 如果有偵測到手部，判斷比了幾根手指來切換耳環
  if (hands.length > 0) {
    let fingers = countFingers(hands[0]);
    if (fingers >= 1 && fingers <= 5) {
      currentEarringIdx = fingers - 1; // 1根手指對應索引0，依此類推
    }
  }

  // 如果有偵測到臉部
  if (faces.length > 0) {
    let face = faces[0];
    // 取得左右耳垂附近的位置 (FaceMesh 的 132 與 361 節點為臉部外側輪廓)
    let leftEar = face.keypoints[132];
    let rightEar = face.keypoints[361];
    
    if (leftEar && rightEar) {
      // 將 FaceMesh 的座標 (基於 640x480) 映射到實際繪製的寬高
      let lx = map(leftEar.x, 0, 640, 0, imgW);
      let ly = map(leftEar.y, 0, 480, 0, imgH);
      let rx = map(rightEar.x, 0, 640, 0, imgW);
      let ry = map(rightEar.y, 0, 480, 0, imgH);

      // 計算臉部寬度作為移動比例的基準
      let faceWidth = dist(lx, ly, rx, ry);
      let cx = (lx + rx) / 2; // 臉部中心 X 座標

      drawEarrings(lx, ly, cx, faceWidth);
      drawEarrings(rx, ry, cx, faceWidth);
    }
  }
  pop();
}

// 計算伸出幾根手指的函式
function countFingers(hand) {
  let count = 0;
  let kp = hand.keypoints;
  
  // 判斷食指、中指、無名指、小指是否伸直 (指尖高於第二指節)
  if (kp[8].y < kp[6].y) count++;
  if (kp[12].y < kp[10].y) count++;
  if (kp[16].y < kp[14].y) count++;
  if (kp[20].y < kp[18].y) count++;
  
  // 判斷大拇指 (利用指尖到掌心距離大於大拇指根部到掌心距離來簡單判斷)
  let thumbTipDist = dist(kp[4].x, kp[4].y, kp[9].x, kp[9].y);
  let thumbBaseDist = dist(kp[2].x, kp[2].y, kp[9].x, kp[9].y);
  if (thumbTipDist > thumbBaseDist * 1.2) count++;
  
  return count;
}

// 繪製耳環的函式 (加入往外與往上的比率移動)
function drawEarrings(x, y, cx, fWidth) {
  push();
  imageMode(CENTER);
  
  // 往外移動比例 (臉寬的 10%)：若 x 在中心左側則往左移，反之往右移
  let offsetX = fWidth * 0.1; 
  let finalX = x < cx ? x - offsetX : x + offsetX;
  
  // 往上移動比例 (臉寬的 5%)
  let finalY = y - (fWidth * 0.05);

  // 讓耳環大小也根據臉部大小進行等比縮放，讓距離感更自然 (設定基準比例)
  let ew = fWidth * 0.2; 
  let eh = ew * 1.25; 

  image(earringImgs[currentEarringIdx], finalX, finalY, ew, eh);
  pop();
}

// 讓畫布跟隨視窗縮放，保持自適應全螢幕
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
