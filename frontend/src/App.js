import { useState } from "react";
import "./App.css";
import CustomWebcam from "./CustomWebcam";
import Impressions from "./Impressions";
import Whiteboard from './Whiteboard';
import { GlobalProvider } from './GlobalContext';
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { deleteDoc, doc } from 'firebase/firestore';

function App() {
  const [step, setStep] = useState(1);

  const prevStep = () => {
    setStep((prevStep) => {
      if (prevStep > 2) {
        return 2;
      }
      return Math.max(prevStep - 1, 1);
    });
  };

  const deleteAllDocsInSnapshot = async (snapshot, collectionName) => {
    const deletePromises = snapshot.docs.map(async (docSnap) => {
      const docRef = doc(db, collectionName, docSnap.id); // Use the provided collectionName
      await deleteDoc(docRef);
    });
  
    await Promise.all(deletePromises);
  };

  const deleteFun = async () => {
    const snapshot1 = await getDocs(collection(db, "processed_images"));
    const snapshot2 = await getDocs(collection(db, "drawings"));

    await deleteAllDocsInSnapshot(snapshot1, "processed_images");
    await deleteAllDocsInSnapshot(snapshot2, "drawings");
  }

  const nextStep = () => {
    if (step === 3) {
      console.log("delete");
      deleteFun();
    }
    setStep((prevStep) => Math.min(prevStep + 1, 3));
  };

  return (
    <GlobalProvider>
      <div className="App">
        {step === 1 && <CustomWebcam />}
        {step === 2 && <Whiteboard />}
        {step === 3 && <Impressions />}
        <div className="navigation-buttons">
          <button className="navigation" onClick={prevStep}>Previous</button>
          <button className="navigation" onClick={nextStep}>Next</button>
        </div>
      </div>
    </GlobalProvider>
  );
}

export default App;
