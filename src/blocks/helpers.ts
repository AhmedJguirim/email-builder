import { Block, BlockStyles } from "@/types";
import { BlockHandlerCallbacks } from "./handlers";

/**
 * used to activate a style attribute to a certain block
 * @param styleAttribute : the style attribute to activate
 * @param properties : the properties element
 * @param block : the block to apply the style to
 * @param callbacks : the callbacks to use
 * @param inputId : the id of the input element
 */
export function addStyleListener(
    styleAttribute: keyof BlockStyles,
  properties: HTMLElement,
  block: Block,
  callbacks: BlockHandlerCallbacks,
  inputId: string
): void {
    const input = properties.querySelector(inputId) as HTMLSelectElement;
    const styles = block.styles as BlockStyles;
    if (input) {
      input.addEventListener('change', () => {
        // styles[styleAttribute] = input.value;
        switch(styleAttribute){ 
            case 'backgroundColor':
                styles.backgroundColor = input.value;
                break;
            case 'backgroundImage':
                styles.backgroundImage = input.value;
                break;
            case 'backgroundPosition':
                styles.backgroundPosition = input.value;
                break;
            case 'backgroundRepeat':
                styles.backgroundRepeat = input.value;
                break;
            case 'backgroundSize':
                styles.backgroundSize = input.value;
                break;            
            case 'paddingTop':
                styles.paddingTop = input.value;
                break;
            case 'paddingRight':
                styles.paddingRight = input.value;
                break;
            case 'paddingBottom':
                styles.paddingBottom = input.value;
                break;
            case 'paddingLeft':
                styles.paddingLeft = input.value;
                break;
            case 'marginTop':
                styles.marginTop = input.value;
                break;
            case 'marginRight':
                styles.marginRight = input.value;
                break;
            case 'marginBottom':
                styles.marginBottom = input.value;
                break;
            case 'marginLeft':
                styles.marginLeft = input.value;
                break;
            case 'borderTopWidth':
                styles.borderTopWidth = input.value;
                break;
            case 'borderRightWidth':
                styles.borderRightWidth = input.value;
                break;
            case 'borderBottomWidth':
                styles.borderBottomWidth = input.value;
                break;
            case 'borderLeftWidth':
                styles.borderLeftWidth = input.value;
                break;
            case 'borderTopColor':
                styles.borderTopColor = input.value;
                break;
            case 'borderRightColor':
                styles.borderRightColor = input.value;
                break;
            case 'borderBottomColor':
                styles.borderBottomColor = input.value;
                break;
            case 'borderLeftColor':
                styles.borderLeftColor = input.value;
                break;
            case 'borderTopStyle':
                styles.borderTopStyle = input.value;
                break;
            case 'borderRightStyle':
                styles.borderRightStyle = input.value;
                break;
            case 'borderBottomStyle':
                styles.borderBottomStyle = input.value;
                break;
            case 'borderLeftStyle':
                styles.borderLeftStyle = input.value;
                break;
            case 'borderRadius':
                styles.borderRadius = input.value;
                break;
            case 'textAlign':
                styles.textAlign = input.value as any;
                break;
            case 'verticalAlign':
                styles.verticalAlign = input.value as any;
                break;
            case 'fontFamily':
                styles.fontFamily = input.value;
                break;
            case 'fontSize':
                styles.fontSize = input.value;
                break;
            case 'fontWeight':
                styles.fontWeight = input.value;
                break;
            case 'fontStyle':
                styles.fontStyle = input.value;
                break;
            case 'lineHeight':
                styles.lineHeight = input.value;
                break;
            case 'letterSpacing':
                styles.letterSpacing = input.value;
                break;
            case 'textDecoration':
                styles.textDecoration = input.value;
                break;
            case 'textTransform':
                styles.textTransform = input.value;
                break;
            case 'color':
                styles.color = input.value;
                break;
            case 'width':
                styles.width = input.value;
                break;
            case 'maxWidth':
                styles.maxWidth = input.value;
                break;
            case 'minWidth':
                styles.minWidth = input.value;
                break;
            case 'height':
                styles.height = input.value;
                break;
            case 'maxHeight':
                styles.maxHeight = input.value;
                break;
            case 'minHeight':
                styles.minHeight = input.value;
                break;
        }
        callbacks.updateBlock(block.id,  { styles } as Partial<Block>);
        callbacks.renderCanvas();
      });
    }
}