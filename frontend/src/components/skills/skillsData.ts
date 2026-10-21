import skillsData from './portfolio-skills.json'
import projectsData from './portfolio-projects.json'

export const { domains, skills, proficiencyScale } = skillsData
export const { projects } = projectsData
export type Skill = (typeof skills)[number]
export type Domain = (typeof domains)[number]
export type Project = (typeof projects)[number]
export const skillsById = new Map(skills.map(skill => [skill.id, skill]))
export const projectsById = new Map(projects.map(project => [project.id, project]))
export const domainsById = new Map(domains.map(domain => [domain.id, domain]))

export function linkedProjects(skill: Skill) {
  return skill.projectIds.map(id => projectsById.get(id)!).filter(Boolean)
}

export function matchesSkill(skill: Skill, query: string) {
  return [skill.name, skill.description, ...linkedProjects(skill).map(project => project.name)]
    .join(' ').toLowerCase().includes(query.toLowerCase().trim())
}
