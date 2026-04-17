import React from 'react';

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

const clampSentimentScore = (score: number | null): number => {
  if (typeof score !== 'number' || Number.isNaN(score)) return 0;
  return clamp(score, -1, 1);
};

interface SentimentCortisolChartProps {
  score: number | null;
  relevanceScore?: number | null;
}

export default function SentimentCortisolChart({
  score,
  relevanceScore,
}: SentimentCortisolChartProps) {
  const normalizedScore = clampSentimentScore(score);
  const absScore = Math.abs(normalizedScore);
  const radius = 42;
  const center = 60;
  const strokeWidth = 12;
  const arcAngle = absScore * 360;

  const normalizedRelevance =
    typeof relevanceScore === 'number' && !Number.isNaN(relevanceScore)
      ? clamp(relevanceScore, 0, 1)
      : 1;

  const chartScale = 0.88 + normalizedRelevance * 0.12;
  const arcOpacity = 0.55 + normalizedRelevance * 0.45;

  const ringColor =
    normalizedScore > 0.1
      ? '#34C85E'
      : normalizedScore < -0.1
        ? '#EF4444'
        : '#F59E0B';

  const toPolar = (angleInDegrees: number) => {
    const radians = (angleInDegrees * Math.PI) / 180;
    return {
      x: center + radius * Math.sin(radians),
      y: center - radius * Math.cos(radians),
    };
  };

  const createArcPath = (): string | null => {
    if (arcAngle <= 0) return null;

    const clockwise = normalizedScore >= 0;
    const safeAngle = Math.min(arcAngle, 360);
    const endAngle = clockwise ? safeAngle : -safeAngle;
    const sweepFlag = clockwise ? 1 : 0;

    const startPoint = toPolar(0);
    if (safeAngle >= 360) {
      const halfPoint = toPolar(clockwise ? 180 : -180);
      return [
        `M ${startPoint.x} ${startPoint.y}`,
        `A ${radius} ${radius} 0 0 ${sweepFlag} ${halfPoint.x} ${halfPoint.y}`,
        `A ${radius} ${radius} 0 0 ${sweepFlag} ${startPoint.x} ${startPoint.y}`,
      ].join(' ');
    }

    const endPoint = toPolar(endAngle);
    const largeArcFlag = safeAngle > 180 ? 1 : 0;

    return [
      `M ${startPoint.x} ${startPoint.y}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endPoint.x} ${endPoint.y}`,
    ].join(' ');
  };

  const arcPath = createArcPath();
  const signedScoreText = normalizedScore > 0
    ? `+${normalizedScore.toFixed(2)}`
    : normalizedScore.toFixed(2);

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-28 w-28">
        <svg
          viewBox="0 0 120 120"
          className="h-full w-full"
          style={{ transform: `scale(${chartScale})` }}
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="rgba(148,163,184,0.25)"
            strokeWidth={strokeWidth}
            fill="none"
          />

          {arcPath && (
            <path
              d={arcPath}
              stroke={ringColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="none"
              opacity={arcOpacity}
            />
          )}

          <text
            x={center}
            y={center}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={ringColor}
            className="text-sm font-bold"
          >
            {signedScoreText}
          </text>
        </svg>
      </div>
    </div>
  );
}
