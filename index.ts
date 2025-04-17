import React, { JSX } from 'react';
import { Plugin } from 'vite';
import fg from 'fast-glob';
import fs from 'fs';
import path from 'path';
import componentLoader from './componentLoader';
import routeLoader from './routeLoader';
import middleComponentLoader from './middleComponentLoader';
import { getFilePath, getChildComponentLink } from './utils';

const needComponentLoader: string[] = [];
let componentList: string[] = [];
const middleComponentMap: Map<string, string[]> = new Map();

const updateComponentList = async () => {
  middleComponentMap.clear()
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
      componentList = needComponentLoader.map((file) => getFilePath(file));
      await Promise.all(
        files.map((file) => {
          return new Promise((resolve, reject) => {
            fs.readFile(path.resolve(file), { encoding: 'utf-8' }, (err, data) => {
              if (err) reject(err)
              const resolvedPath = path.resolve(file);
              const links = getChildComponentLink(data, resolvedPath, componentList);
              if (links.length > 0) {
                middleComponentMap.set(getFilePath(path.resolve(file)), links);
              }
              resolve(data)
            })
          })
        })
      )
}

export function RemixComponentCssLoader(): Plugin {
  return {
    name: "remix-component-css-loader",
    enforce: "pre",
    async buildStart() {
      await updateComponentList();
    },
    async hotUpdate() {
      await updateComponentList();
    },
    transform(code, id) {
      let newCode = code;
      const resolvedPath = path.resolve(id);
      if (/app\/.*\.[jt]sx?$/.test(id)) {
        if (needComponentLoader.includes(resolvedPath)) {
          newCode = componentLoader(newCode, resolvedPath, componentList, middleComponentMap);
        } else if (/app\/routes\/[^\\/]*.[jt]sx?$/gm.test(id) || /app\/routes\/[^\\/]*\/route\.[jt]sx?$/gm.test(id) || /app\/root.tsx?/gm.test(id)) {
          newCode = routeLoader(newCode, resolvedPath, componentList, middleComponentMap);
        } else if (middleComponentMap.has(getFilePath(resolvedPath))) {
          newCode = middleComponentLoader(newCode, resolvedPath, middleComponentMap.get(getFilePath(resolvedPath)) || []);
        }
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

