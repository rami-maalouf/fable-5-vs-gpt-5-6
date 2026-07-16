import { Canvas, Circle, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { StyleSheet, useWindowDimensions } from 'react-native';

import type { AppTheme } from '@/theme';

import { rgba } from './color';
import { starfieldConfig } from './chrome-tokens';

type StarfieldViewProps = {
  theme: AppTheme;
};

export function StarfieldView({ theme }: StarfieldViewProps) {
  const { width, height } = useWindowDimensions();
  const shootingStar = starfieldConfig.shootingStar;

  return (
    <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Rect x={0} y={0} width={width} height={height}>
        <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={[...theme.backgroundGradient]} />
      </Rect>
      {starfieldConfig.stars.map((star, index) => (
        <Circle
          key={`${star.x}-${star.y}-${index}`}
          cx={star.x * width}
          cy={star.y * height}
          r={star.size}
          color={rgba('#ffffff', star.opacity)}
        />
      ))}
      {Array.from({ length: starfieldConfig.shootingStarTrailCount }, (_, index) => {
        const progress = index / starfieldConfig.shootingStarTrailCount;
        return (
          <Circle
            key={`shooting-${index}`}
            cx={shootingStar.startX * width + shootingStar.travelX * progress}
            cy={shootingStar.startY * height + shootingStar.travelY * progress}
            r={Math.max(1.2, 4 - index / 3)}
            color={rgba('#ffffff', (starfieldConfig.shootingStarTrailCount - index) / 10)}
          />
        );
      })}
    </Canvas>
  );
}
