export const USER_ROLES = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "gerant", label: "Gérant(e)" },
  { value: "comptable", label: "Comptable" },
  { value: "manager", label: "Manager" },
  { value: "caissiere", label: "Caissière" },
  { value: "livreur", label: "Livreur" },
  { value: "team_member", label: "Team Member" },
] as const

export type UserRole = typeof USER_ROLES[number]["value"]

