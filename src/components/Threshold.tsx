'use client'

interface ThresholdProps {
  threshold: number
  onThresholdChange: (value: number) => void
}

export default function Threshold({ threshold, onThresholdChange }: ThresholdProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        Confidence Threshold: {threshold.toFixed(2)}
      </label>
      <input
        type="range"
        min={0.5}
        max={0.99}
        step={0.01}
        value={threshold}
        onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>50%</span>
        <span>75%</span>
        <span>99%</span>
      </div>
    </div>
  )
}
