import { useState } from 'react'

const stack = [
  'Python',
  'PyTorch',
  'ConvLSTM',
  'ConvBoost',
  'NumPy',
  'Pandas',
  'C++',
  'Arduino',
  'RFduino',
  'MPU-9150',
  'Bluetooth LE',
  'Bleak',
  'asyncio',
  'REALDISP',
]

export default function HarResults() {
  const [isHardwareNoteOpen, setIsHardwareNoteOpen] = useState(false)

  return (
    <div className="har-results-panel">
      <div className="har-results-hero">
        <p className="har-section-label">06 / RESULTS</p>
        <h2>Tiny timing errors don't stay tiny.</h2>
      </div>

      <div className="har-results-grid" aria-label="Main HAR project results">
        <section className="har-result-block result-offset">
          <div className="result-mini-lines" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <strong>133 ms</strong>
          <p>maximum measured relative sensor offset after the one-hour prototype experiment</p>
        </section>

        <section className="har-result-block result-reduction">
          <div className="result-mini-slope" aria-hidden="true">
            <i />
          </div>
          <strong>14.3%</strong>
          <p>relative accuracy reduction in the later six-sensor drift scenario</p>
          <small>84% aligned baseline → ~72% last-quarter accuracy</small>
        </section>

        <section className="har-result-block result-augmentation">
          <div className="result-mini-bars" aria-hidden="true">
            <i />
            <i />
          </div>
          <strong>74 → 82%</strong>
          <p>accuracy with augmentation under six-sensor misalignment</p>
          <small>+8 percentage points</small>
        </section>
      </div>

      <div className="har-results-conclusion">
        <div className="har-results-conclusion-lead">
          <p>Multi-sensor ML depends on more than having a good model.</p>
          <p>It also depends on every data source agreeing about when reality happened.</p>
        </div>
        <div className="har-results-conclusion-body">
          <p>
            My experiments showed that small timing imperfections accumulate, smaller sensor configurations can become more vulnerable, and training
            with realistic distortions can recover a meaningful amount of lost robustness.
          </p>
          <p>
            That was the part of the project I found most interesting: the ML problem wasn't only inside the model. It started all the way back at the
            hardware producing its data.
          </p>
        </div>
      </div>

      <div className="har-results-footer">
        <section className="har-built-with" aria-labelledby="har-built-with-title">
          <h3 id="har-built-with-title">BUILT WITH</h3>
          <div>
            {stack.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </section>
      </div>

      <section className="hardware-easter-egg">
        <button type="button" aria-expanded={isHardwareNoteOpen} onClick={() => setIsHardwareNoteOpen(!isHardwareNoteOpen)}>
          ONE MORE HARDWARE PROBLEM →
        </button>

        <div className={`hardware-footnote-copy ${isHardwareNoteOpen ? 'is-open' : ''}`}>
          <div className="hardware-byte-table">
            <p>
              <span>9-axis sensor packet</span>
              <strong>40 bytes</strong>
            </p>
            <p>
              <span>RFduino BLE MTU</span>
              <strong>20 bytes</strong>
            </p>
          </div>
          <h3>...nice.</h3>
          <p>
            The old RFduino platform could only send a 20-byte BLE payload, while a full packet of nine 4-byte floats plus a timestamp would require
            40 bytes.
          </p>
          <p>
            I changed the firmware to transmit raw 2-byte sensor integers instead and perform scaling on the receiver side. For the experiments that
            needed timestamps separately, I used a second firmware mode dedicated to timestamp transmission.
          </p>
        </div>
      </section>
    </div>
  )
}
