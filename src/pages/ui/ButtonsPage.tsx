import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  PageHeader,
  Panel,
} from '@/components/ui'

export default function ButtonsPage() {
  return (
    <>
      <PageHeader
        title="Buttons"
        subtitle="header small text goes here..."
        breadcrumb={[
          { label: 'Home', path: '/' },
          { label: 'UI Elements' },
          { label: 'Buttons', active: true },
        ]}
      />

      <div className="-mx-2.5 flex flex-wrap">
        <div className="w-full px-2.5 lg:w-2/3">
          <Panel title="Buttons">
            <div className="flex flex-wrap gap-2">
              <Button variant="default">Default</Button>
              <Button variant="primary">Primary</Button>
              <Button variant="info">Info</Button>
              <Button variant="success">Success</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="warning">Warning</Button>
              <Button variant="inverse">Inverse</Button>
              <Button variant="white">White</Button>
              <Button variant="link">Link</Button>
            </div>
          </Panel>
        </div>

        <div className="w-full px-2.5 lg:w-1/3">
          <Panel title="Button Dropdowns">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="white">
                  Action <span className="ml-1">▾</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Action 1</DropdownMenuItem>
                <DropdownMenuItem>Action 2</DropdownMenuItem>
                <DropdownMenuItem>Action 3</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Action 4</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Panel>
        </div>

        <div className="w-full px-2.5 lg:w-1/3">
          <Panel title="Button Sizes">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" size="lg">Large Button</Button>
                <Button variant="white" size="lg">Large Button</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary">Default Button</Button>
                <Button variant="white">Default Button</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" size="sm">Small Button</Button>
                <Button variant="white" size="sm">Small Button</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" size="xs">Extra Small</Button>
                <Button variant="white" size="xs">Extra Small</Button>
              </div>
            </div>
          </Panel>
        </div>

        <div className="w-full px-2.5 lg:w-1/3">
          <Panel title="Button State">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button variant="danger" disabled>Disabled Button</Button>
                <Button variant="white" disabled>Disabled Button</Button>
              </div>
              <Button variant="danger" className="w-full">Block Button</Button>
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}
