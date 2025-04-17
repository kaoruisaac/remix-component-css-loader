import { getChildComponentLink } from "./utils";

/* eslint-disable @typescript-eslint/no-unused-vars */
const StyledStartReg = /<Styled\.?[^\s>]*/gm;
const StyledEndReg = /<\/Styled\.?[^\s>]*/gm;
const staticClassReg = /className="[^"]/gm;
const dynamicClassReg = /className={(?:[^}]|}\))*/gm;

function componentLoader (raw: string, resourcePath: string, componentList: string[], middleComponentMap: Map<string, string[]>) {
  let newRaw = raw;
  const FileName = resourcePath.split(/\\|\//gm).pop()?.replace(/\.[t|j]sx/gm, '') || '';
  if (new RegExp(StyledStartReg).test(raw)) {
    let lines = raw.split('\n');
    
    const  startIndex = lines.findIndex((txt) => new RegExp(StyledStartReg).test(txt));
    const [, element = 'div'] = new RegExp(StyledStartReg).exec(lines[startIndex])?.[0]?.split('.') || [];
    
    // change <Styled.div> to <div className="">
    let existedClassName;
    if (new RegExp(staticClassReg).test(lines[startIndex])) {
      existedClassName = new RegExp(staticClassReg).exec(lines[startIndex])?.[0]?.replace('className="', '');
      lines[startIndex] = lines[startIndex].replace(staticClassReg, `className="${FileName} ${existedClassName}`);
    } else if (dynamicClassReg.test(lines[startIndex])) {
      existedClassName = new RegExp(dynamicClassReg).exec(lines[startIndex])?.[0]?.replace('className={', '');
      lines[startIndex] = lines[startIndex].replace(dynamicClassReg, `className={\`${FileName} $\{${existedClassName}}\``);
    }
    
    // change </Styled.div> to </div>
    lines[startIndex] = lines[startIndex].replace(StyledStartReg, `<${element}${existedClassName ? '' : ` className="${FileName}"`}`)

    // collect STYLESHEET_LINKS from child component
    const links = getChildComponentLink(raw, resourcePath, componentList, middleComponentMap);

    // add .css path
    lines = [
      `import CSS_STYLED from './${FileName}.css?url'`,
      ...lines,
      `${FileName}.STYLESHEET_LINKS = ${links.length > 0 ? `[].concat({ rel: "stylesheet", href: CSS_STYLED }, ${links.join(', ')}).filter(v => v)` : `[{ rel: "stylesheet", href: CSS_STYLED }]`}`, 
    ]
    newRaw = lines.join('\n');
    newRaw = newRaw.replace(StyledEndReg, `</${element}`);
  }

  return newRaw;
}

export default componentLoader;