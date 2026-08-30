import HarHero from './HarHero'
import SensorDriftExplanation from './SensorDriftExplanation'
import HarSystemOverview from './HarSystemOverview'
import HarExperimentLab from './HarExperimentLab'
import './HarCaseStudy.css'

export default function HarCaseStudy() {
  return (
    <article className="har-case-study">
      <HarHero />
      <SensorDriftExplanation />
      <HarSystemOverview />
      <HarExperimentLab />
    </article>
  )
}
