// ml5.js: Pose Classification
// The Coding Train / Daniel Shiffman
// https://thecodingtrain.com/Courses/ml5-beginners-guide/7.2-pose-classification.html
// https://youtu.be/FYgYyq-xqAw

// All code: https://editor.p5js.org/codingtrain/sketches/JoZl-QRPK

// Separated into three sketches
// 1: Data Collection: https://editor.p5js.org/codingtrain/sketches/kTM0Gm-1q
// 2: Model Training: https://editor.p5js.org/codingtrain/sketches/-Ywq20rM9
// 3: Model Deployment: https://editor.p5js.org/codingtrain/sketches/c5sDNr8eM

let video;
let poseNet;
let pose;
let skeleton;

let brain;
let poseLabel;

function setup() {
    createCanvas(320, 320);
    video = createCapture(VIDEO);
    video.hide();
    poseNet = ml5.poseNet(video, modelLoaded);
    poseNet.on('pose', gotPoses);

    let options = {
        inputs: 34,
        outputs: 4,
        task: 'classification',
        debug: true
    }
    brain = ml5.neuralNetwork(options);
    const modelInfo = {
        model: './JS/Models/model.json',
        metadata: './JS/Models/model_meta.json',
        weights: './JS/Models/model.weights.bin',
    };
    brain.load(modelInfo, brainLoaded);
}

function brainLoaded() {
    console.log('pose classification ready!');
    classifyPose();
}

function classifyPose() {
    if (pose) {
        console.log(pose);
        let inputs = [];
        for (let i = 0; i < pose.keypoints.length; i++) {
            let x = pose.keypoints[i].position.x;
            let y = pose.keypoints[i].position.y;
            inputs.push(x);
            inputs.push(y);
        }
        brain.classify(inputs, gotResult);
    } else {
        setTimeout(classifyPose, 10);
    }
}
let Lunges = 1;
let isLunges = false;
//['Idle', 'Jog', 'Jump', 'Squats', 'Lunges']
function gotResult(error, results) {

    if (results) {
        if (results[0].confidence >= 0.80) {
            poseLabel = results[0].label;

            if (poseLabel == 'Jog') {
                GlobalUnityInstance.SendMessage('Player', 'Move', Lunges);
                isLunges = false;
            }
            else if (poseLabel == 'Lunges') {
                if (!isLunges) {
                    Lunges *= -1;
                    GlobalUnityInstance.SendMessage('Player', 'Flip');
                    isLunges = true;
                } else {
                    poseLabel = '';
                }
            }
            else if (poseLabel == 'Jump') {
                GlobalUnityInstance.SendMessage('Player', 'Jump');
            }
            else if (poseLabel == 'Idle') {
                isLunges = false;
                GlobalUnityInstance.SendMessage('Player', 'Move', 0);
            }
            else if (poseLabel == 'Squats') {
                GlobalUnityInstance.SendMessage('Player', 'Fight');
            }
        } else {
            poseLabel = '';
            isLunges = false;
            GlobalUnityInstance.SendMessage('Player', 'Move', 0);
        }
    }
    GlobalUnityInstance.SendMessage('Pose', 'SetText', poseLabel);
    console.log(poseLabel);

    classifyPose();

}


function gotPoses(poses) {
    if (poses.length > 0) {
        pose = poses[0].pose;
        skeleton = poses[0].skeleton;
    }
}


function modelLoaded() {
    console.log('poseNet ready');
}

function draw() {
    push();
    translate(video.width, 0);
    scale(-1, 1);
    image(video, video.width / 1.6, video.height / 5, video.width / 3, video.height / 3);

    // if (pose) {
    //     for (let i = 0; i < skeleton.length; i++) {
    //         let a = skeleton[i][0];
    //         let b = skeleton[i][1];
    //         strokeWeight(2);
    //         stroke(0);

    //         line(a.position.x, a.position.y, b.position.x, b.position.y);
    //     }
    //     for (let i = 0; i < pose.keypoints.length; i++) {
    //         let x = pose.keypoints[i].position.x;
    //         let y = pose.keypoints[i].position.y;
    //         fill(0);
    //         stroke(255);
    //         ellipse(x, y, 16, 16);
    //     }
    // }
    pop();

    fill(255, 255, 255);
    noStroke();
    // textSize(100);
    // textAlign(CENTER, CENTER);
    // text(poseLabel, width / 2, height / 2);
}