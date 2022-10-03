import { useEffect, useRef } from "react";

import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import "@tensorflow/tfjs-core";
// Register WebGL backend.
import "@tensorflow/tfjs-backend-webgl";
import "@mediapipe/face_mesh";

import Webcam from "react-webcam";

const App = () => {
  const webcam = useRef<Webcam>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  const runFaceDetect = async () => {
    const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
    const detectorConfig = {
      runtime: "mediapipe", // or 'tfjs'
      solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh",
    } as any;
    const detector = await faceLandmarksDetection.createDetector(
      model,
      detectorConfig
    );
    detect(detector);
  };

  const detect = async (model: any) => {
    if (webcam.current && canvas.current) {
      const webcamCurrent = webcam.current as any;
      // go next step only when the video is completely uploaded.
      if (webcamCurrent.video.readyState === 4) {
        const video = webcamCurrent.video;
        const videoWidth = webcamCurrent.video.videoWidth;
        const videoHeight = webcamCurrent.video.videoHeight;
        canvas.current.width = videoWidth;
        canvas.current.height = videoHeight;
        const predictions = await model.estimateFaces(video);
        console.log(predictions);
        requestAnimationFrame(() => {
          drawBox(predictions);
        });
        setTimeout(() => {
          console.log("rerun");
          detect(model);
        }, 500);
      } else {
        setTimeout(() => {
          console.log("rerun");
          detect(model);
        }, 500);
      }
    }
  };

  const drawBox = (predictions: any) => {
    try {
      if (canvas.current) {
        const ctx = canvas.current.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          // Font options.
          const font = "16px sans-serif";
          ctx.font = font;
          ctx.textBaseline = "top";

          predictions.forEach((prediction: any) => {
            const x = prediction.box.xMin;
            const y = prediction.box.yMin;
            const width = prediction.box.width;
            const height = prediction.box.height;
            ctx.beginPath();
            ctx.rect(x, y, width, height);
            ctx.strokeStyle = "red";
            ctx.stroke();
          });
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    console.log("run");
    runFaceDetect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webcam.current?.video?.readyState]);

  return (
    <div className="App">
      <header className="header">
        <div className="title">Face Detection</div>
      </header>
      <Webcam
        audio={false}
        ref={webcam}
        style={{
          position: "absolute",
          margin: "auto",
          textAlign: "center",
          top: 50,
          left: 0,
          right: 0,
        }}
      />
      <canvas
        ref={canvas}
        style={{
          position: "absolute",
          margin: "auto",
          textAlign: "center",
          top: 50,
          left: 0,
          right: 0,
        }}
      />
    </div>
  );
};

export default App;
