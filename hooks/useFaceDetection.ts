import { useEffect, useState } from "react";
import FaceDetection, {
  FaceContourType,
  FaceDetectorContourMode,
  FaceDetectorLandmarkMode,
  FaceLandmarkType,
  FaceResult,
} from "react-native-face-detection";

const options = {
  landmarkMode: FaceDetectorLandmarkMode.ALL,
  contourMode: FaceDetectorContourMode.ALL,
};

const processFaces = async (imagePath: string) => {
  const faces = await FaceDetection.processImage(imagePath, options);
  return faces;

  // for (const face of faces) {
  //   console.log("Head rotation on X axis: ", face.headEulerAngleX);
  //   console.log("Head rotation on Y axis: ", face.headEulerAngleY);
  //   console.log("Head rotation on Z axis: ", face.headEulerAngleZ);

  //   console.log("Left eye open probability: ", face.leftEyeOpenProbability);
  //   console.log("Right eye open probability: ", face.rightEyeOpenProbability);
  //   console.log("Smiling probability: ", face.smilingProbability);

  //   for (const contour of face.faceContours) {
  //     if (contour.type === FaceContourType.FACE) {
  //       console.log("Face outline points: ", contour.points);
  //     }
  //   }

  //   for (const landmark of face.landmarks) {
  //     if (landmark.type === FaceLandmarkType.LEFT_EYE) {
  //       console.log("Left eye outline points: ", landmark.points);
  //     } else if (landmark.type === FaceLandmarkType.RIGHT_EYE) {
  //       console.log("Right eye outline points: ", landmark.points);
  //     }
  //   }
  // }
};

export const useFaceDetection = () => {
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [result, setResult] = useState<FaceResult[] | null>(null);

  useEffect(() => {
    if (imagePath) {
      processFaces(imagePath).then(setResult);
    }
  }, [imagePath]);

  return { imagePath, setImagePath, result };
};
