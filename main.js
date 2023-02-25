// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/pose

// the link to your model provided by Teachable Machine export panel
let Lunges = 1;
let model, webcam, ctx, labelContainer, maxPredictions;
let isWalking = false;
let isJumping = false;
let isFighting = false;
let probList = [];
let poseName = "";
let prevMove, prevMoveJump = "";
let inputs = [];
let stopRecording = false;
let className;

async function init() {
    stopRecording = false;
    const modelURL = "./Model/model.json";
    const metadataURL = "./Model/metadata.json";

    const modelURLS = "./SModel/model.json";
    const metadataURLS = "./SModel/metadata.json";
    // load the model and metadata
    // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
    // Note: the pose library adds a tmPose object to your window (window.tmPose)

    if (GlobalChoice != null) {
        if (GlobalChoice == "Not Seated") {
            model = await tmPose.load(modelURL, metadataURL);
        } else {
            model = await tmPose.load(modelURLS, metadataURLS);
        }
    }
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
async function stop() {
    if (webcam != null) {
        stopRecording = true;
        await webcam.pause();
    }
}
async function loop(timestamp) {
    if (stopRecording)
        return;
    webcam.update(); // update the webcam frame
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    if (stopRecording)
        return;
    // Prediction #1: run input through posenet
    // estimatePose can take in an image, video or canvas html element
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    // Prediction 2: run input through teachable machine classification model
    const prediction = await model.predict(posenetOutput);


    for (let i = 0; i < maxPredictions; i++) {
        probList[i] = parseFloat(prediction[i].probability.toFixed(2));
        className = prediction[i].className;
    }
    let maxVal = Math.max.apply(Math, probList);
    let i = probList.indexOf(maxVal);

    if (GlobalChoice == "Seated") {
        var str = prediction[i].className;
        var firstSpace = str.indexOf(" ");
        var newStr = str.slice(firstSpace);
        className = newStr.slice(1);
    } else {
        className = prediction[i].className;
    }
    console.log(className);
    let arrAvg = arr => arr.reduce((a, b) => a + b, 0) / arr.length
    let minScoreLowerHalf = arrAvg(inputs.slice(6, 10));
    if (window.unityInstance != null) {
        if (minScoreLowerHalf >= 0.35) {
            //IDLE
            if (className == "Idle" && maxVal == 1) {
                isJumping = false;
                isWalking = false;
                isFighting = false;
                prevMove = "";
                poseName = "Idle"
                window.unityInstance.SendMessage('Player', 'Walk', 0 + '*' + poseName);
            }

            //TURN
            if (maxVal >= 0.9) {
                if (className == "(R) Sumo Sidebends") {
                    Lunges = 1;
                    poseName = "(R) Sumo Sidebends | R-Turn"
                    window.unityInstance.SendMessage('Player', 'Flip', Lunges);
                }
                if (className == "(L) Sumo Sidebends") {
                    Lunges = -1;
                    poseName = "(L) Sumo Sidebends | L-Turn"
                    window.unityInstance.SendMessage('Player', 'Flip', Lunges);
                }
            }
            //WALK
            if (maxVal == 1) {
                if (className == "(R) Jog" || className == "(L) Jog") {
                    isWalking = true;
                    poseName = "Jog | Walk";
                    window.unityInstance.SendMessage('Player', 'Walk', Lunges + '*' + poseName);
                }
                else {
                    isWalking = false;
                    window.unityInstance.SendMessage('Player', 'Walk', 0 + '*' + poseName);
                }
                if (isWalking) {
                    setTimeout(function () {
                        poseName = "Idle";
                        window.unityInstance.SendMessage('Player', 'Walk', 0 + '*' + poseName);
                        isWalking = false;
                    }, 500);
                }
            }
            //FIGHT
            if (maxVal >= 0.75) {
                if (className == "(R) Side Crunches" || className == "(L) Side Crunches") {

                    if (prevMove == "(L) Side Crunches" && className == "(R) Side Crunches") {
                        isFighting = true;
                        poseName = "Side Crunches | Fight";
                        window.unityInstance.SendMessage('Player', 'Fight', poseName);
                    }
                    else if (prevMove == "(R) Side Crunches" && className == "(L) Side Crunches") {
                        isFighting = true;
                        poseName = "Side Crunches | Fight";
                        window.unityInstance.SendMessage('Player', 'Fight', poseName);
                    }
                    prevMove = className;
                }
                if (isFighting) {
                    setTimeout(function () {
                        poseName = "Idle";
                        window.unityInstance.SendMessage('Player', 'Walk', 0 + '*' + poseName);
                        isFighting = false;
                    }, 500);
                }
            }

            //JUMP
            if (maxVal == 1) {
                if (className == "(Up) Arm Circles" || className == "(Down) Arm Circles") {

                    if (prevMoveJump == "(Up) Arm Circles" && className == "(Down) Arm Circles") {
                        isJumping = true;
                        poseName = "Arm Circles | Jump";
                        window.unityInstance.SendMessage('Player', 'Jump', poseName);
                    }
                    else if (prevMoveJump == "(Down) Arm Circles" && className == "(Up) Arm Circles") {
                        isJumping = true;
                        poseName = "Arm Circles | Jump";
                        window.unityInstance.SendMessage('Player', 'Jump', poseName);
                    }
                    prevMoveJump = className;
                }
                if (isJumping) {
                    setTimeout(function () {
                        poseName = "Idle";
                        window.unityInstance.SendMessage('Player', 'Walk', 0 + '*' + poseName);
                        isJumping = false;
                    }, 100);
                }
            }
        } else {
            poseName = "Reposition Yourself"
            window.unityInstance.SendMessage('Player', 'Walk', 0 + '*' + poseName);
        }
        window.unityInstance.SendMessage('Pose', 'SetTextPoseLabel', poseName);
    }
    // finally draw the poses
    drawPose(pose);
}

function drawPose(pose) {
    if (stopRecording)
        return;
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
            // tmPose.drawKeypoints(pose.keypoints.slice(5, -2), minPartConfidence, ctx, 2.5, 'black', 1);
            // tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx, 2.5, 'white', 1);
        }
    }
}