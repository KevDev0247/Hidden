import React, { createContext, useState } from 'react';

// Create a context to store the id globally
export const GlobalContext = createContext();

// Create a provider component
export const GlobalProvider = ({ children }) => {
  const [id, setId] = useState(null);  // State to store the globally shared id

  return (
    <GlobalContext.Provider value={{ id, setId }}>
      {children}
    </GlobalContext.Provider>
  );
};