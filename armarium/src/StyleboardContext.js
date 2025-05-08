import React, { createContext, useState, useContext } from 'react';

const StyleboardContext = createContext();

export const StyleboardProvider = ({ children }) => {
  const [styleboards, setStyleboards] = useState([]);

  return (
    <StyleboardContext.Provider value={{ styleboards, setStyleboards }}>
      {children}
    </StyleboardContext.Provider>
  );
};

export const useStyleboardContext = () => useContext(StyleboardContext);