---
description: "Modal component for displaying content in a modal dialog."
---

# Modal component

The [`Modal`](https://kottster.app/api-reference/interfaces/_kottster_react.ModalProps.html) component displays a simple modal with a title and content.

## Basic usage

**Example:**

```jsx [app/pages/myCustomPage/index.jsx]
import { Page, Modal } from '@kottster/react';

export default () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <Page title='About Us'>
      Hello, this is the content of the page.

      {isModalOpen && (
        <Modal
          title='Modal Title'
          onClose={() => setIsModalOpen(false)}
        >
          This is the content of the modal.
        </Modal>
      )}
    </Page>
  );
};
```

## Properties

- ### title

  `string`, optional

  The title displayed at the top of the modal.

- ### subtitle

  `string`, optional

  The subtitle displayed below the title in the modal.

- ### titleWithMargin

  `boolean`, optional

  A boolean indicating whether to add margin below the title section.

- ### isOpen

  `boolean`

  A boolean indicating whether the modal is open or closed.

- ### onClose

  `function`

  A callback function that is called when the modal is requested to be closed.

- ### children

  `ReactNode`, optional

  The content of the modal passed as children. This can be any valid React element.

- ### width

  `string | number`, optional

  The width of the modal. This can be specified in pixels or any valid CSS width value.

- ### maxWidth

  `string | number`, optional

  The maximum width of the modal. This can be specified in pixels or any valid CSS width value.

- ### className

  `string`, optional

  Additional CSS class names to apply to the modal for custom styling.

- ### closeOnBackdropClick

  `boolean`, optional

  A boolean indicating whether the modal should close when the backdrop is clicked.

- ### headerRightSection

  `ReactNode`, optional

  A custom component displayed on the right side of the modal header.

- ### bottomSection

  `ReactNode`, optional

  A custom component displayed at the bottom of the modal, below the main content.