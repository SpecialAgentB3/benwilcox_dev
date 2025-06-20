import React from 'react';
import './ProgressBar.css';

const ProgressBar = ({ progress, message }) => {
  return (
    <div className="progress-container">
      <div className="progress-bar-wrapper">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="progress-message">{message}</div>
    </div>
  );
};

export default ProgressBar; 