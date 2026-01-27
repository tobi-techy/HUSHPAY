import React, { useMemo } from 'react';

export const Cityscape: React.FC = () => {
  const buildings = useMemo(() => {
    const count = 40;
    return Array.from({ length: count }).map((_, i) => {
      const height = Math.random() * 200 + 50; // Random height between 50 and 250
      const width = Math.random() * 40 + 20; // Random width
      const hasWindows = Math.random() > 0.3;
      return { height, width, hasWindows, left: i * 35 }; // Overlapping positions
    });
  }, []);

  return (
    <div className="fixed bottom-0 left-0 w-full h-64 pointer-events-none overflow-hidden z-0 opacity-50">
      <div className="absolute bottom-0 w-full flex items-end justify-center space-x-1">
        {buildings.map((b, i) => (
          <div
            key={i}
            className="border-t-2 border-l-2 border-r-2 border-gray-800 bg-black relative"
            style={{
              height: `${b.height}px`,
              width: `${b.width}px`,
              marginRight: '-10px' // Overlap
            }}
          >
            {b.hasWindows && (
              <div className="grid grid-cols-2 gap-1 p-1 opacity-30">
                {Array.from({ length: Math.floor(b.height / 20) }).map((_, j) => (
                  <React.Fragment key={j}>
                    <div className={`h-1 w-1 ${Math.random() > 0.5 ? 'bg-gray-600' : 'bg-transparent'}`}></div>
                    <div className={`h-1 w-1 ${Math.random() > 0.5 ? 'bg-gray-600' : 'bg-transparent'}`}></div>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
