import type { BlockStyles } from '../types';

export function stylesToCss(styles: BlockStyles): string {
  const cssProperties: string[] = [];
  
  const propertyMap: Record<string, string> = {
    backgroundColor: 'background-color',
    backgroundImage: 'background-image',
    backgroundPosition: 'background-position',
    backgroundRepeat: 'background-repeat',
    backgroundSize: 'background-size',
    paddingTop: 'padding-top',
    paddingRight: 'padding-right',
    paddingBottom: 'padding-bottom',
    paddingLeft: 'padding-left',
    marginTop: 'margin-top',
    marginRight: 'margin-right',
    marginBottom: 'margin-bottom',
    marginLeft: 'margin-left',
    borderTopWidth: 'border-top-width',
    borderRightWidth: 'border-right-width',
    borderBottomWidth: 'border-bottom-width',
    borderLeftWidth: 'border-left-width',
    borderTopColor: 'border-top-color',
    borderRightColor: 'border-right-color',
    borderBottomColor: 'border-bottom-color',
    borderLeftColor: 'border-left-color',
    borderTopStyle: 'border-top-style',
    borderRightStyle: 'border-right-style',
    borderBottomStyle: 'border-bottom-style',
    borderLeftStyle: 'border-left-style',
    borderRadius: 'border-radius',
    textAlign: 'text-align',
    verticalAlign: 'vertical-align',
    fontFamily: 'font-family',
    fontSize: 'font-size',
    fontWeight: 'font-weight',
    fontStyle: 'font-style',
    lineHeight: 'line-height',
    letterSpacing: 'letter-spacing',
    textDecoration: 'text-decoration',
    textTransform: 'text-transform',
    color: 'color',
    width: 'width',
    maxWidth: 'max-width',
    minWidth: 'min-width',
    height: 'height',
    maxHeight: 'max-height',
    minHeight: 'min-height',
  };

  for (const [key, value] of Object.entries(styles)) {
    if (value !== undefined && value !== null && value !== '') {
      const cssProperty = propertyMap[key] || key;
      cssProperties.push(`${cssProperty}: ${value}`);
    }
  }

  return cssProperties.join('; ');
}

export function stylesToInlineStyle(styles: BlockStyles): string {
  const css = stylesToCss(styles);
  return css ? `style="${css}"` : '';
}

export function parseInlineStyles(styleString: string): BlockStyles {
  const styles: BlockStyles = {};
  if (!styleString) return styles;

  const declarations = styleString.split(';');
  
  const reverseMap: Record<string, keyof BlockStyles> = {
    'background-color': 'backgroundColor',
    'background-image': 'backgroundImage',
    'background-position': 'backgroundPosition',
    'background-repeat': 'backgroundRepeat',
    'background-size': 'backgroundSize',
    'padding-top': 'paddingTop',
    'padding-right': 'paddingRight',
    'padding-bottom': 'paddingBottom',
    'padding-left': 'paddingLeft',
    'margin-top': 'marginTop',
    'margin-right': 'marginRight',
    'margin-bottom': 'marginBottom',
    'margin-left': 'marginLeft',
    'border-top-width': 'borderTopWidth',
    'border-right-width': 'borderRightWidth',
    'border-bottom-width': 'borderBottomWidth',
    'border-left-width': 'borderLeftWidth',
    'border-top-color': 'borderTopColor',
    'border-right-color': 'borderRightColor',
    'border-bottom-color': 'borderBottomColor',
    'border-left-color': 'borderLeftColor',
    'border-top-style': 'borderTopStyle',
    'border-right-style': 'borderRightStyle',
    'border-bottom-style': 'borderBottomStyle',
    'border-left-style': 'borderLeftStyle',
    'border-radius': 'borderRadius',
    'text-align': 'textAlign',
    'vertical-align': 'verticalAlign',
    'font-family': 'fontFamily',
    'font-size': 'fontSize',
    'font-weight': 'fontWeight',
    'font-style': 'fontStyle',
    'line-height': 'lineHeight',
    'letter-spacing': 'letterSpacing',
    'text-decoration': 'textDecoration',
    'text-transform': 'textTransform',
    'color': 'color',
    'width': 'width',
    'max-width': 'maxWidth',
    'min-width': 'minWidth',
    'height': 'height',
    'max-height': 'maxHeight',
    'min-height': 'minHeight',
  };

  for (const declaration of declarations) {
    const [property, value] = declaration.split(':').map(s => s.trim());
    if (property && value) {
      const jsProperty = reverseMap[property];
      if (jsProperty) {
        (styles as Record<string, string>)[jsProperty] = value;
      }
    }
  }

  return styles;
}

export function mergeStyles(...styleObjects: (BlockStyles | undefined)[]): BlockStyles {
  return styleObjects.reduce<BlockStyles>((merged, styles) => {
    if (!styles) return merged;
    return { ...merged, ...styles };
  }, {});
}

export function getPaddingShorthand(styles: BlockStyles): string {
  const top = styles.paddingTop || '0';
  const right = styles.paddingRight || '0';
  const bottom = styles.paddingBottom || '0';
  const left = styles.paddingLeft || '0';
  
  if (top === right && right === bottom && bottom === left) {
    return top;
  }
  if (top === bottom && left === right) {
    return `${top} ${right}`;
  }
  if (left === right) {
    return `${top} ${right} ${bottom}`;
  }
  return `${top} ${right} ${bottom} ${left}`;
}

export function getMarginShorthand(styles: BlockStyles): string {
  const top = styles.marginTop || '0';
  const right = styles.marginRight || '0';
  const bottom = styles.marginBottom || '0';
  const left = styles.marginLeft || '0';
  
  if (top === right && right === bottom && bottom === left) {
    return top;
  }
  if (top === bottom && left === right) {
    return `${top} ${right}`;
  }
  if (left === right) {
    return `${top} ${right} ${bottom}`;
  }
  return `${top} ${right} ${bottom} ${left}`;
}
