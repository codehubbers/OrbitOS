export const highContrastTheme = {
  id: 'highContrast',
  name: 'High Contrast Theme',
  desktop: 'bg-black',
  taskbar: 'bg-black border-t border-white',
  window: {
    bg: 'bg-black',
    border: 'border-white',
    header: 'bg-black border-b border-white',
    text: 'text-white',
    content: 'text-white bg-black',
    scrollbar: 'custom-scrollbar-contrast',
  },
  startMenu: 'bg-black border border-white',
  glass: 'bg-black/50 border border-white',
  text: {
    primary: 'text-white',
    secondary: 'text-gray-200',
    window: 'text-white',
    startMenu: 'text-white',
  },
  app: {
    bg: 'bg-black',
    text: 'text-white',
    input: 'bg-black border-white text-white placeholder-gray-300',
    button:
      'bg-black hover:bg-white text-white hover:text-black border border-white',
    table: 'bg-black border-white',
    tableHeader: 'bg-black text-white',
    tableCell: 'bg-black text-white border-white',
    toolbar: 'bg-black border-b border-white',
    toolbarButton: 'text-white hover:bg-yellow-400 hover:text-black',
    paper_bg: 'bg-black',
    badge: 'bg-gray-500 text-gray-200',
    button_subtle_hover: 'hover:bg-gray-800',
    text_subtle: 'text-gray-300',
    dropdown_bg: 'bg-black border border-white',
    dropdown_item_hover: 'hover:bg-yellow-400 hover:text-black',
    toolbar_button_active: 'bg-yellow-400 text-black',
  },
  calculator: {
    bg: 'bg-black',
    display: 'bg-black border-2 border-white',
    displayText: 'text-white',
    displaySubtext: 'text-gray-300',
    numberButton:
      'bg-black hover:bg-white text-white hover:text-black border-2 border-white',
    operatorButton:
      'bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-white',
    equalsButton: 'bg-white hover:bg-gray-200 text-black border-2 border-white',
    functionButton:
      'bg-black hover:bg-gray-800 text-white border-2 border-gray-400',
    memoryButton:
      'bg-black hover:bg-yellow-400 text-white hover:text-black border-2 border-yellow-400',
  },
  notification: 'bg-black text-white border border-white',
};
