/// <reference types="vite/client" />

// CSS Modules are imported as objects; this makes `import styles from './X.module.css'`
// type-check without also disabling checking for the rest of the project.
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}