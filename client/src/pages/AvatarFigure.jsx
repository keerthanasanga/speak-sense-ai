import React, { useMemo, useEffect, useRef, useState, memo } from 'react';
import PropTypes from 'prop-types';
import './AvatarFigure.css'; // Ensure CSS animations are imported

// ==================== CONSTANTS & CONFIG ====================
const AVATAR_CONFIG = {
  skin: {
    male: '#FCCDA4',
    female: '#FDDBB4',
    innerEar: '#e8a886',
    nose: '#c8946a',
    lips: '#dd8a6c',
    blush: '#f9a8d4'
  },
  hair: {
    male: '#2E1A0E',
    female: '#5C3A1E',
    highlight: '#7a4f2e',
    gray: '#808080',
    blonde: '#D4A76A',
    red: '#B84A3A'
  },
  eyes: {
    male: '#1e40af',
    female: '#7c3aed',
    brown: '#634832',
    green: '#2e7d32',
    blue: '#1976d2'
  },
  animation: {
    speakingDuration: 3000,
    thinkingDuration: 2000,
    nodDuration: 1500,
    blinkInterval: 4000,
    breathInterval: 3000
  }
};

const ANIMAL_PERSONALITIES = {
  owl: { class: 'animal-personality-calm', traits: ['wise', 'calm', 'observant'] },
  fox: { class: 'animal-personality-energetic', traits: ['clever', 'quick', 'playful'] },
  panda: { class: 'animal-personality-gentle', traits: ['gentle', 'patient', 'kind'] },
  default: { class: 'animal-personality-default', traits: ['friendly', 'engaging'] }
};

// ==================== PROP TYPES ====================
export const AvatarPropTypes = {
  avatar: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string.isRequired,
    gender: PropTypes.oneOf(['male', 'female', 'non-binary']),
    species: PropTypes.string,
    role: PropTypes.string,
    color: PropTypes.string,
    bgColor: PropTypes.string,
    avatar: PropTypes.string,
    hairColor: PropTypes.oneOf(['dark', 'blonde', 'red', 'gray']),
    eyeColor: PropTypes.oneOf(['blue', 'brown', 'green', 'default'])
  }),
  isSpeaking: PropTypes.bool,
  posture: PropTypes.oneOf(['idle', 'thinking', 'speaking', 'listening', 'nodding']),
  onAnimationComplete: PropTypes.func,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  interactive: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
  ariaLabel: PropTypes.string
};

// ==================== UTILITY FUNCTIONS ====================
const getHairColor = (hairColor, gender) => {
  const colorMap = {
    dark: gender === 'female' ? AVATAR_CONFIG.hair.female : AVATAR_CONFIG.hair.male,
    blonde: AVATAR_CONFIG.hair.blonde,
    red: AVATAR_CONFIG.hair.red,
    gray: AVATAR_CONFIG.hair.gray
  };
  return colorMap[hairColor] || (gender === 'female' ? AVATAR_CONFIG.hair.female : AVATAR_CONFIG.hair.male);
};

const getEyeColor = (eyeColor) => {
  const colorMap = {
    blue: AVATAR_CONFIG.eyes.blue,
    brown: AVATAR_CONFIG.eyes.brown,
    green: AVATAR_CONFIG.eyes.green
  };
  return colorMap[eyeColor] || AVATAR_CONFIG.eyes.male;
};

const getAnimalPersonality = (avatar) => {
  const name = (avatar?.name || '').toLowerCase();
  const role = (avatar?.role || '').toLowerCase();
  const icon = avatar?.avatar || '';

  if (name.includes('luna') || role.includes('owl') || icon === '🦉') return ANIMAL_PERSONALITIES.owl;
  if (name.includes('rex') || role.includes('fox') || icon === '🦊') return ANIMAL_PERSONALITIES.fox;
  if (name.includes('coco') || role.includes('panda') || icon === '🐼') return ANIMAL_PERSONALITIES.panda;
  return ANIMAL_PERSONALITIES.default;
};

const getPostureClass = (isSpeaking, posture) => {
  if (isSpeaking) return 'avatar-speaking';
  
  const postureMap = {
    thinking: 'avatar-thinking',
    nodding: 'avatar-nodding',
    listening: 'avatar-listening',
    idle: 'avatar-idle'
  };
  
  return postureMap[posture] || 'avatar-idle';
};

// ==================== HOOKS ====================
const useAvatarAnimations = (isSpeaking, posture, onAnimationComplete) => {
  const [localIsSpeaking, setLocalIsSpeaking] = useState(isSpeaking);
  const [localPosture, setLocalPosture] = useState(posture);
  const speakingTimerRef = useRef(null);
  const postureTimerRef = useRef(null);

  useEffect(() => {
    // Sync with props
    setLocalIsSpeaking(isSpeaking);
    setLocalPosture(posture);

    // Handle animation completion
    if (isSpeaking) {
      clearTimeout(speakingTimerRef.current);
      speakingTimerRef.current = setTimeout(() => {
        setLocalIsSpeaking(false);
        onAnimationComplete?.('speaking');
      }, AVATAR_CONFIG.animation.speakingDuration);
    }

    if (posture === 'nodding') {
      clearTimeout(postureTimerRef.current);
      postureTimerRef.current = setTimeout(() => {
        setLocalPosture('idle');
        onAnimationComplete?.('nodding');
      }, AVATAR_CONFIG.animation.nodDuration);
    }

    if (posture === 'thinking') {
      clearTimeout(postureTimerRef.current);
      postureTimerRef.current = setTimeout(() => {
        setLocalPosture('idle');
        onAnimationComplete?.('thinking');
      }, AVATAR_CONFIG.animation.thinkingDuration);
    }

    return () => {
      clearTimeout(speakingTimerRef.current);
      clearTimeout(postureTimerRef.current);
    };
  }, [isSpeaking, posture, onAnimationComplete]);

  return { localIsSpeaking, localPosture };
};

const useBlinkAnimation = () => {
  const [isBlinking, setIsBlinking] = useState(false);
  const blinkTimerRef = useRef(null);

  useEffect(() => {
    const scheduleBlink = () => {
      blinkTimerRef.current = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 150);
        scheduleBlink();
      }, AVATAR_CONFIG.animation.blinkInterval);
    };

    scheduleBlink();

    return () => clearTimeout(blinkTimerRef.current);
  }, []);

  return isBlinking;
};

// ==================== SVG COMPONENTS ====================

const AvatarDefs = memo(({ suiteColor, hasGlow = true }) => (
  <defs>
    {hasGlow && (
      <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={suiteColor} stopOpacity="0.3" />
        <stop offset="100%" stopColor={suiteColor} stopOpacity="0" />
      </radialGradient>
    )}
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.2" />
    </filter>
    <filter id="speakingGlow">
      <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
      <feMerge>
        <feMergeNode in="offsetblur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
));

AvatarDefs.displayName = 'AvatarDefs';

const Body = memo(({ suiteShade, isFemale, suiteColor, hasTie = true }) => (
  <>
    {/* Jacket with texture */}
    <rect x="52" y="185" width="96" height="130" rx="20" fill={suiteShade} filter="url(#softShadow)" />
    
    {/* Shirt with subtle pattern */}
    <rect x="58" y="190" width="84" height="120" rx="15" fill="white" opacity="0.15" />
    
    {/* Collar */}
    <polygon points="85,185 100,210 115,185" fill="white" opacity="0.9" />
    
    {/* Lapels with highlight */}
    <polygon points="85,185 70,200 85,215 100,210" fill={suiteShade} opacity="0.9" />
    <polygon points="115,185 130,200 115,215 100,210" fill={suiteShade} opacity="0.9" />
    
    {/* Tie/Jewelry with animation */}
    {!isFemale && hasTie && (
      <g className="avatar-tie">
        <polygon points="100,205 106,225 100,260 94,225" fill="#c53030" />
        <polygon points="100,205 106,215 100,225 94,215" fill="#9b2c2c" />
      </g>
    )}
    {isFemale && (
      <g className="avatar-necklace">
        <circle cx="100" cy="215" r="5" fill={suiteColor} />
        <circle cx="100" cy="225" r="3" fill={suiteColor} opacity="0.7" />
      </g>
    )}
    
    {/* Buttons with shine */}
    {!isFemale && (
      <g className="avatar-buttons">
        <circle cx="100" cy="240" r="3" fill="rgba(255,255,255,0.4)" />
        <circle cx="100" cy="258" r="3" fill="rgba(255,255,255,0.4)" />
        <circle cx="100" cy="276" r="3" fill="rgba(255,255,255,0.4)" />
        <circle cx="100" cy="240" r="1" fill="white" />
        <circle cx="100" cy="258" r="1" fill="white" />
        <circle cx="100" cy="276" r="1" fill="white" />
      </g>
    )}
  </>
));

Body.displayName = 'Body';

const Arms = memo(({ suiteShade, skinColor, isPointing = false }) => (
  <>
    {/* Left arm with slight rotation */}
    <g className={`avatar-left-arm ${isPointing ? 'pointing' : ''}`}>
      <rect x="20" y="188" width="32" height="90" rx="14" fill={suiteShade} />
      <ellipse cx="36" cy="285" rx="14" ry="12" fill={skinColor} />
      {/* Hand detail */}
      <path d="M30 280 Q36 275 42 280" stroke={skinColor} strokeWidth="2" fill="none" />
    </g>
    
    {/* Right arm with gesture support */}
    <g className={`avatar-right-arm ${isPointing ? 'gesturing' : ''}`}>
      <rect x="148" y="188" width="32" height="90" rx="14" fill={suiteShade} />
      <ellipse cx="164" cy="285" rx="14" ry="12" fill={skinColor} />
      {/* Hand detail */}
      <path d="M158 280 Q164 275 170 280" stroke={skinColor} strokeWidth="2" fill="none" />
    </g>
  </>
));

Arms.displayName = 'Arms';

const Hair = memo(({ isFemale, hairColor, style = 'modern' }) => {
  const hairStyles = {
    modern: isFemale ? (
      <>
        <ellipse cx="60" cy="145" rx="18" ry="45" fill={hairColor} />
        <ellipse cx="140" cy="145" rx="18" ry="45" fill={hairColor} />
        <ellipse cx="100" cy="100" rx="44" ry="28" fill={hairColor} />
        <ellipse cx="90" cy="98" rx="10" ry="6" fill={AVATAR_CONFIG.hair.highlight} opacity="0.5" />
      </>
    ) : (
      <>
        <ellipse cx="100" cy="97" rx="44" ry="20" fill={hairColor} />
        <ellipse cx="80" cy="95" rx="12" ry="8" fill={hairColor} />
        <ellipse cx="115" cy="93" rx="10" ry="7" fill={hairColor} />
      </>
    ),
    classic: isFemale ? (
      <>
        <path d="M56 100 Q80 90 144 100" fill={hairColor} />
        <ellipse cx="100" cy="105" rx="44" ry="25" fill={hairColor} />
      </>
    ) : (
      <ellipse cx="100" cy="97" rx="44" ry="18" fill={hairColor} />
    )
  };

  return hairStyles[style] || hairStyles.modern;
});

Hair.displayName = 'Hair';

const Eyes = memo(({ isFemale, eyeColor, isBlinking, expression = 'neutral' }) => {
  const eyeExpressions = {
    neutral: { left: "82,129", right: "118,129" },
    surprised: { left: "82,127", right: "118,127" },
    thinking: { left: "82,131", right: "118,131" }
  };

  const exp = eyeExpressions[expression] || eyeExpressions.neutral;

  if (isBlinking) {
    return (
      <>
        <path d="M72 128 Q82 122 92 128" stroke="#111" strokeWidth="2" fill="none" />
        <path d="M108 128 Q118 122 128 128" stroke="#111" strokeWidth="2" fill="none" />
      </>
    );
  }

  return (
    <>
      {/* Left eye */}
      <ellipse className="avatar-eye avatar-eye-left" cx="82" cy="128" rx="10" ry="9" fill="white" />
      <ellipse className="avatar-iris avatar-iris-left" cx={exp.left.split(',')[0]} cy={exp.left.split(',')[1]} rx="6" ry="6" fill={eyeColor} />
      <ellipse className="avatar-pupil avatar-pupil-left" cx={exp.left.split(',')[0]} cy={exp.left.split(',')[1]} rx="3.5" ry="3.5" fill="#111" />
      <circle cx={Number(exp.left.split(',')[0]) + 2} cy={Number(exp.left.split(',')[1]) - 2} r="1.5" fill="white" />

      {/* Right eye */}
      <ellipse className="avatar-eye avatar-eye-right" cx="118" cy="128" rx="10" ry="9" fill="white" />
      <ellipse className="avatar-iris avatar-iris-right" cx={exp.right.split(',')[0]} cy={exp.right.split(',')[1]} rx="6" ry="6" fill={eyeColor} />
      <ellipse className="avatar-pupil avatar-pupil-right" cx={exp.right.split(',')[0]} cy={exp.right.split(',')[1]} rx="3.5" ry="3.5" fill="#111" />
      <circle cx={Number(exp.right.split(',')[0]) + 2} cy={Number(exp.right.split(',')[1]) - 2} r="1.5" fill="white" />

      {/* Eye lashes for female */}
      {isFemale && (
        <>
          <path d="M74 120 Q78 116 82 119" stroke={AVATAR_CONFIG.hair.female} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M110 119 Q114 116 118 120" stroke={AVATAR_CONFIG.hair.female} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </>
      )}
    </>
  );
});

Eyes.displayName = 'Eyes';

const Mouth = memo(({ expression = 'neutral' }) => {
  const mouthShapes = {
    neutral: "M85 160 Q100 155 115 160",
    smile: "M85 160 Q100 170 115 160",
    thinking: "M85 160 Q100 152 115 160",
    speaking: "M85 155 Q100 170 115 155"
  };

  return (
    <g className="avatar-mouth">
      <ellipse className="avatar-jaw" cx="100" cy="161" rx="13" ry="7" fill={AVATAR_CONFIG.skin.nose} opacity="0.2" />
      <path
        d={mouthShapes[expression] || mouthShapes.neutral}
        stroke={AVATAR_CONFIG.skin.nose}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path 
        d="M85 160 Q92 155 100 156 Q108 155 115 160 Q107 163 100 164 Q93 163 85 160 Z"
        fill={AVATAR_CONFIG.skin.lips}
      />
    </g>
  );
});

Mouth.displayName = 'Mouth';

const Head = memo(({ 
  isFemale, 
  skinColor, 
  hairColor, 
  eyeColor, 
  isBlinking, 
  expression,
  hairStyle 
}) => (
  <g className="avatar-head">
    {/* Head shape with subtle shadow */}
    <ellipse cx="100" cy="140" rx="44" ry="50" fill={skinColor} filter="url(#softShadow)" />
    
    {/* Hair */}
    <Hair isFemale={isFemale} hairColor={hairColor} style={hairStyle} />
    
    {/* Neck */}
    <rect x="89" y="165" width="22" height="28" rx="6" fill={skinColor} />
    
    {/* Ears */}
    <ellipse cx="56" cy="143" rx="7" ry="10" fill={skinColor} />
    <ellipse cx="144" cy="143" rx="7" ry="10" fill={skinColor} />
    <ellipse cx="56" cy="143" rx="4" ry="6" fill={AVATAR_CONFIG.skin.innerEar} opacity="0.5" />
    <ellipse cx="144" cy="143" rx="4" ry="6" fill={AVATAR_CONFIG.skin.innerEar} opacity="0.5" />

    {/* Eyebrows with animation */}
    <path 
      className="avatar-brow avatar-brow-left" 
      d={expression === 'thinking' ? "M75 115 Q82 110 90 114" : "M75 118 Q82 113 90 117"} 
      stroke={hairColor} 
      strokeWidth="2.5" 
      fill="none" 
      strokeLinecap="round" 
    />
    <path 
      className="avatar-brow avatar-brow-right" 
      d={expression === 'thinking' ? "M110 114 Q118 110 125 115" : "M110 117 Q118 113 125 118"} 
      stroke={hairColor} 
      strokeWidth="2.5" 
      fill="none" 
      strokeLinecap="round" 
    />

    <Eyes 
      isFemale={isFemale} 
      eyeColor={eyeColor} 
      isBlinking={isBlinking}
      expression={expression}
    />

    {/* Nose */}
    <ellipse cx="100" cy="142" rx="5" ry="7" fill="transparent" stroke={AVATAR_CONFIG.skin.nose} strokeWidth="1.2" opacity="0.6" />
    <path d="M95 149 Q100 152 105 149" stroke={AVATAR_CONFIG.skin.nose} strokeWidth="1.5" fill="none" strokeLinecap="round" />

    <Mouth expression={expression} />

    {/* Cheeks blush with animation */}
    <ellipse cx="69" cy="148" rx="10" ry="7" fill={AVATAR_CONFIG.skin.blush} opacity="0.25" className="avatar-blush" />
    <ellipse cx="131" cy="148" rx="10" ry="7" fill={AVATAR_CONFIG.skin.blush} opacity="0.25" className="avatar-blush" />
  </g>
));

Head.displayName = 'Head';

// ==================== MAIN COMPONENTS ====================

const AnimalAvatar = memo(({ avatar, isSpeaking, suiteColor, size = 'md', onClick }) => {
  const personality = getAnimalPersonality(avatar);
  const postureClass = getPostureClass(isSpeaking, avatar?.posture);
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    sm: 'avatar-sm',
    md: 'avatar-md',
    lg: 'avatar-lg',
    xl: 'avatar-xl'
  };

  return (
    <div 
      className={`avatar-figure-wrapper ${postureClass} ${personality.class} ${sizeClasses[size]} ${isHovered ? 'avatar-hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      role={onClick ? 'button' : 'figure'}
      tabIndex={onClick ? 0 : -1}
      aria-label={`${avatar?.name} avatar - ${avatar?.role}`}
    >
      <div className="animal-avatar">
        <div className="animal-aura" style={{ background: `radial-gradient(circle, ${suiteColor}30 0%, transparent 70%)` }} />
        
        {/* Ears with animation */}
        <div className="animal-ears">
          <span className="animal-ear left"></span>
          <span className="animal-ear right"></span>
        </div>

        {/* Face */}
        <div className="animal-face">
          <div className="animal-eye left">
            <span className="pupil" />
          </div>
          <div className="animal-eye right">
            <span className="pupil" />
          </div>
          <div className={`animal-mouth ${isSpeaking ? 'speaking' : ''}`} />
        </div>

        {/* Body */}
        <div className="animal-emoji" aria-hidden="true">
          {avatar?.avatar || '🐾'}
        </div>
        
        <div className="animal-tail" />
        
        <div className="animal-nameplate" style={{ color: suiteColor }}>
          {avatar?.name}
        </div>
        
        <div className="animal-role-badge">
          {avatar?.role}
        </div>
      </div>

      {/* Speaking effect */}
      {isSpeaking && (
        <>
          <div className="avatar-speak-ring" style={{ borderColor: suiteColor }} />
          <div className="avatar-speak-wave" style={{ backgroundColor: suiteColor }} />
        </>
      )}
    </div>
  );
});

AnimalAvatar.displayName = 'AnimalAvatar';

const HumanAvatar = memo(({ 
  avatar, 
  isSpeaking, 
  suiteColor, 
  size = 'md',
  interactive = false,
  onClick,
  className = ''
}) => {
  const isFemale = avatar?.gender === 'female';
  const skinColor = isFemale ? AVATAR_CONFIG.skin.female : AVATAR_CONFIG.skin.male;
  const hairColor = getHairColor(avatar?.hairColor, avatar?.gender);
  const eyeColor = getEyeColor(avatar?.eyeColor);
  const suiteShade = isFemale ? '#be185d' : '#1e3a5f';
  const [isHovered, setIsHovered] = useState(false);
  const [expression, setExpression] = useState('neutral');
  
  const { localIsSpeaking, localPosture } = useAvatarAnimations(
    isSpeaking, 
    avatar?.posture,
    () => setExpression('neutral')
  );
  
  const isBlinking = useBlinkAnimation();

  // Update expression based on posture
  useEffect(() => {
    if (localPosture === 'thinking') {
      setExpression('thinking');
    } else if (localPosture === 'speaking' || localIsSpeaking) {
      setExpression('speaking');
    } else if (localPosture === 'nodding') {
      setExpression('smile');
    } else {
      setExpression('neutral');
    }
  }, [localPosture, localIsSpeaking]);

  const postureClass = getPostureClass(localIsSpeaking, localPosture);
  
  const sizeClasses = {
    sm: 'avatar-sm',
    md: 'avatar-md',
    lg: 'avatar-lg',
    xl: 'avatar-xl'
  };

  const hairStyle = avatar?.hairStyle || 'modern';

  return (
    <div 
      className={`avatar-figure-wrapper ${postureClass} ${sizeClasses[size]} ${isHovered ? 'avatar-hovered' : ''} ${className}`}
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => interactive && setIsHovered(false)}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : 'figure'}
      tabIndex={interactive ? 0 : -1}
      aria-label={`${avatar?.name} avatar - ${avatar?.role}`}
    >
      <svg
        viewBox="0 0 200 350"
        xmlns="http://www.w3.org/2000/svg"
        className="avatar-svg"
        aria-hidden="true"
      >
        <AvatarDefs suiteColor={suiteColor} hasGlow={localIsSpeaking} />
        
        {/* Shadow with animation */}
        <ellipse cx="100" cy="340" rx="65" ry="12" fill="rgba(0,0,0,0.2)" className="avatar-shadow" />

        <Body 
          suiteShade={suiteShade} 
          isFemale={isFemale} 
          suiteColor={suiteColor}
          hasTie={!isFemale && avatar?.hasTie !== false}
        />
        
        <Arms 
          suiteShade={suiteShade} 
          skinColor={skinColor}
          isPointing={localPosture === 'speaking' || localIsSpeaking}
        />
        
        <Head 
          isFemale={isFemale}
          skinColor={skinColor}
          hairColor={hairColor}
          eyeColor={eyeColor}
          isBlinking={isBlinking}
          expression={expression}
          hairStyle={hairStyle}
        />
      </svg>

      {/* Name and role overlay for larger sizes */}
      {size !== 'sm' && (
        <div className="avatar-info-overlay">
          <div className="avatar-name" style={{ color: suiteColor }}>
            {avatar?.name}
          </div>
          <div className="avatar-role-tag">
            {avatar?.role}
          </div>
        </div>
      )}

      {/* Speaking effects */}
      {localIsSpeaking && (
        <>
          <div className="avatar-speak-ring" style={{ borderColor: suiteColor }} />
          <div className="avatar-speak-wave" style={{ backgroundColor: suiteColor }} />
        </>
      )}

      {/* Status indicator */}
      {avatar?.status && (
        <div className={`avatar-status-indicator status-${avatar.status}`} />
      )}
    </div>
  );
});

HumanAvatar.displayName = 'HumanAvatar';

// ==================== MAIN COMPONENT ====================

const AvatarFigure = ({
  avatar,
  isSpeaking = false,
  posture = 'idle',
  onAnimationComplete,
  size = 'md',
  interactive = false,
  onClick,
  className = '',
  ariaLabel
}) => {
  const isAnimal = avatar?.species === 'animal';
  const suiteColor = avatar?.color || '#4f9eff';

  // Merge posture with avatar
  const avatarWithState = useMemo(
    () => ({ ...avatar, posture }),
    [avatar, posture]
  );

  return (
    <>
      {isAnimal ? (
        <AnimalAvatar
          avatar={avatarWithState}
          isSpeaking={isSpeaking}
          suiteColor={suiteColor}
          size={size}
          onClick={interactive ? onClick : undefined}
        />
      ) : (
        <HumanAvatar
          avatar={avatarWithState}
          isSpeaking={isSpeaking}
          suiteColor={suiteColor}
          size={size}
          interactive={interactive}
          onClick={onClick}
          className={className}
        />
      )}
      
      {/* Screen reader only description */}
      {ariaLabel && (
        <span className="sr-only">{ariaLabel}</span>
      )}
    </>
  );
};

AvatarFigure.propTypes = AvatarPropTypes;

export default memo(AvatarFigure);