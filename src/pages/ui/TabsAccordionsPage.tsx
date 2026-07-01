import {
  Accordion,
  MediaList,
  PageHeader,
  Panel,
  Tabs,
  TodoList,
} from '../../components/ui'

const mediaPosts = [
  {
    image: '/assets/img/gallery/gallery-1.jpg',
    title: 'Lorem ipsum dolor sit amet.',
    description: 'Consectetur adipiscing elit. Nullam at risus metus.',
  },
  {
    image: '/assets/img/gallery/gallery-7.jpg',
    title: 'Vestibulum vitae diam nec odio.',
    description: 'Dapibus placerat. Ut laoreet nunc accumsan orci.',
  },
]

export default function TabsAccordionsPage() {
  return (
    <>
      <PageHeader
        title="Tabs & Accordions"
        subtitle="header small text goes here..."
        breadcrumb={[
          { label: 'Home', path: '/' },
          { label: 'UI Elements' },
          { label: 'Tabs & Accordions', active: true },
        ]}
      />

      <div className="-mx-2.5 flex flex-wrap">
        <div className="w-full px-2.5 lg:w-1/2">
          <Panel title="Default Tabs">
            <Tabs
              defaultValue="tab1"
              items={[
                {
                  value: 'tab1',
                  label: 'Home',
                  content: (
                    <p className="m-0 text-xs text-ca-text">
                      Raw denim you probably haven&apos;t heard of them jean shorts Austin.
                    </p>
                  ),
                },
                {
                  value: 'tab2',
                  label: 'Profile',
                  content: <MediaList items={mediaPosts} />,
                },
                {
                  value: 'tab3',
                  label: 'Messages',
                  content: (
                    <p className="m-0 text-xs text-ca-text">No messages available.</p>
                  ),
                },
              ]}
            />
          </Panel>
        </div>

        <div className="w-full px-2.5 lg:w-1/2">
          <Panel title="Accordion">
            <Accordion
              defaultValue="item-1"
              items={[
                {
                  value: 'item-1',
                  title: 'Collapsible Group Item #1',
                  content:
                    'Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry richardson ad squid.',
                },
                {
                  value: 'item-2',
                  title: 'Collapsible Group Item #2',
                  content:
                    'Raw denim you probably haven\'t heard of them jean shorts Austin. Nesciunt tofu stumptown aliqua.',
                },
                {
                  value: 'item-3',
                  title: 'Collapsible Group Item #3',
                  content:
                    '3 wolf moon officia aute, non cupidatat skateboard dolor brunch. Food truck quinoa nesciunt laborum eiusmod.',
                },
              ]}
            />
          </Panel>

          <Panel title="Todo List" bodyClassName="p-0">
            <TodoList
              items={[
                { title: 'Donec vehicula pretium nisl.', completed: true },
                { title: 'Duis a ullamcorper massa.' },
                { title: 'Phasellus bibendum odio nec vestibulum.' },
              ]}
            />
          </Panel>
        </div>
      </div>
    </>
  )
}
