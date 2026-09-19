import React, { useEffect, useState } from 'react';

interface CosmicParallaxBgProps {
  /**
   * Main heading text (displayed large in the center)
   */
  head?: string;
  
  /**
   * Subtitle text (displayed below the heading)
   * Comma-separated string that will be split into animated parts
   */
  text?: string;
  
  /**
   * Whether the text animations should loop
   * @default true
   */
  loop?: boolean;
  
  /**
   * Custom class name for additional styling
   */
  className?: string;

  /**
   * Optional child content to render over or inside the cosmic container
   */
  children?: React.ReactNode;
}

/**
 * A cosmic parallax background component with animated stars and text
 */
const CosmicParallaxBg: React.FC<CosmicParallaxBgProps> = ({
  head = '',
  text = '',
  loop = true,
  className = '',
  children,
}) => {
  const [smallStars, setSmallStars] = useState<string>('');
  const [mediumStars, setMediumStars] = useState<string>('');
  const [bigStars, setBigStars] = useState<string>('');
  
  // Split the text by commas and trim whitespace
  const textParts = text ? text.split(',').map(part => part.trim()) : [];
  
  // Generate random star positions
  const generateStarBoxShadow = (count: number): string => {
    let shadows = [];
    
    for (let i = 0; i < count; i++) {
      const x = Math.floor(Math.random() * 2000);
      const y = Math.floor(Math.random() * 2000);
      shadows.push(`${x}px ${y}px #FFF`);
    }
    
    return shadows.join(', ');
  };
  
  useEffect(() => {
    // Generate star shadows when component mounts
    setSmallStars(generateStarBoxShadow(700));
    setMediumStars(generateStarBoxShadow(200));
    setBigStars(generateStarBoxShadow(100));
    
    // Set animation iteration based on loop prop
    document.documentElement.style.setProperty(
      '--animation-iteration', 
      loop ? 'infinite' : '1'
    );
  }, [loop]);
  
  return (
    <div className={`cosmic-parallax-container ${className}`}>
      {/* Stars layers */}
      <div 
        id="stars" 
        style={{ boxShadow: smallStars }}
        className="cosmic-stars"
      ></div>
      <div 
        id="stars2" 
        style={{ boxShadow: mediumStars }}
        className="cosmic-stars-medium"
      ></div>
      <div 
        id="stars3" 
        style={{ boxShadow: bigStars }}
        className="cosmic-stars-large"
      ></div>
      
      {/* Horizon and Earth */}
      <div id="horizon">
        <div className="glow"></div>
      </div>
      <div id="earth"></div>
      
      {/* Title and subtitle */}
      {head && <div id="title">{head.toUpperCase()}</div>}
      {textParts.length > 0 && (
        <div id="subtitle">
          {textParts.map((part, index) => (
            <React.Fragment key={index}>
              <span className={`subtitle-part-${index + 1}`}>{part.toUpperCase()}</span>
              {index < textParts.length - 1 && ' '}
            </React.Fragment>
          ))}
        </div>
      )}

      {children}
    </div>
  );
};

export { CosmicParallaxBg };
export default CosmicParallaxBg;
