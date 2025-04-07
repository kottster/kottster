---
sidebar_position: 2
---

# Add custom fields

There are many ways to add custom fields to the form. 

## Using the `fieldTransformer`

If you want to add a new field to existing fields, you can use the [`fieldTransformer`](/table/table-page-component#fieldtransformer) prop.  

```jsx title="Example of adding a QR code field"
export default () => (
  <TablePage
    form={{
      fieldTransformer: fields => ([
        ...fields,

        // New field for displaying a QR code
        {
          // Specify your own unique field name
          column: 'linkToPostAsQR',

          // The display field label
          label: 'Link to post',

          formField: {
            type: 'custom',

            // Render component function
            renderComponent: ({ record }) => {
              return record ? (
                <a href={`https://example.com/posts/${record?.id}`} target="_blank" rel="noopener noreferrer">
                  Open post
                </a>
              ) : (
                <span>Create a post to see the link</span>
              )
            }
          }
        },
      ])
    }}
  />
);
```

You can learn more about the available field configurations on the [TablePage Component](/table/table-page-component#form-fields) page.
