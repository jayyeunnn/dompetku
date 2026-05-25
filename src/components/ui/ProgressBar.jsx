export default function ProgressBar({
  current,
  target,
  color = 'var(--color-income)',
  height = 'h-2.5',
  showLabel = false,
  animated = true,
}) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0

  return (
    <div className="w-full">
      <div
        className={`w-full bg-background-secondary rounded-full overflow-hidden ${height}`}
      >
        <div
          className={`${height} rounded-full transition-all duration-700 ease-out ${
            animated ? 'animate-[progressFill_1s_ease-out]' : ''
          }`}
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-text-tertiary tabular-nums">
            {percentage.toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  )
}
