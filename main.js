// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/pose

// the link to your model provided by Teachable Machine export panel
let Lunges = 1;
let model, webcam, ctx, labelContainer, maxPredictions;
let listOfProbabilities = [];
let inputs = [];

async function init() {
    const modelURL = "./Model/model.json";
    const metadataURL = "./Model/metadata.json";

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
    console.log(maxVal);
    let minScore = Math.min.apply(Math, inputs);
    if (window.unityInstance != null) {
        if (maxVal > 0.75 && minScore >= 0.1) {
            let str = prediction[listOfProbabilities.indexOf(maxVal)].className;
            poseLabel = str;

            // "(L) Lunges",
            // "(R) Lunges",
            // "(L) Oblique Crunches",
            // "(R) Oblique Crunches",
            // "Squats",
            // "Surrender Squats",
            // "Idle"

            // Turn-Walk
            if (poseLabel == '(L) Lunges') {
                Lunges = -1;
                window.unityInstance.SendMessage('Player', 'Flip', Lunges);
                window.unityInstance.SendMessage('Player', 'Walk', Lunges + '|' + poseLabel);
            }
            else if (poseLabel == '(R) Lunges') {
                Lunges = 1;
                window.unityInstance.SendMessage('Player', 'Flip', Lunges);
                window.unityInstance.SendMessage('Player', 'Walk', Lunges + '|' + poseLabel);
            }
            // Jump
            else if (poseLabel == '(L) Oblique Crunches') {
                Lunges = -1;
                window.unityInstance.SendMessage('Player', 'Flip', Lunges);
                window.unityInstance.SendMessage('Player', 'Jump', poseLabel);
            }
            else if (poseLabel == '(R) Oblique Crunches') {
                Lunges = 1;
                window.unityInstance.SendMessage('Player', 'Flip', Lunges);
                window.unityInstance.SendMessage('Player', 'Jump', poseLabel);
            }
            // Idle
            else if (poseLabel == 'Idle') {
                window.unityInstance.SendMessage('Player', 'Walk', 0 + '|' + poseLabel);
            }
            // Fight
            else if (poseLabel == 'Squats' || poseLabel == 'Surrender Squats') {
                window.unityInstance.SendMessage('Player', 'Fight', poseLabel);
            }
        } else {
            poseLabel = 'REPOSITION YOURSELF';
            window.unityInstance.SendMessage('Player', 'Walk', 0 + '|' + poseLabel);
        }
        console.log(poseLabel);
        window.unityInstance.SendMessage('Pose', 'SetTextPoseLabel', poseLabel);
    }
    // finally draw the poses
    drawPose(pose);
}

function drawPose(pose) {
    if (webcam.canvas) {
        ctx.drawImage(webcam.canvas, 0, 0);
        // draw the keypoints and skeleton
        if (pose) {
            const minPartConfidence = 0.1;
            inputs = [];
            for (let i = 5; i < pose.keypoints.length - 2; i++) {
                let x = pose.keypoints[i].score;
                inputs.push(x);
            }
            console.log(inputs);
            tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx, 5, 'black', 1);
            tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx, 5, 'white', 1);
        }
    }
}