export interface User {
  id: number
  username: string
  first_name: string
  last_name: string
  second_name: string | null
  gender: string | null
  date_of_birthday: string | null
  phone_number: string
  email: string
  is_active: boolean
  date_joined: string
  role: unknown | null
  roles: unknown | null
  region: unknown | null
  region_detail: unknown | null
  district: unknown | null
  district_detail: unknown | null
  companies: unknown[]
  companies_detail: unknown[]
  address: unknown | null
  avatar: string | null
}
