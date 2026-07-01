import type { SidebarMenuItem } from '../types'

export const sidebarMenu: SidebarMenuItem[] = [
  { id: 'navigation', type: 'header', label: 'Navigation' },
  {
    id: 'dashboard',
    icon: 'laptop',
    label: 'Dashboard',
    children: [
      { id: 'dashboard-v1', label: 'Dashboard v1', path: '/' },
      { id: 'dashboard-v2', label: 'Dashboard v2', path: '#' },
    ],
  },
  {
    id: 'email',
    icon: 'inbox',
    label: 'Email',
    badge: '10',
    children: [
      { id: 'inbox-v1', label: 'Inbox v1', path: '#' },
      { id: 'inbox-v2', label: 'Inbox v2', path: '#' },
      { id: 'compose', label: 'Compose', path: '#' },
      { id: 'detail', label: 'Detail', path: '#' },
    ],
  },
  {
    id: 'ui',
    icon: 'suitcase',
    label: 'UI Elements',
    tag: 'NEW',
    children: [
      { id: 'ui-general', label: 'General', path: '/ui/general' },
      { id: 'ui-buttons', label: 'Buttons', path: '/ui/buttons' },
      { id: 'ui-tabs', label: 'Tabs & Accordions', path: '/ui/tabs-accordions' },
      { id: 'ui-modal', label: 'Modal & Notification', path: '/ui/modal-notification' },
    ],
  },
  {
    id: 'forms',
    icon: 'file',
    label: 'Form Stuff',
    tag: 'NEW',
    children: [
      { id: 'form-elements', label: 'Form Elements', path: '/forms/elements' },
      { id: 'form-validation', label: 'Form Validation', path: '/forms/validation' },
      { id: 'form-dropzone', label: 'Dropzone', path: '/forms/dropzone' },
    ],
  },
  {
    id: 'tables',
    icon: 'th',
    label: 'Tables',
    children: [
      { id: 'table-basic', label: 'Basic Tables', path: '/tables/basic' },
      {
        id: 'managed',
        label: 'Managed Tables',
        children: [
          { id: 'table-default', label: 'Default', path: '/tables' },
          { id: 'table-buttons', label: 'Buttons', path: '/tables/buttons' },
          { id: 'table-advanced', label: 'Advanced', path: '/tables/advanced' },
        ],
      },
    ],
  },
  { id: 'calendar', icon: 'calendar', label: 'Calendar', path: '#' },
  {
    id: 'chart',
    icon: 'area-chart',
    label: 'Chart',
    children: [
      { id: 'flot', label: 'Flot Chart', path: '#' },
      { id: 'morris', label: 'Morris Chart', path: '#' },
      { id: 'chartjs', label: 'Chart JS', path: '#' },
    ],
  },
  {
    id: 'extra',
    icon: 'gift',
    label: 'Extra',
    children: [
      { id: 'timeline', label: 'Timeline', path: '#' },
      { id: 'profile', label: 'Profile Page', path: '#' },
    ],
  },
]
