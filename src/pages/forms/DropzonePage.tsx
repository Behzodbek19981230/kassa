import { Button, Dropzone, PageHeader, Panel } from '@/components/ui'

export default function DropzonePage() {
  return (
    <>
      <PageHeader
        title="Dropzone"
        subtitle="header small text goes here..."
        breadcrumb={[
          { label: 'Home', path: '/' },
          { label: 'Form Stuff' },
          { label: 'Dropzone', active: true },
        ]}
      />

      <div className="-mx-2.5 flex flex-wrap">
        <div className="w-full px-2.5 lg:w-1/6">
          <p className="mb-4 text-xs text-ca-heading">
            <strong>Dropzone</strong> provides drag&apos;n&apos;drop file uploads with image previews.
          </p>
          <div className="mb-2 text-xs font-semibold text-ca-heading">Browser Support</div>
          <p className="mb-4 text-xs text-ca-text">
            Chrome 7+
            <br />
            Firefox 4+
            <br />
            IE 10+
            <br />
            Safari 6+
          </p>
          <Button variant="inverse" size="sm" asChild>
            <a href="https://react-dropzone.js.org/" target="_blank" rel="noreferrer">
              View Official Website
            </a>
          </Button>
        </div>

        <div className="w-full px-2.5 lg:w-5/6">
          <Panel title="Dropzone">
            <Dropzone
              accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.gif'] }}
              maxFiles={5}
            />
          </Panel>
        </div>
      </div>
    </>
  )
}
