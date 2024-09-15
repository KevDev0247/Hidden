import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

function FirebaseTest() {
  const [inputValue, setInputValue] = useState("");
  const [data, setData] = useState([]);

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const addData = async () => {
    try {
      await addDoc(collection(db, "test-collection"), {
        text: inputValue,
      });
      setInputValue(""); // Clear the input field
      fetchData(); // Refresh the data after adding a new document
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  const fetchData = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "test-collection"));
      const docsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setData(docsData);
    } catch (e) {
      console.error("Error fetching documents: ", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <h1>Firebase Connection Test</h1>
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder="Enter some text"
      />
      <button onClick={addData}>Add Data</button>

      <h2>Data from Firestore:</h2>
      <ul>
        {data.map((item) => (
          <li key={item.id}>{item.text}</li>
        ))}
      </ul>
    </div>
  );
}

export default FirebaseTest;
