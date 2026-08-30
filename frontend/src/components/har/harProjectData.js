export const harProjectData = {
  title: 'Wearable Activity Recognition',
  subtitle: 'Characterising sensor data misalignments & model robustness',
  model: 'ConvBoost with a ConvLSTM backbone',
  dataset: {
    name: 'REALDISP',
    imus: 9,
    participants: 17,
    activities: 33,
    frequencyHz: 50,
  },
  prototypes: [
    '/assets/projects/har/sensor-prototype-01.webp',
    '/assets/projects/har/sensor-prototype-02.webp',
  ],
  hardware: {
    frequencyHz: 40,
    expectedIntervalMs: 25,
    offsetsAfterOneHour: [40, 133, 0, 55, 46, 27],
    jitterCounts: [5, 89, 20, 15, 1, 42],
    stack: ['MPU-9150 9-axis IMU', 'RFduino microcontroller', 'Bluetooth Low Energy', 'Python receiver with Bleak'],
  },
  modelImpact: {
    alignedAccuracy: 0.84,
    misalignedSensorAccuracy: {
      0: 0.84,
      3: 0.81,
      6: 0.78,
      9: 0.77,
    },
    sixSensorLater: {
      full: 0.78,
      secondHalf: 0.74,
      lastQuarter: 0.72,
    },
    relativeLastQuarterDrop: 14.3,
  },
  reducedSensors: {
    note: 'The 6-sensor and 3-sensor results are representative tested configurations, not universal results for every possible sensor placement.',
    full: {
      label: '9 sensors',
      aligned: 0.84,
      misaligned: 0.74,
      dropPercent: 12.0,
    },
    sixRepresentative: {
      label: '6 sensors',
      aligned: 0.83,
      misaligned: 0.67,
      dropPercent: 19.3,
    },
    threeRepresentative: {
      label: '3 sensors',
      aligned: 0.75,
      misaligned: 0.52,
      dropPercent: 30.7,
    },
  },
  transitions: {
    nonTransitionAligned: 0.95,
    nonTransitionMisaligned: 0.81,
    backTransitionAligned: 0.70,
    backTransitionMisaligned: 0.63,
  },
  augmentation: {
    six: {
      normal: 0.74,
      augmented: 0.82,
    },
    nine: {
      normal: 0.75,
      augmented: 0.82,
    },
    doubleDrift: {
      normal: 0.63,
      augmented: 0.68,
    },
  },
}

export const harExperiments = [
  {
    id: 'hardware-drift',
    number: '01',
    label: 'Hardware Drift',
    eyebrow: 'Timing drift',
    title: 'The sensors did not stay perfectly aligned.',
    observation: 'At 40 Hz, I expected a clean 25 ms rhythm. Real Bluetooth packets had their own opinions.',
  },
  {
    id: 'model-impact',
    number: '02',
    label: 'Model Impact',
    eyebrow: 'Accuracy under offset',
    title: 'A few seconds of drift gradually damaged the model.',
    observation: 'The model held up at first, then accuracy slipped as one sensor was shifted further from the others.',
  },
  {
    id: 'fewer-sensors',
    number: '03',
    label: 'Fewer Sensors',
    eyebrow: 'Sensor reduction',
    title: 'Using fewer sensors made misalignment harder to absorb.',
    observation: 'Representative 6-sensor and 3-sensor setups dropped more sharply than the full 9-sensor setup.',
  },
  {
    id: 'transitions',
    number: '04',
    label: 'Transitions',
    eyebrow: 'Changing activity',
    title: 'Transitions were a different kind of stress test.',
    observation: 'Stable activity windows were easier. Transition-heavy windows gave the model less clean signal to hold onto.',
  },
  {
    id: 'robustness',
    number: '05',
    label: 'Robustness',
    eyebrow: 'Augmentation',
    title: 'Training with drift helped the model recover.',
    observation: 'Synthetic misalignment during training improved robustness, especially for 6 and 9 sensor setups.',
  },
  {
    id: 'results',
    number: '06',
    label: 'Results',
    eyebrow: 'Takeaway',
    title: 'Robust wearable ML starts before the model.',
    observation: 'Sensor timing, packet jitter and deployment constraints shaped the model outcome as much as architecture choice.',
  },
]
