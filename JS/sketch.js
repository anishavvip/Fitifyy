let video;
let poseNet;
let pose;
let skeleton;

let brain;
let poseLabel = '';

let NotInputlist = [0, 1, 2, 3, 4]
function setup() {
    createCanvas(320, 320);
    video = createCapture(VIDEO);
    video.hide();
    poseNet = ml5.poseNet(video, modelLoaded);
    poseNet.on('pose', gotPoses);

    let options = {
        inputs: 12,
        outputs: 4,
        task: 'classification',
        debug: true
    }
    brain = ml5.neuralNetwork(options);
    const modelInfo = {
        model: './JS/Model/model.json',
        metadata: './JS/Model/model_meta.json',
        weights: './JS/Model/model.weights.bin',
    };
    brain.load(modelInfo, brainLoaded);
}

function brainLoaded() {
    console.log('pose classification ready!');
    classifyPose();
}

function classifyPose() {
    if (pose) {

        let inputs = [];
        // console.log('len:', pose.keypoints.length, pose.keypoints);
        for (let i = 0; i < pose.keypoints.length; i++) {
            if (!NotInputlist.includes(i)) {
                let x = pose.keypoints[i].position.x;
                let y = pose.keypoints[i].position.y;
                inputs.push(x);
                inputs.push(y);
            }
        }
        console.log(inputs);
        brain.classify(inputs, gotResult);
    } else {
        setTimeout(classifyPose, 10);

    }
}

let Lunges = 1;
// ['Idle', 'Jog', 'Jump', 'Squats', '(L) Lunges', '(R) Lunges', 'Surrender', 'High Knees',
// '(R) Lunge Kick', '(L) Lunge Kick']
function gotResult(error, results) {

    if (results) {
        if (results[0].confidence >= 0.80) {
            poseLabel = results[0].label;
            if (poseLabel == 'Jog' || poseLabel == 'High Knees') {
                GlobalUnityInstance.SendMessage('Player', 'Move', Lunges + '|' + poseLabel);
            }
            else if (poseLabel == '(L) Lunges' || poseLabel == '(L) Lunge Kick') {
                Lunges = -1;
                GlobalUnityInstance.SendMessage('Player', 'Flip', Lunges + '|' + poseLabel);
            }
            else if (poseLabel == '(R) Lunges' || poseLabel == '(R) Lunge Kick') {
                Lunges = 1;
                GlobalUnityInstance.SendMessage('Player', 'Flip', Lunges + '|' + poseLabel);
            }
            else if (poseLabel == 'Jump' || poseLabel == 'Surrender') {
                GlobalUnityInstance.SendMessage('Player', 'Jump', poseLabel);
            }
            else if (poseLabel == 'Idle') {
                GlobalUnityInstance.SendMessage('Player', 'Move', 0 + '|' + poseLabel);
            }
            else if (poseLabel == 'Squats') {
                GlobalUnityInstance.SendMessage('Player', 'Fight', poseLabel);
            }
        } else {
            poseLabel = '';
            GlobalUnityInstance.SendMessage('Player', 'Move', 0 + '|' + poseLabel);
        }
        GlobalUnityInstance.SendMessage('Pose', 'SetText', poseLabel);
        console.log(results[0].confidence);
        classifyPose();
    }
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
    // image(video, 0, 0, video.width, video.height);
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
    //             if (!NotInputlist.includes(i)) {
    //             let x = pose.keypoints[i].position.x;
    //             let y = pose.keypoints[i].position.y;
    //             fill(0);
    //             stroke(255);
    //             ellipse(x, y, 16, 16);
    //         }
    //     }
    // }
    pop();

    fill(255, 255, 255);
    noStroke();
    // textSize(50);
    // textAlign(0, 0);
    // text(poseLabel, width / 2, height / 2);
}