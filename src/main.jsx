import React from 'react';
import ReactDOM from 'react-dom/client';
import './index-DESKTOP-8LU0NJT.css';
import './App-DESKTOP-8LU0NJT.css';
import Snowfall from 'react-snowfall';
import SelectOption from './options-DESKTOP-8LU0NJT.jsx';

let primary1 = getComputedStyle(document.documentElement).getPropertyValue('--primary1');
let primary2 = getComputedStyle(document.documentElement).getPropertyValue('--primary2');
let primary3 = getComputedStyle(document.documentElement).getPropertyValue('--primary3');
let masterOfBuster = getComputedStyle(document.documentElement).getPropertyValue('--main-bust-theme');

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


{// BACKEND CONSOLE LOGS FOR DEV PURPOSES
  console.log("%cChange the full UI of App structure and option buttons like show list customise list, more...","color: white; background-color: black; padding: 10px; font-size: 16px; border-radius: 5px;");

  document.querySelector('ul'); // This will show the ul list in BACKEND CONSOLE
}