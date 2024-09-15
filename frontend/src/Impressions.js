import React, { useState, useRef, useEffect, useContext } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "./firebase";
import "./Impressions.css";

const Impressions = () => {
  const [images, setImages] = useState([]);
  const [drawings, setDrawings] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapshot1 = await getDocs(collection(db, "processed_images"));
        const snapshot2 = await getDocs(collection(db, "drawings"));

        const images = snapshot1.docs.map((doc) => ({
          url: doc.data().image_url,
        }));
        const drawings = snapshot2.docs.map((doc) => ({
          url: doc.data().image,
        }));

        setImages(images);
        setDrawings(drawings);

        console.log(images[0].url);
        console.log(drawings);
      } catch (err) {
        console.log(err);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="intro-wrapper">
      <div className="impression-header">Check Out Your Impressions ~</div>
      <div className="intro-container">
        <div className="card">
          {images.length > 0 && images[0].url ? (
            <img src={images[0].url} />
          ) : (
            <p>Loading...</p> // Or a placeholder image
          )}
        </div>
        <div className="card">
          {images.length > 0 && images[1].url ? (
            <img src={images[1].url} />
          ) : (
            <p>Loading...</p> // Or a placeholder image
          )}
        </div>
        <div className="card">
          {drawings.length > 0 && drawings[1].url ? (
            <img src={drawings[0].url} />
          ) : (
            <p>Loading...</p> // Or a placeholder image
          )}
        </div>
        <div className="card">
          {drawings.length > 0 && images[0].url ? (
            <img src={drawings[1].url} />
          ) : (
            <p>Loading...</p> // Or a placeholder image
          )}
        </div>
      </div>
    </div>
  );
};

export default Impressions;
