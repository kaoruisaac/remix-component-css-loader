import React, { JSX } from 'react';
import { Plugin } from 'vite';
import fg from 'fast-glob';
import fs from 'fs';
import path from 'path';
import componentLoader from './componentLoader';
import routeLoader from './routeLoader';

const needComponentLoader: string[] = [];
let componentList: string[] = [];

const updateComponentList = async () => {
  const files = await fg('app/**/*.{jsx,tsx}')
      await Promise.all(
      files.map((file) => {
        return new Promise((resolve, reject) => {
          fs.readFile(path.resolve(file), { encoding: 'utf-8' }, (err, data) => {
            if (err) reject(err)
            if (/import\s*\{\s*Styled\s*\}\s*from\s*['"]remix-component-css-loader['"]/.test(data)) {
              needComponentLoader.push(path.resolve(file))
            }
            resolve(data)
          })
          })
        })
      )
      componentList = needComponentLoader.map((file) => {
        const filePath = file.replace(/\.[jt]sx$/, '');
        const filePathArray = filePath.split('\\');
        if (filePathArray[filePathArray.length - 1] === filePathArray[filePathArray.length - 2]) {
          return filePath.replace(`\\${filePathArray[filePathArray.length - 1]}`, '');
        }
        return filePath;
      });
}

export function RemixComponentCssLoader(): Plugin {
  return {
    name: "remix-component-css-loader",
    enforce: "pre",
    async buildStart() {
      updateComponentList();
    },
    async hotUpdate() {
      updateComponentList();
    },
    transform(code, id) {
      let newCode = code;
      const resolvedPath = path.resolve(id);
      if (
        /app\/.*\.[jt]sx$/.test(id) &&
        needComponentLoader.includes(resolvedPath)
      ) {
        newCode = componentLoader(code, resolvedPath, componentList);
      } else if (/app\/routes\/.*\.[jt]sx?$/gm.test(id) || /app\/root.tsx/gm.test(id)) {
        newCode = routeLoader(code, resolvedPath, componentList);
      }
      return { code: newCode };
    },
  };
}

interface RemixCssComponentProps {
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
type RemixCssComponent = React.FC<RemixCssComponentProps> & {
  [K in keyof JSX.IntrinsicElements]?: React.FC<RemixCssComponentProps>;
};

export const Styled: RemixCssComponent = ({ children }) => {
  return children;
};

