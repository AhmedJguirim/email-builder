export interface BlockStyles {
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;
  backgroundSize?: string;
  
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  
  borderTopWidth?: string;
  borderRightWidth?: string;
  borderBottomWidth?: string;
  borderLeftWidth?: string;
  borderTopColor?: string;
  borderRightColor?: string;
  borderBottomColor?: string;
  borderLeftColor?: string;
  borderTopStyle?: string;
  borderRightStyle?: string;
  borderBottomStyle?: string;
  borderLeftStyle?: string;
  borderRadius?: string;
  
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textDecoration?: string;
  textTransform?: string;
  color?: string;
  
  width?: string;
  maxWidth?: string;
  minWidth?: string;
  height?: string;
  maxHeight?: string;
  minHeight?: string;
}

export interface EmailStyles {
  body: {
    backgroundColor: string;
    fontFamily: string;
    fontSize: string;
    lineHeight: string;
    color: string;
  };
  container: {
    backgroundColor: string;
    maxWidth: string;
    borderRadius?: string;
    padding?: string;
  };
  link: {
    color: string;
    textDecoration: string;
  };
}

export const DEFAULT_EMAIL_STYLES: EmailStyles = {
  body: {
    backgroundColor: '#f4f4f4',
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: '16px',
    lineHeight: '1.5',
    color: '#333333',
  },
  container: {
    backgroundColor: '#ffffff',
    maxWidth: '600px',
    borderRadius: '0',
    padding: '0',
  },
  link: {
    color: '#3b82f6',
    textDecoration: 'underline',
  },
};

export const DEFAULT_BLOCK_STYLES: BlockStyles = {
  paddingTop: '10px',
  paddingRight: '20px',
  paddingBottom: '10px',
  paddingLeft: '20px',
  textAlign: 'left',
};

export const FONT_FAMILIES = [
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Trebuchet MS', value: '"Trebuchet MS", Helvetica, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, Geneva, sans-serif' },
  { label: 'Lucida Sans', value: '"Lucida Sans Unicode", "Lucida Grande", sans-serif' },
  { label: 'Palatino', value: '"Palatino Linotype", "Book Antiqua", Palatino, serif' },
  { label: 'Garamond', value: 'Garamond, serif' },
];

export const FONT_SIZES = [
  '10px', '11px', '12px', '13px', '14px', '15px', '16px', 
  '18px', '20px', '22px', '24px', '28px', '32px', '36px', 
  '40px', '48px', '56px', '64px', '72px'
];

export const FONT_WEIGHTS = [
  { label: 'Light', value: '300' },
  { label: 'Normal', value: '400' },
  { label: 'Medium', value: '500' },
  { label: 'Semi Bold', value: '600' },
  { label: 'Bold', value: '700' },
  { label: 'Extra Bold', value: '800' },
];
