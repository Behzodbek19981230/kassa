import {
  Alert,
  Badge,
  Label,
  Note,
  PageHeader,
  Panel,
  Progress,
  WidgetStats,
} from '../../components/ui'
import { FaDesktop } from 'react-icons/fa'

export default function GeneralPage() {
  return (
    <>
      <PageHeader
        title="General"
        subtitle="header small text goes here..."
        breadcrumb={[
          { label: 'Home', path: '/' },
          { label: 'UI Elements' },
          { label: 'General', active: true },
        ]}
      />

      <div className="-mx-2.5 flex flex-wrap">
        <div className="w-full px-2.5 lg:w-1/2">
          <Panel title="Alerts">
            <Alert variant="success" dismissible className="mb-3">
              <strong>Success!</strong> Vivamus vestibulum posuere est eu tincidunt.
            </Alert>
            <Alert variant="info" dismissible className="mb-3">
              <strong>Info!</strong> Morbi sed nibh ac tortor laoreet blandit sed eu ligula.
            </Alert>
            <Alert variant="warning" dismissible className="mb-3">
              <strong>Warning!</strong> Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </Alert>
            <Alert variant="danger" dismissible>
              <strong>Error!</strong> Morbi vitae arcu in neque luctus elementum.
            </Alert>
          </Panel>

          <Panel title="Notes">
            <Note variant="success" className="mb-3">
              <h4 className="mb-1 text-sm font-semibold">Note Title</h4>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </Note>
            <Note variant="info" className="mb-3">
              <h4 className="mb-1 text-sm font-semibold">Note Title</h4>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </Note>
            <Note variant="warning" className="mb-3">
              <h4 className="mb-1 text-sm font-semibold">Note Title</h4>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </Note>
            <Note variant="danger">
              <h4 className="mb-1 text-sm font-semibold">Note Title</h4>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </Note>
          </Panel>
        </div>

        <div className="w-full px-2.5 lg:w-1/2">
          <Panel title="Labels & Badges">
            <div className="mb-4 flex flex-wrap gap-2">
              <Label variant="default">Default</Label>
              <Label variant="primary">Primary</Label>
              <Label variant="success">Success</Label>
              <Label variant="info">Info</Label>
              <Label variant="warning">Warning</Label>
              <Label variant="danger">Danger</Label>
              <Label variant="inverse">Inverse</Label>
              <Label variant="theme">Theme</Label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Badge</Badge>
              <Badge variant="primary">5</Badge>
              <Badge variant="success">New</Badge>
              <Badge variant="danger">10</Badge>
            </div>
          </Panel>

          <Panel title="Progress Bars">
            <div className="space-y-4">
              <Progress value={20} />
              <Progress value={40} variant="success" />
              <Progress value={60} variant="info" />
              <Progress value={80} variant="warning" />
              <Progress value={100} variant="danger" />
            </div>
          </Panel>

          <WidgetStats
            color="green"
            icon={<FaDesktop />}
            title="WIDGET STATS"
            value="1,234,567"
          />
        </div>
      </div>
    </>
  )
}
