export type Ticket = {
  id: string
  title: string
  type: string
  priority: string
  status: string
  jiraKey: string | null
  updatedAt: string
  assignee: { name: string } | null
}
