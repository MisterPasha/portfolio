const bodySensors = [
  { id: 'left-calf', label: 'LEFT CALF', x: 39, y: 88 },
  { id: 'left-thigh', label: 'LEFT THIGH', x: 43, y: 72 },
  { id: 'right-calf', label: 'RIGHT CALF', x: 61, y: 88 },
  { id: 'right-thigh', label: 'RIGHT THIGH', x: 57, y: 72 },
  { id: 'back', label: 'BACK', x: 50, y: 39 },
  { id: 'left-lower-arm', label: 'LEFT LOWER ARM', x: 21, y: 53 },
  { id: 'left-upper-arm', label: 'LEFT UPPER ARM', x: 29, y: 37 },
  { id: 'right-lower-arm', label: 'RIGHT LOWER ARM', x: 79, y: 53 },
  { id: 'right-upper-arm', label: 'RIGHT UPPER ARM', x: 71, y: 37 },
]

export default function HumanSensorDiagram({ misalignedSensorIds = [], visibleSensorIds, className = '' }) {
  const misaligned = new Set(misalignedSensorIds)
  const visible = visibleSensorIds ? new Set(visibleSensorIds) : null

  return (
    <div className={`human-sensor-diagram ${className}`} aria-hidden="true">
      <svg className="human-sensor-outline" viewBox="0 0 420 560">
        <circle className="har-human-line" cx="210" cy="112" r="58" />

        <rect className="har-limb" x="142" y="174" width="136" height="238" rx="64" />
        <rect className="har-limb faint" x="77" y="194" width="52" height="222" rx="26" transform="rotate(13 103 305)" />
        <rect className="har-limb faint" x="291" y="194" width="52" height="222" rx="26" transform="rotate(-13 317 305)" />
        <rect className="har-limb faint" x="135" y="393" width="58" height="178" rx="29" transform="rotate(11 164 482)" />
        <rect className="har-limb faint" x="227" y="393" width="58" height="178" rx="29" transform="rotate(-11 256 482)" />
      </svg>

      {bodySensors.map((sensor) => (
        <span
          className={`human-sensor-node ${misaligned.has(sensor.id) ? 'is-misaligned' : ''} ${visible && !visible.has(sensor.id) ? 'is-removed' : ''}`}
          style={{
            left: `${sensor.x}%`,
            top: `${sensor.y}%`,
          }}
          key={sensor.id}
        >
          <i />
          <em>{sensor.label}</em>
        </span>
      ))}
    </div>
  )
}
