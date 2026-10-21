export const experienceSubtitle = 'From professional kitchens to client projects and collaborative software development. Different environments, but the same drive to solve problems, take responsibility, and deliver.'

export const ownershipMessage = "I don't just enjoy building software. I enjoy taking ownership, solving real problems, and working with people to turn ideas into working products."

export type ExperienceEntry = {
  id: string
  title: string
  role: string
  project?: string
  category: string
  duration?: string
  overview: string
  responsibilities: string[]
  strengths: string[]
  reflection: string
  insight: string
  learning?: string
  explore?: string
}

export const experienceEntries: ExperienceEntry[] = [
  {
    id: 'client',
    title: 'Built for a Real Business',
    role: 'Full-Stack Developer',
    project: 'Kumo Mochi — Commercial Website',
    category: 'Client Work',
    overview: 'Developed and delivered a commercial website for a real business, translating client requirements into a working product. Took responsibility for the development process, from understanding business needs to implementing the website and providing a way for the client to manage their own content.',
    responsibilities: [
      'Translating business requirements into functional features.',
      'Communicating with the client and understanding their needs.',
      'Managing development independently and making technical decisions.',
      'Delivering a working product intended for real customers.',
      'Taking ownership of the project beyond simply writing code.',
    ],
    strengths: ['Client Communication', 'Independent Delivery', 'Problem-Solving', 'Product Ownership'],
    reflection: '',
    insight: "The interesting part wasn't just building the website. It was creating something another person could actually use and manage.",
  },
  {
    id: 'team',
    title: 'Built with a Team',
    role: 'Lead Developer & Team Lead',
    project: 'Hi5 — Professional Networking Platform',
    category: 'Team Project / TechNative Digital Bootcamp',
    overview: 'Led a four-person development team building Hi5, a professional matchmaking platform. Took responsibility for core development work, project planning, distributing tasks, and coordinating individual contributions into a functional MVP.',
    responsibilities: [
      'Leading a team of four developers through the development process.',
      'Planning project milestones and distributing responsibilities.',
      'Taking ownership of core technical development.',
      'Coordinating contributions and collaborating through Git.',
      'Making decisions about feature priorities and project scope.',
      'Helping transform an initial product concept into a working MVP.',
    ],
    strengths: ['Technical Leadership', 'Team Collaboration', 'Project Planning', 'Communication', 'Product Delivery'],
    reflection: 'This experience provided practical insight into collaborative software development, balancing technical responsibilities with team coordination and working towards a shared product goal.',
    insight: "Writing code is one challenge. Making everyone's code work together is another.",
  },
  {
    id: 'chef',
    title: 'Built Under Pressure',
    role: 'Professional Chef',
    category: 'Previous Professional Career',
    duration: 'Nearly a decade',
    overview: 'Before transitioning into software development, I spent nearly a decade working in professional kitchens. Alongside developing practical expertise, I gained experience coordinating teams, handling competing priorities, and maintaining quality in fast-paced environments.',
    responsibilities: [
      'Coordinating work and supporting team members during busy services.',
      'Managing competing priorities under time pressure.',
      'Maintaining consistent standards and attention to detail.',
      'Adapting quickly to unfamiliar teams, environments, and challenges.',
      'Communicating clearly and solving problems as they emerged.',
    ],
    strengths: ['Leadership', 'Adaptability', 'Time Management', 'Teamwork', 'Problem-Solving', 'Working Under Pressure'],
    reflection: 'While the industry was completely different, many of the professional skills translated naturally into software development, particularly communication, problem-solving, adaptability, and taking responsibility for outcomes.',
    insight: 'Different tools, surprisingly transferable lessons.',
  },
  {
    id: 'independent',
    title: "And Everything I've Built Along the Way…",
    role: 'Independent Development',
    category: 'Learning & Exploration',
    overview: "Beyond client work and collaborative projects, I've spent considerable time learning, experimenting, and building software independently.",
    learning: 'These projects have allowed me to explore different areas of computer science, develop practical technical skills, and take ideas from initial concepts through to working implementations.',
    explore: 'Rather than repeating the technical details here, visitors can explore my dedicated Projects and Skills sections.',
    responsibilities: [],
    strengths: [],
    reflection: '',
    insight: ownershipMessage,
  },
]
