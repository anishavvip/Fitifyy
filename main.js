// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/pose

// the link to your model provided by Teachable Machine export panel
let Lunges = 1;
let model, webcam, ctx, labelContainer, maxPredictions;
let listOfProbabilities = [];
let inputs = [];

async function init() {
    const modelURL = "./JS/Model/model.json";
    const metadataURL = "./JS/Model/metadata.json";

    // load the model and metadata
    // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
    // Note: the pose library adds a tmPose object to your window (window.tmPose)
    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Convenience function to setup a webcam
    const size = 200;
    const flip = true; // whether to flip the webcam
    webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
    await webcam.setup(); // request access to the webcam
    await webcam.play();
    window.requestAnimationFrame(loop);

    // append/get elements to the DOM
    const canvas = document.getElementById("canvas1");
    canvas.width = size; canvas.height = size;
    ctx = canvas.getContext("2d");
}

async function loop(timestamp) {
    webcam.update(); // update the webcam frame
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    // Prediction #1: run input through posenet
    // estimatePose can take in an image, video or canvas html element
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    // Prediction 2: run input through teachable machine classification model
    const prediction = await model.predict(posenetOutput);

    for (let i = 0; i < maxPredictions; i++) {
        listOfProbabilities[i] = parseFloat(prediction[i].probability.toFixed(2));
    }

    let maxVal = Math.max.apply(Math, listOfProbabilities);
    let minScore = Math.min.apply(Math, inputs);
    if (GlobalUnityInstance != null) {
        if (maxVal > 0.95 && minScore > 0.50) {
            let str = prediction[listOfProbabilities.indexOf(maxVal)].className;
            poseLabel = str;
            // Walk
            if (poseLabel == 'Jog') {
                GlobalUnityInstance.SendMessage('Player', 'Move', Lunges + '|' + poseLabel);
            }
            // Turn
            else if (poseLabel == '(L) Lunges') {
                Lunges = -1;
                GlobalUnityInstance.SendMessage('Player', 'Flip', Lunges + '|' + poseLabel);
            }
            else if (poseLabel == '(R) Lunges') {
                Lunges = 1;
                GlobalUnityInstance.SendMessage('Player', 'Flip', Lunges + '|' + poseLabel);
            }
            // Jump
            else if (poseLabel == 'Jumping Jacks' || poseLabel == 'Surrender') {
                GlobalUnityInstance.SendMessage('Player', 'Jump', poseLabel);
            }
            else if (poseLabel == 'Idle') {
                GlobalUnityInstance.SendMessage('Player', 'Move', 0 + '|' + poseLabel);
            }
            // Fight
            else if (poseLabel == 'Squats') {
                GlobalUnityInstance.SendMessage('Player', 'Fight', poseLabel);
            }
        } else {
            poseLabel = 'REPOSITION YOURSELF';
            GlobalUnityInstance.SendMessage('Player', 'Move', 0 + '|' + poseLabel);
        }
        console.log(poseLabel);
        GlobalUnityInstance.SendMessage('Pose', 'SetText', poseLabel);
    }
    // finally draw the poses
    drawPose(pose);
}

function drawPose(pose) {
    if (webcam.canvas) {
        ctx.drawImage(webcam.canvas, 0, 0);
        // draw the keypoints and skeleton
        if (pose) {
            const minPartConfidence = 0.5;
            inputs = [];
            for (let i = 5; i < pose.keypoints.length - 2; i++) {
                let x = pose.keypoints[i].score;
                inputs.push(x);
            }
            console.log(inputs);
            tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
            tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
        }
    }
}