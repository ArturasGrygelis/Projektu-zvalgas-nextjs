import React from 'react';

interface TimeDisplayProps {
  timestamp: Date | string;
}

const TimeDisplay: React.FC<TimeDisplayProps> = ({ timestamp }) => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return <span>{date.toLocaleTimeString()}</span>;
};

export default TimeDisplay;