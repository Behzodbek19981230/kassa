import { useState } from 'react'
import {
  AlertBlock,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
  PageHeader,
  Panel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useNotification,
} from '../../components/ui'

const demoText =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed tempus lacus ut lectus rutrum placerat.'

export default function ModalNotificationPage() {
  const { notify, dismissAll, setMaxVisible } = useNotification()
  const [defaultOpen, setDefaultOpen] = useState(false)
  const [noAnimOpen, setNoAnimOpen] = useState(false)
  const [messageOpen, setMessageOpen] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)

  return (
    <>
      <PageHeader
        title="Modal & Notification"
        subtitle="header small text goes here..."
        breadcrumb={[
          { label: 'Home', path: '/' },
          { label: 'UI Elements' },
          { label: 'Modal & Notification', active: true },
        ]}
      />

      <div className="-mx-2.5 flex flex-wrap">
        <div className="w-full px-2.5 lg:w-1/2">
          <Panel title="Gritter Notifications">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">Demo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Add default notification.</TableCell>
                  <TableCell>
                    <Button
                      variant="inverse"
                      size="sm"
                      onClick={() =>
                        notify({
                          title: 'This is a regular notice!',
                          text: `This will fade out after a certain amount of time. ${demoText}`,
                          image: '/assets/img/user-3.jpg',
                        })
                      }
                    >
                      Demo
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Add sticky notification</TableCell>
                  <TableCell>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        notify({
                          title: 'This is a sticky notice!',
                          text: demoText,
                          image: '/assets/img/user-2.jpg',
                          sticky: true,
                        })
                      }
                    >
                      Demo
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Add notification without image</TableCell>
                  <TableCell>
                    <Button
                      variant="info"
                      size="sm"
                      onClick={() =>
                        notify({
                          title: 'This is a notice without an image!',
                          text: 'This will fade out after a certain amount of time.',
                        })
                      }
                    >
                      Demo
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Add a white notification</TableCell>
                  <TableCell>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() =>
                        notify({
                          title: 'This is a light notification',
                          text: 'Add variant: "light" to your notification options.',
                          variant: 'light',
                        })
                      }
                    >
                      Demo
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Add notification (with callbacks)</TableCell>
                  <TableCell>
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() =>
                        notify({
                          title: 'This is a notice with callbacks!',
                          text: 'The callback is...',
                          beforeOpen: () => {
                            window.alert('I am called before it opens')
                          },
                          afterOpen: () => {
                            window.alert('I am called after it opens')
                          },
                          beforeClose: (manual) => {
                            window.alert(
                              manual
                                ? 'I am called before it closes: The "X" was clicked!'
                                : 'I am called before it closes',
                            )
                          },
                          afterClose: (manual) => {
                            window.alert(
                              manual
                                ? 'I am called after it closes. The "X" was clicked!'
                                : 'I am called after it closes.',
                            )
                          },
                        })
                      }
                    >
                      Demo
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Add a sticky notification (with callbacks)</TableCell>
                  <TableCell>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() =>
                        notify({
                          title: 'This is a sticky notice with callbacks!',
                          text: 'Sticky sticky notice.. sticky sticky notice...',
                          sticky: true,
                          beforeOpen: () => {
                            window.alert('I am a sticky called before it opens')
                          },
                          afterOpen: () => {
                            window.alert('I am a sticky called after it opens')
                          },
                        })
                      }
                    >
                      Demo
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Add notification with max of 3</TableCell>
                  <TableCell>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setMaxVisible(3)
                        notify({
                          title: 'This is a notice with a max of 3 on screen at one time!',
                          text: demoText,
                          image: '/assets/img/user-4.jpg',
                        })
                      }}
                    >
                      Demo
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Remove all notifications</TableCell>
                  <TableCell>
                    <Button variant="white" size="sm" onClick={() => dismissAll()}>
                      Demo
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Remove all notifications (with callbacks)</TableCell>
                  <TableCell>
                    <Button
                      variant="white"
                      size="sm"
                      onClick={() =>
                        dismissAll({
                          beforeClose: () =>
                            window.alert('I am called before all notifications are closed.'),
                          afterClose: () =>
                            window.alert('I am called after everything has been closed.'),
                        })
                      }
                    >
                      Demo
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Panel>
        </div>

        <div className="w-full px-2.5 lg:w-1/2">
          <Panel title="Modal">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">Demo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Default Modal Dialog Box.</TableCell>
                  <TableCell>
                    <Button variant="success" size="sm" onClick={() => setDefaultOpen(true)}>
                      Demo
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Modal Dialog Box with fade out animation.</TableCell>
                  <TableCell>
                    <Button variant="default" size="sm" onClick={() => setNoAnimOpen(true)}>
                      Demo
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Modal Dialog Box with full width white background.</TableCell>
                  <TableCell>
                    <Button variant="primary" size="sm" onClick={() => setMessageOpen(true)}>
                      Demo
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Modal Dialog Box with alert message.</TableCell>
                  <TableCell>
                    <Button variant="danger" size="sm" onClick={() => setAlertOpen(true)}>
                      Demo
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div className="mt-4">
              <Modal open={defaultOpen} onOpenChange={setDefaultOpen}>
                <ModalContent>
                  <ModalHeader>
                    <ModalTitle>Modal Dialog</ModalTitle>
                  </ModalHeader>
                  <ModalBody>Modal body content here...</ModalBody>
                  <ModalFooter>
                    <Button variant="white" size="sm" onClick={() => setDefaultOpen(false)}>
                      Close
                    </Button>
                    <Button variant="success" size="sm">
                      Action
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>

              <Modal open={noAnimOpen} onOpenChange={setNoAnimOpen}>
                <ModalContent animated={false}>
                  <ModalHeader>
                    <ModalTitle>Modal Without Animation</ModalTitle>
                  </ModalHeader>
                  <ModalBody>Modal body content here...</ModalBody>
                  <ModalFooter>
                    <Button variant="white" size="sm" onClick={() => setNoAnimOpen(false)}>
                      Close
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>

              <Modal open={messageOpen} onOpenChange={setMessageOpen}>
                <ModalContent variant="message">
                  <ModalHeader className="border-0">
                    <ModalTitle>Modal Message Header</ModalTitle>
                  </ModalHeader>
                  <ModalBody className="px-0">
                    <p>Text in a modal</p>
                    <p>Do you want to turn on location services so GPS can use your location?</p>
                  </ModalBody>
                  <ModalFooter className="border-0">
                    <Button variant="white" size="sm" onClick={() => setMessageOpen(false)}>
                      Close
                    </Button>
                    <Button variant="primary" size="sm">
                      Save Changes
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>

              <Modal open={alertOpen} onOpenChange={setAlertOpen}>
                <ModalContent variant="alert">
                  <ModalHeader>
                    <ModalTitle>Alert Header</ModalTitle>
                  </ModalHeader>
                  <ModalBody>
                    <AlertBlock variant="danger" title="Alert Header">
                      Cras sit amet nibh libero, in gravida nulla. Nulla vel metus scelerisque ante
                      sollicitudin commodo. Cras purus odio, vestibulum in vulputate at, tempus
                      viverra turpis.
                    </AlertBlock>
                  </ModalBody>
                  <ModalFooter>
                    <Button variant="white" size="sm" onClick={() => setAlertOpen(false)}>
                      Close
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setAlertOpen(false)}>
                      Action
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>

              <Modal>
                <ModalTrigger asChild>
                  <Button variant="theme" size="sm" className="mt-3">
                    Trigger via ModalTrigger
                  </Button>
                </ModalTrigger>
                <ModalContent>
                  <ModalHeader>
                    <ModalTitle>Declarative Modal</ModalTitle>
                  </ModalHeader>
                  <ModalBody>
                    This modal uses <code>ModalTrigger</code> component pattern.
                  </ModalBody>
                  <ModalFooter>
                    <ModalTrigger asChild>
                      <Button variant="white" size="sm">
                        Close
                      </Button>
                    </ModalTrigger>
                  </ModalFooter>
                </ModalContent>
              </Modal>
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}
