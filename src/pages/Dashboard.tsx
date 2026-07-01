import { FaClock, FaDesktop, FaUnlink, FaUsers } from 'react-icons/fa'
import {
  AnalyticsTable,
  BarChart,
  MediaList,
  PageHeader,
  Panel,
  Tabs,
  TodoList,
  WidgetStats,
} from '@/components/ui'

const analyticsRows = [
  { label: 'Unique Visitor', labelVariant: 'danger' as const, value: '13,203', trend: 'up' as const },
  { label: 'Bounce Rate', labelVariant: 'warning' as const, value: '28.2%', trend: null },
  { label: 'Total Page Views', labelVariant: 'success' as const, value: '1,230,030', trend: null },
  { label: 'Avg Time On Site', labelVariant: 'primary' as const, value: '00:03:45', trend: null },
  { label: '% New Visits', labelVariant: 'default' as const, value: '40.5%', trend: null },
  { label: 'Return Visitors', labelVariant: 'inverse' as const, value: '73.4%', trend: null },
]

const chartData = [
  { label: 'Mon', value: 65 },
  { label: 'Tue', value: 45 },
  { label: 'Wed', value: 78 },
  { label: 'Thu', value: 52 },
  { label: 'Fri', value: 88 },
  { label: 'Sat', value: 60 },
  { label: 'Sun', value: 95 },
]

const mediaPosts = [
  {
    image: '/assets/img/gallery/gallery-1.jpg',
    title: 'Aenean viverra arcu nec pellentesque ultrices.',
    description:
      'Nullam at risus metus. Quisque nisl purus, pulvinar ut mauris vel, elementum suscipit eros. Praesent ornare ante massa, egestas pellentesque orci convallis ut.',
  },
  {
    image: '/assets/img/gallery/gallery-10.jpg',
    title: 'Vestibulum vitae diam nec odio dapibus placerat.',
    description:
      'Fusce bibendum augue nec fermentum tempus. Sed laoreet dictum tempus. Aenean ac sem quis nulla malesuada volutpat.',
  },
  {
    image: '/assets/img/gallery/gallery-7.jpg',
    title: 'Maecenas eget turpis luctus, scelerisque arcu id.',
    description:
      'Morbi placerat est nec pharetra placerat. Ut laoreet nunc accumsan orci aliquam accumsan.',
  },
]

const todoItems = [
  { title: 'Donec vehicula pretium nisl, id lacinia nisl tincidunt id.', completed: true },
  { title: 'Duis a ullamcorper massa.' },
  { title: 'Phasellus bibendum, odio nec vestibulum ullamcorper.' },
  { title: 'Duis pharetra mi sit amet dictum congue.' },
]

export default function Dashboard() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="header small text goes here..."
        breadcrumb={[
          { label: 'Home', path: '/' },
          { label: 'Dashboard', active: true },
        ]}
      />

      <div className="-mx-2.5 flex flex-wrap">
        <div className="w-full px-2.5 sm:w-1/2 lg:w-1/4">
          <WidgetStats color="green" icon={<FaDesktop />} title="TOTAL VISITORS" value="3,291,922" />
        </div>
        <div className="w-full px-2.5 sm:w-1/2 lg:w-1/4">
          <WidgetStats color="blue" icon={<FaUnlink />} title="BOUNCE RATE" value="20.44%" />
        </div>
        <div className="w-full px-2.5 sm:w-1/2 lg:w-1/4">
          <WidgetStats color="purple" icon={<FaUsers />} title="UNIQUE VISITORS" value="1,291,922" />
        </div>
        <div className="w-full px-2.5 sm:w-1/2 lg:w-1/4">
          <WidgetStats color="red" icon={<FaClock />} title="AVG TIME ON SITE" value="00:12:23" />
        </div>
      </div>

      <div className="-mx-2.5 flex flex-wrap">
        <div className="w-full px-2.5 lg:w-2/3">
          <Panel title="Website Analytics (Last 7 Days)">
            <BarChart data={chartData} />
          </Panel>

          <Tabs
            defaultValue="latest"
            items={[
              { value: 'latest', label: 'Latest Post', content: <MediaList items={mediaPosts} /> },
              {
                value: 'purchase',
                label: 'Purchase',
                content: <p className="m-0 text-xs text-ca-text">No purchase data available.</p>,
              },
              {
                value: 'email',
                label: 'Email',
                content: <p className="m-0 text-xs text-ca-text">No email data available.</p>,
              },
            ]}
          />
        </div>

        <div className="w-full px-2.5 lg:w-1/3">
          <Panel title="Analytics Details" bodyClassName="pt-0">
            <AnalyticsTable rows={analyticsRows} />
          </Panel>

          <Panel title="Todo List" bodyClassName="p-0">
            <TodoList items={todoItems} />
          </Panel>
        </div>
      </div>
    </>
  )
}
