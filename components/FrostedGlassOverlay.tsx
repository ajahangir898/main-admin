import React from 'react';

const FrostedGlassOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-white bg-opacity-10 backdrop-blur-md" />
  );
};

export default FrostedGlassOverlay;
