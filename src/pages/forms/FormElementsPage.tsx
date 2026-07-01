import { FaCalendar } from 'react-icons/fa'
import {
  Button,
  Checkbox,
  FormControl,
  FormGroup,
  FormLabel,
  Input,
  InputGroup,
  PageHeader,
  Panel,
  RadioGroup,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@/components/ui'

export default function FormElementsPage() {
  return (
    <>
      <PageHeader
        title="Form Elements"
        subtitle="header small text goes here..."
        breadcrumb={[
          { label: 'Home', path: '/' },
          { label: 'Form Stuff' },
          { label: 'Form Elements', active: true },
        ]}
      />

      <div className="-mx-2.5 flex flex-wrap">
        <div className="w-full px-2.5 lg:w-1/2">
          <Panel title="Input Types">
            <form onSubmit={(e) => e.preventDefault()}>
              <FormGroup>
                <FormLabel>Default Input</FormLabel>
                <FormControl>
                  <Input placeholder="Default input" />
                </FormControl>
              </FormGroup>
              <FormGroup>
                <FormLabel>Disabled Input</FormLabel>
                <FormControl>
                  <Input placeholder="Disabled input" disabled />
                </FormControl>
              </FormGroup>
              <FormGroup>
                <FormLabel>Select</FormLabel>
                <FormControl>
                  <Select defaultValue="1">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormGroup>
              <FormGroup>
                <FormLabel>Textarea</FormLabel>
                <FormControl>
                  <Textarea placeholder="Textarea" rows={5} />
                </FormControl>
              </FormGroup>
              <FormGroup>
                <FormLabel>Checkbox</FormLabel>
                <FormControl>
                  <Checkbox label="Checkbox Label 1" />
                  <Checkbox label="Checkbox Label 2" />
                </FormControl>
              </FormGroup>
              <FormGroup>
                <FormLabel>Inline Checkbox</FormLabel>
                <FormControl>
                  <div className="flex flex-wrap gap-4">
                    <Checkbox label="Checkbox Label 1" inline />
                    <Checkbox label="Checkbox Label 2" inline />
                  </div>
                </FormControl>
              </FormGroup>
              <FormGroup>
                <FormLabel>Radio Button</FormLabel>
                <FormControl>
                  <RadioGroup
                    name="radio1"
                    defaultValue="option1"
                    options={[
                      { value: 'option1', label: 'Radio option 1' },
                      { value: 'option2', label: 'Radio option 2' },
                    ]}
                  />
                </FormControl>
              </FormGroup>
              <FormGroup>
                <FormLabel>Submit</FormLabel>
                <FormControl>
                  <Button type="submit" variant="success" size="sm">
                    Submit Button
                  </Button>
                </FormControl>
              </FormGroup>
            </form>
          </Panel>
        </div>

        <div className="w-full px-2.5 lg:w-1/2">
          <Panel title="Input Sizes, Input Group">
            <h4 className="mt-0 mb-3 text-sm font-semibold text-ca-heading">Input Sizing</h4>
            <Input className="mb-3 h-[46px] text-sm" placeholder=".input-lg" />
            <Input className="mb-3" placeholder="Default input" />
            <Input className="mb-3 h-[30px]" placeholder=".input-sm" />

            <h4 className="mb-3 text-sm font-semibold text-ca-heading">Input Group</h4>
            <InputGroup prepend="@" className="mb-3">
              <Input placeholder="Username" className="rounded-none border-x-0" />
            </InputGroup>
            <InputGroup append={<FaCalendar />} className="mb-3">
              <Input className="rounded-none border-x-0" />
            </InputGroup>
            <InputGroup prepend="$" append=".00" className="mb-3">
              <Input className="rounded-none border-x-0" />
            </InputGroup>
          </Panel>
        </div>
      </div>
    </>
  )
}
