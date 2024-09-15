import React, { useState, useRef, useEffect, useContext } from "react";
import { GlobalContext } from "./GlobalContext";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db, storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import "./Whiteboard.css";

const Whiteboard = () => {
  const canvasRef1 = useRef(null);
  const isDrawing = useRef(false);
  const { id } = useContext(GlobalContext);
  const [doc, setDoc] = useState();
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const canvas = canvasRef1.current;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const fetchData = async () => {
      try {
        const snapshot = await getDocs(collection(db, "processed_images"));
        const data = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((doc) => doc.id !== id);
        setDoc(data[0]);
      } catch (err) {
        console.log(err);
      }
    };

    fetchData();
  }, [id]);

  const getCoordinates = (event) => {
    const canvas = canvasRef1.current;
    const rect = canvas.getBoundingClientRect();
    const x =
      ((event.clientX - rect.left) / (rect.right - rect.left)) * canvas.width;
    const y =
      ((event.clientY - rect.top) / (rect.bottom - rect.top)) * canvas.height;
    return { x, y };
  };

  const startDrawing = (x, y) => {
    const canvas = canvasRef1.current;
    const context = canvas.getContext("2d");
    isDrawing.current = true;
    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (x, y) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef1.current;
    const context = canvas.getContext("2d");
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing.current) return;
    const canvas = canvasRef1.current;
    const context = canvas.getContext("2d");
    isDrawing.current = false;
    context.closePath();
  };

  const handleErase = () => {
    const canvas1 = canvasRef1.current;
    const context1 = canvas1.getContext("2d");
    context1.clearRect(0, 0, canvas1.width, canvas1.height);
  };

  const getCanvasBlob = async (canvas, type = "image/jpeg") => {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to convert canvas to blob."));
        }
      }, type);
    });
  };

  const handleSubmit = async () => {
    setLoading(true);

    const canvas = canvasRef1.current;
    if (!canvas) return;

    try {
      const blob = await getCanvasBlob(canvas);
      const storageRef = ref(storage, `images/${uuidv4()}`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      console.log("url is like ", downloadURL);

      await addDoc(collection(db, "drawings"), {
        image: downloadURL,
      });

      console.log("Data uploaded successfully");
      setShowPopup(true); // Show the pop-up window
    } catch (error) {
      console.error("Error uploading data", error);
    } finally {
      setLoading(false);
    }
  };
  const Popup = ({ message, onClose }) => {
    return (
      <div className="popup-overlay">
        <div className="popup">
          <h2>Success!</h2>
          <p>{message}</p>
          <button className="close-popup" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  };

  const handleMouseDown = (e) => {
    const { x, y } = getCoordinates(e);
    startDrawing(x, y);
  };

  const handleMouseMove = (e) => {
    const { x, y } = getCoordinates(e);
    draw(x, y);
  };

  const handleMouseUp = () => {
    stopDrawing();
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    const { x, y } = getCoordinates(touch);
    startDrawing(x, y);
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    const { x, y } = getCoordinates(touch);
    draw(x, y);
    e.preventDefault();
  };

  const handleTouchEnd = () => {
    stopDrawing();
  };

  useEffect(() => {
    const canvas1 = canvasRef1.current;
    const context1 = canvas1.getContext("2d");
    context1.lineWidth = 5;
    context1.strokeStyle = "#000";
    context1.lineCap = "round";

    canvas1.addEventListener("mousedown", handleMouseDown);
    canvas1.addEventListener("mousemove", handleMouseMove);
    canvas1.addEventListener("mouseup", handleMouseUp);
    canvas1.addEventListener("touchstart", handleTouchStart);
    canvas1.addEventListener("touchmove", handleTouchMove);
    canvas1.addEventListener("touchend", handleTouchEnd);

    return () => {
      canvas1.removeEventListener("mousedown", handleMouseDown);
      canvas1.removeEventListener("mousemove", handleMouseMove);
      canvas1.removeEventListener("mouseup", handleMouseUp);
      canvas1.removeEventListener("touchstart", handleTouchStart);
      canvas1.removeEventListener("touchmove", handleTouchMove);
      canvas1.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return (
    <div className="webcam-container">
      <div className="header">Draw something for your new friend ~</div>
      <div className="canvas-container">
        <canvas
          className="webcam-view"
          width="700"
          height="500"
          ref={canvasRef1}
        ></canvas>
        <div className="webcam-view" width="500" height="500">
          <p>{doc ? doc.description : "Loading..."}</p>
        </div>
      </div>
      <div className="button-container">
        <button className="submit" onClick={handleSubmit} disabled={loading}>
          {loading ? "Submitting..." : "Submit"}
        </button>
        <button className="erase" onClick={handleErase} disabled={loading}>
          Erase
        </button>
      </div>
      {showPopup && (
        <Popup
          message="Your drawing was submitted successfully!"
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
};

export default Whiteboard;
