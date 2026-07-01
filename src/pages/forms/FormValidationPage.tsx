import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Button,
  Checkbox,
  FormField,
  Input,
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

const basicSchema = z.object({
  fullname: z.string().min(1, 'Full name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  message: z
    .string()
    .min(20, 'Minimum 20 characters')
    .max(200, 'Maximum 200 characters')
    .optional()
    .or(z.literal('')),
  digits: z.string().regex(/^\d+$/, 'Digits only').optional().or(z.literal('')),
  number: z.string().regex(/^-?\d+(\.\d+)?$/, 'Must be a number').optional().or(z.literal('')),
  phone: z.string().optional(),
})

type BasicForm = z.infer<typeof basicSchema>

const extraSchema = z.object({
  alphanum: z
    .string()
    .min(1, 'Required')
    .regex(/^[a-zA-Z0-9]+$/, 'Alphanumeric only'),
  dateIso: z
    .string()
    .min(1, 'Required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  selectBox: z.string().min(1, 'Please choose an option'),
  radiorequired: z.string().min(1, 'Please select a radio option'),
  mincheck: z.array(z.string()).min(2, 'Check at least 2 checkboxes'),
  regexp: z
    .string()
    .min(1, 'Required')
    .regex(/^#[A-Fa-f0-9]{6}$/, 'Hex color code e.g. #FF5500'),
})

type ExtraForm = z.infer<typeof extraSchema>

function BasicValidationForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BasicForm>({
    resolver: zodResolver(basicSchema),
    defaultValues: {
      fullname: '',
      email: '',
      website: '',
      message: '',
      digits: '',
      number: '',
      phone: '',
    },
  })

  return (
    <form
      onSubmit={handleSubmit((data) => alert(JSON.stringify(data, null, 2)))}
      className="border border-ca-border"
    >
      <FormField label="Full Name" htmlFor="fullname" error={errors.fullname?.message} required>
        <Input id="fullname" placeholder="Required" {...register('fullname')} />
      </FormField>
      <FormField label="Email" htmlFor="email" error={errors.email?.message} required>
        <Input id="email" placeholder="Email" {...register('email')} />
      </FormField>
      <FormField label="Website" htmlFor="website" error={errors.website?.message}>
        <Input id="website" placeholder="https://example.com" {...register('website')} />
      </FormField>
      <FormField
        label="Message (20 chars min, 200 max)"
        htmlFor="message"
        error={errors.message?.message}
      >
        <Textarea id="message" rows={4} placeholder="Range from 20 - 200" {...register('message')} />
      </FormField>
      <FormField label="Digits" htmlFor="digits" error={errors.digits?.message}>
        <Input id="digits" placeholder="Digits" {...register('digits')} />
      </FormField>
      <FormField label="Number" htmlFor="number" error={errors.number?.message}>
        <Input id="number" placeholder="Number" {...register('number')} />
      </FormField>
      <FormField label="Phone" htmlFor="phone" error={errors.phone?.message}>
        <Input id="phone" placeholder="(XXX) XXXX XXX" {...register('phone')} />
      </FormField>
      <div className="flex border-t border-ca-border px-4 py-4">
        <div className="w-1/3" />
        <Button type="submit" variant="primary">
          Submit
        </Button>
      </div>
    </form>
  )
}

function ExtraValidationForm() {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ExtraForm>({
    resolver: zodResolver(extraSchema),
    defaultValues: {
      alphanum: '',
      dateIso: '',
      selectBox: '',
      radiorequired: '',
      mincheck: [],
      regexp: '',
    },
  })

  return (
    <form
      onSubmit={handleSubmit((data) => alert(JSON.stringify(data, null, 2)))}
      className="border border-ca-border"
    >
      <FormField label="AlphaNum" error={errors.alphanum?.message} required>
        <Input placeholder="Alphanumeric String." {...register('alphanum')} />
      </FormField>
      <FormField label="Date ISO" error={errors.dateIso?.message} required>
        <Input placeholder="YYYY-MM-DD" {...register('dateIso')} />
      </FormField>
      <FormField label="Required Select Box" error={errors.selectBox?.message} required>
        <Controller
          name="selectBox"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Please choose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="foo">Foo</SelectItem>
                <SelectItem value="bar">Bar</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </FormField>
      <FormField label="Required Radio Button" error={errors.radiorequired?.message} required>
        <Controller
          name="radiorequired"
          control={control}
          render={({ field }) => (
            <RadioGroup
              name="radiorequired"
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: 'foo', label: 'Radio Button 1' },
                { value: 'bar', label: 'Radio Button 2' },
              ]}
            />
          )}
        />
      </FormField>
      <FormField label="Check at least 2 checkboxes" error={errors.mincheck?.message} required>
        <Controller
          name="mincheck"
          control={control}
          render={({ field }) => (
            <div>
              {['foo', 'bar', 'baz'].map((val) => (
                <Checkbox
                  key={val}
                  label={`Checkbox ${val}`}
                  checked={field.value.includes(val)}
                  onCheckedChange={(checked) => {
                    field.onChange(
                      checked
                        ? [...field.value, val]
                        : field.value.filter((v) => v !== val),
                    )
                  }}
                />
              ))}
            </div>
          )}
        />
      </FormField>
      <FormField label="Regular Expression" error={errors.regexp?.message} required>
        <Input placeholder="#AFAFAF" {...register('regexp')} />
      </FormField>
      <div className="flex border-t border-ca-border px-4 py-4">
        <div className="w-1/3" />
        <Button type="submit" variant="danger">
          Validate
        </Button>
      </div>
    </form>
  )
}

export default function FormValidationPage() {
  return (
    <>
      <PageHeader
        title="Form Validation"
        subtitle="header small text goes here..."
        breadcrumb={[
          { label: 'Home', path: '/' },
          { label: 'Form Stuff' },
          { label: 'Form Validation', active: true },
        ]}
      />

      <div className="-mx-2.5 flex flex-wrap">
        <div className="w-full px-2.5 lg:w-1/2">
          <Panel title="Basic Form Validation" bodyClassName="p-0">
            <BasicValidationForm />
          </Panel>
        </div>
        <div className="w-full px-2.5 lg:w-1/2">
          <Panel title="Extra Validation Field" bodyClassName="p-0">
            <ExtraValidationForm />
          </Panel>
        </div>
      </div>
    </>
  )
}
