/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";

import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import * as faceMesh from "@mediapipe/face_mesh";
import "@tensorflow/tfjs-core";
// Register WebGL backend.
import "@tensorflow/tfjs-backend-webgl";

import Webcam from "react-webcam";

const App = () => {
  const webcam = useRef<Webcam>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  const [isCapture, setIsCapture] = useState<boolean>(false);
  const [currentPrediction, setCurrentPrediction] = useState();
  const [capturedRaw, setCapturedRaw] = useState<any>([]);
  const [capturedFace, setCapturedFace] = useState<any>([]);

  const runDetection = async () => {
    const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
    const detectorConfig = {
      runtime: "mediapipe", // or 'tfjs'
      solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@${faceMesh.VERSION}`,
      maxFaces: 10,
    } as any;
    // create detector
    const detector = await faceLandmarksDetection.createDetector(model, detectorConfig);
    // run detection
    await detect(detector);
  };

  const detect = async (detector: any) => {
    try {
      if (webcam.current && canvas.current && detector) {
        const webcamCurrent = webcam.current as any;
        const videoWidth = webcamCurrent.video.videoWidth;
        const videoHeight = webcamCurrent.video.videoHeight;
        canvas.current.width = videoWidth;
        canvas.current.height = videoHeight;
        // go next step only when the video is completely uploaded.
        if (webcamCurrent.video.readyState === 4) {
          const video = webcamCurrent.video;
          const predictions = await detector.estimateFaces(video);
          setCurrentPrediction(predictions);
          if (predictions.length > 0) {
            requestAnimationFrame(() => {
              draw(predictions);
            });
          }
          setTimeout(() => {
            detect(detector);
          }, 250);
        } else {
          setTimeout(() => {
            detect(detector);
          }, 250);
        }
      }
    } catch (error) {
      setTimeout(() => {
        detect(detector);
      }, 250);
    }
  };

  const draw = (predictions: any) => {
    try {
      if (canvas.current) {
        const ctx = canvas.current.getContext("2d");
        if (ctx) {
          predictions.forEach((prediction: any) => {
            drawBox(ctx, prediction);
            drawFaceMesh(ctx, prediction);
          });
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const drawBox = (ctx: any, prediction: any) => {
    const x = prediction.box.xMin;
    const y = prediction.box.yMin;
    const width = prediction.box.width;
    const height = prediction.box.height;
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.strokeStyle = "red";
    ctx.stroke();
  };

  const drawFaceMesh = (ctx: any, prediction: any) => {
    prediction.keypoints.forEach((item: any, index: string) => {
      const x = item.x;
      const y = item.y;
      ctx.fillRect(x, y, 2, 2);
      ctx.fillStyle = "#69ffe1";
    });
  };

  const capture = (predictions: any) => {
    try {
      const webcamCurrent = webcam.current as any;
      predictions.forEach((x: any) => {
        const faceCanvas = document.createElement("canvas");
        faceCanvas.width = x.box.width;
        faceCanvas.height = x.box.height;
        const ctx = faceCanvas.getContext("2d") as CanvasRenderingContext2D;
        const image = new Image();
        image.onload = () => {
          ctx.drawImage(image, x.box.xMin, x.box.yMin, x.box.width, x.box.height, 0, 0, x.box.width, x.box.height);
        };
        image.src = webcamCurrent.getScreenshot();
        setCapturedFace((prevState: any) => [...prevState, faceCanvas.toDataURL("image/jpeg", 1)]);
      });
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    runDetection();
  }, [webcam.current?.video?.readyState]);

  useEffect(() => {
    if (isCapture && webcam.current && currentPrediction) {
      capture(currentPrediction);
    }
  }, [currentPrediction]);

  return (
    <div className="App">
      <header className="header">
        <div className="title">Face Detection</div>
        <button onClick={() => setIsCapture(!isCapture)}>capture {isCapture ? "on" : "off"}</button>
      </header>
      <Webcam
        ref={webcam}
        audio={false}
        screenshotFormat="image/jpeg"
        style={{
          position: "absolute",
          margin: "auto",
          textAlign: "center",
          top: 250,
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
          top: 250,
          left: 0,
          right: 0,
        }}
      />
      <div style={{ display: "flex" }}>
        {capturedFace.map((x: string) => (
          <img src={x} alt={x} height={100} width={100} />
        ))}
      </div>
      <div style={{ display: "flex", whiteSpace:"pre-line" }}>
        {capturedRaw.map((x: string) => (
          <img src={x} alt={x} height={100} width={100} />
        ))}
      </div>
    </div>
  );
};

export default App;
