import { getChildComponentLink } from "./utils";

const StyledStartReg = /<Styled\.?[^\s>]*/gm;
const StyledEndReg = /<\/Styled\.?[^\s>]*/gm;
const staticClassReg = /className="[^"]/gm;
const dynamicClassReg = /className={(?:[^}]|}\))*/gm;

function componentLoader(raw: string, resourcePath: string, componentList: string[]): string {
  let newRaw = raw;
  const FileName = resourcePath.split(/\\|\//gm).pop()?.replace(/\.[t|j]sx/gm, '') || '';
  if (new RegExp(StyledStartReg).test(raw)) {
    let lines = raw.split('\n');
    
    const startIndex = lines.findIndex((txt) => new RegExp(StyledStartReg).test(txt));
    const match = new RegExp(StyledStartReg).exec(lines[startIndex]);
    const [, element = 'div'] = match ? match[0].split('.') : ['', 'div'];
    
    // change <Styled.div> to <div className="">
    let existedClassName = '';
    if (new RegExp(staticClassReg).test(lines[startIndex])) {
      const staticMatch = new RegExp(staticClassReg).exec(lines[startIndex]);
      existedClassName = staticMatch ? staticMatch[0].replace('className="', '') : '';
      lines[startIndex] = lines[startIndex].replace(staticClassReg, `className="${FileName} ${existedClassName}`);
    } else if (dynamicClassReg.test(lines[startIndex])) {
      const dynamicMatch = new RegExp(dynamicClassReg).exec(lines[startIndex]);
      existedClassName = dynamicMatch ? dynamicMatch[0].replace('className={', '') : '';
      lines[startIndex] = lines[startIndex].replace(dynamicClassReg, `className={\`${FileName} $\{${existedClassName}}\``);
    }
    
    // change </Styled.div> to </div>
    lines[startIndex] = lines[startIndex].replace(StyledStartReg, `<${element}${existedClassName ? '' : ` className="${FileName}"`}`)
    
    // add .css path
    lines = [
      `import CSS_STYLED from './${FileName}.css?url'`,
      ...lines,
      `${FileName}.STYLESHEET_LINKS = [{ rel: "stylesheet", href: CSS_STYLED }];`,
    ]
    newRaw = lines.join('\n');
    newRaw = newRaw.replace(StyledEndReg, `</${element}`);
  }

  // collect STYLESHEET_LINKS from child component
  const links = getChildComponentLink(raw, resourcePath, componentList);
  if (links.length > 0) {
    newRaw = `${newRaw}\n${FileName}.STYLESHEET_LINKS = [].concat(${FileName}.STYLESHEET_LINKS${links.length > 0 ? `, ${links.join(', ')}` : ''}).filter(v => v)`;
  }
  return newRaw;
}

export default componentLoader;