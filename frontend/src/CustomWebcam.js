import Webcam from "react-webcam";
import { useCallback, useRef, useState, useContext } from "react";
import { GlobalContext } from './GlobalContext';
import { v4 as uuidv4 } from 'uuid';
import "./CustomWebcam.css";

const CustomWebcam = () => {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);
  
  const { setId } = useContext(GlobalContext);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImgSrc(imageSrc);

    // Convert base64 image to a Blob
    const blob = dataURItoBlob(imageSrc);

    const id = uuidv4();
    setId(id);  // Save the id globally

    // Create FormData and append the image
    const formData = new FormData();
    formData.append("file", blob, "webcam.jpg");
    formData.append("id", id);

    // Send the image to the backend
    fetch("http://127.0.0.1:5000/process", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => setApiResponse(data))
      .catch((error) => setApiResponse({ error: error }));
  }, [webcamRef]);

  // Helper function to convert base64 to Blob
  function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(",")[1]);
    const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }

  // Function to reset the image
  const reset = () => {
    setImgSrc(null);
  };

  return (
    <div className="webcam-container">
      {imgSrc ? (
        <>
          <img src={imgSrc} alt="webcam" className="captured-image" />
          <button onClick={reset} className="btn">
            Retake Photo
          </button>
        </>
      ) : (
        <>
          <Webcam
            className="webcam-view"
            height={600}
            width={600}
            ref={webcamRef}
          />
          <button onClick={capture} className="btn">
            Capture Photo
          </button>
        </>
      )}
    </div>
  );
};

export default CustomWebcam;
