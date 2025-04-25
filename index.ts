import React, { JSX } from 'react';
import { Plugin } from 'vite';
import fs, { Dirent } from 'fs';
import path from 'path';
import componentLoader, { StyledImportReg } from './componentLoader';
import routeLoader from './routeLoader';
import middleComponentLoader from './middleComponentLoader';
import { getFilePath, getChildComponentLink } from './utils';

const needComponentLoader: string[] = [];
let componentList: string[] = [];
const middleComponentMap: Map<string, string[]> = new Map();

async function findFiles(dir: string, exts = ['.jsx', '.tsx']): Promise<string[]> {
  const entries = await new Promise<Dirent[]>((r, s) => {
    fs.readdir(dir, { withFileTypes: true }, (err, files) => {
      if (err) {
        s(err);
        console.error({ err });
      }
      r(files);
    });
  })
  const results: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await findFiles(fullPath, exts));
    } else if (exts.includes(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }

  return results;
}

const updateComponentList = async () => {
  middleComponentMap.clear()
  try {
    const files = await findFiles('app');
    await Promise.all(
      files.map((file) => {
        return new Promise((resolve, reject) => {
          fs.readFile(path.resolve(file), { encoding: 'utf-8' }, (err, data) => {
            if (err) reject(err)
            if (StyledImportReg.test(data)) {
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
  } catch (error) {
    console.error({ error });
  }
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

