# Remix component css loader  [![npm package][npm-badge]][npm]
[npm-badge]: https://img.shields.io/npm/v/remix-component-css-loader.svg?style=flat-square
[npm]: https://www.npmjs.com/package/remix-component-css-loader

Automatically import your Component's Regular CSS files into your Remix route's links

## Getting Started

1. Install as a dev dependency
```sh
  npm install --save-dev remix-component-css-loader
```

2. Add the loader to your vite.config file
```ts
  import { defineConfig } from 'vite'
  import { RemixComponentCssLoader } from 'remix-component-css-loader'

  export default defineConfig({
    plugins: [
      RemixComponentCssLoader(), // ensure this loader is always on top
      ...
    ],
  })
```

3. Create a new component with its CSS file. Make sure the CSS file name matches the TSX file name
```
  /app
    /components
      /YourComponent
          + index.ts
          + YourComponent.tsx
          + YourComponent.css
```
4. Import and use the ``<Styled />``
```tsx
// YourComponent.tsx

import { Styled } from 'remix-component-css-loader';

const YourComponent = (props) => {
  return (
    <Styled>
      <span>Hello World!</span>
    </Styled>
  )
}

export default YourComponent;
```

5. Write your CSS styles
```css
/* YourComponent.css */

.YourComponent {
  /* your css styles */ 
}
.YourComponent > span {
  /* your css styles */ 
}
```

6. Use your component as usual
```tsx
  // app/routes/example
  
  import YourComponent from '~/component/YourComponent';

  const Page = () => {
    return (
      <div>
        <YourComponent />
      </div>
    )
  }

  export default Page;
```

7. When using this component, the className will be automatically added and your YourComponent.css will be imported
```html
  <!-- HTML document -->
  <head>
    ...
    <link rel="stylesheet" href="/app/components/YourComponent/YourComponent.css">
    ...
  </head>
  ...
    <div className="YourComponent">
      <span>Hello World!</span>
    </div>
  ...
```

## Advanced Usage
``<Styled />`` can be replaced with any HTMLElement. For example, to use it as an h1:
```tsx
// YourComponent.tsx

import { Styled } from 'remix-component-css-loader';

const YourComponent = (props) => {
  return (
    <Styled.h1>
      <span>Hello World!</span>
    </Styled.h1>
  )
}
```
This will automatically be transformed into:
```html
  <!-- HTML document -->
  ...
    <h1 className="YourComponent">
      <span>Hello World!</span>
    </h1>
  ...
```