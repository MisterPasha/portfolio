import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const readData = async filename => JSON.parse(await readFile(new URL(`../src/components/skills/${filename}`, import.meta.url), 'utf8'))
const { domains, skills, proficiencyScale } = await readData('portfolio-skills.json')
const { projects } = await readData('portfolio-projects.json')
const registry = (records, label) => {
  const ids = records.map(record => record.id)
  assert.equal(new Set(ids).size, ids.length, `${label}: duplicate stable IDs`)
  assert(records.every(record => typeof record.id === 'string' && record.id.length > 0), `${label}: missing ID`)
  return new Map(records.map(record => [record.id, record]))
}
const sameIds = (actual, expected, message) => {
  assert.equal(actual.length, new Set(actual).size, `${message}: duplicate association`)
  assert.deepEqual([...actual].sort(), [...expected].sort(), message)
}
const domainMap = registry(domains, 'Domains')
const skillMap = registry(skills, 'Skills')
const projectMap = registry(projects, 'Projects')
assert.equal(domains.length, 6)
assert.equal(skills.length, 59)
assert.equal(projects.length, 12)
for (const domain of domains) {
  assert(domain.skillIds.length >= 8 && domain.skillIds.length <= 10, `${domain.id}: expected 8–10 skills`)
  sameIds(domain.skillIds, skills.filter(skill => skill.domainId === domain.id).map(skill => skill.id), `${domain.id}: domain membership`)
}
for (const skill of skills) {
  assert(domainMap.has(skill.domainId), `${skill.id}: unknown domain`)
  assert(skill.proficiency in proficiencyScale, `${skill.id}: unknown proficiency`)
  assert(skill.description && skill.name, `${skill.id}: missing copy`)
  assert(skill.projectIds.every(id => projectMap.has(id)), `${skill.id}: unknown project`)
  sameIds(skill.projectIds, projects.filter(project => project.skillIds.includes(skill.id)).map(project => project.id), `${skill.id}: reverse project associations`)
}
for (const project of projects) {
  assert(project.skillIds.every(id => skillMap.has(id)), `${project.id}: unknown skill`)
  sameIds(project.skillIds, skills.filter(skill => skill.projectIds.includes(project.id)).map(skill => skill.id), `${project.id}: reverse skill associations`)
  sameIds(project.domainIds, [...new Set(project.skillIds.map(id => skillMap.get(id).domainId))], `${project.id}: domain associations`)
  for (const key of ['githubUrl', 'liveUrl', 'credentialUrl']) {
    const value = project[key]
    assert(value === null || (typeof value === 'string' && new URL(value).protocol === 'https:'), `${project.id}: invalid ${key}`)
  }
}
console.log(`Skill Atlas validated: ${domains.length} domains, ${skills.length} skills, ${projects.length} projects; stable IDs, links and reverse associations agree.`)
