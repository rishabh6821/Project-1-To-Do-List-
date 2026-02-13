import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './App.css';
import Snowfall from 'react-snowfall';
import SelectOption from './Options.jsx';

// Get CSS variables with fallback values
const getCSSVariable = (varName, fallback) => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return value || fallback;
};

let primary1 = getCSSVariable('--primary1', '#F9F9F9');
let primary2 = getCSSVariable('--primary2', '#FFFFFF');
let primary3 = getCSSVariable('--primary3', '#F5F5F5');
let masterOfBuster = getCSSVariable('--main-bust-theme', '#B0B0B0');

let colorOptionsSnowfall = {
    // bg: ['#38320d', '#12c986', '#1e3a8a', '#6b21a8', '#be185d'],
    // snow: ['#ffffff', '#f8223d', '#22d3ee', '#facc15', '#10b981']
    bg: [primary1, primary2, primary3, masterOfBuster],
    snow: ['#ffffff', '#f8223d', '#22d3ee', '#facc15', '#10b981']
};

let pos = colorOptionsSnowfall.snow[Math.floor(Math.random() * colorOptionsSnowfall.snow.length)];
ReactDOM.createRoot(document.getElementById('background-shaders-snowfall')).render(
    <Snowfall color={pos} style={{background: colorOptionsSnowfall.bg[Math.floor(Math.random() * colorOptionsSnowfall.bg.length)], zIndex: '-5', position: 'absolute', pointerEvents: 'none'}} radius={pos === colorOptionsSnowfall.snow[0] ? [5, 10] : [3, 4]}/>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SelectOption />
  </React.StrictMode>,
);
