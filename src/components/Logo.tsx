import React from 'react';

const Logo: React.FC<{ width?: number }> = ({ width = 160 }) => {
  return (
    <svg
      width={width}
      viewBox="0 0 400 120"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Logo EvalStage2"
    >
      <rect
        x="5"
        y="5"
        width="390"
        height="110"
        rx="25"
        fill="#ffffff"
        stroke="#3ecf8e"
        strokeWidth="4"
      />

      <text
        x="40"
        y="78"
        fontFamily="'Nunito', 'Inter', sans-serif"
        fontWeight="700"
        fontSize="64"
        letterSpacing="8"
      >
        <tspan fill="#ffb347">E</tspan>
        <tspan fill="#6ec1e4" dx="-2">V</tspan>
        <tspan fill="#b39ddb" dx="-2">A</tspan>
        <tspan fill="#3ecf8e" dx="-2">L</tspan>
      </text>
      <text
        x="250"
        y="78"
        fontFamily="'Nunito', 'Inter', sans-serif"
        fontWeight="700"
        fontSize="64"
        fill="#ffe066"
      >
        2
      </text>
    </svg>
  );
};

export default Logo; 
