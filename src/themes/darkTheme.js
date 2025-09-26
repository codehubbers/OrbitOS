export const darkTheme = {
  id: 'dark',
  name: 'Dark Theme',
  desktop: 'bg-black',
  taskbar: 'bg-black/80 border-t border-white',
  window: {
    bg: 'bg-black',
    border: 'border-white',
    header: 'bg-black border-b border-white',
    text: 'text-white',
    content: 'text-white bg-black',
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
    bg: 'bg-gradient-to-br from-gray-900 to-gray-800',
    display: 'bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl',
    displayText: 'text-white',
    displaySubtext: 'text-gray-300',
    numberButton:
      'bg-white/10 hover:bg-white/20 active:bg-white/30 text-white border border-white/20 backdrop-blur-sm shadow-lg hover:shadow-xl',
    operatorButton:
      'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 active:from-blue-600 active:to-blue-700 text-white font-bold shadow-lg hover:shadow-xl border-0',
    equalsButton:
      'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 active:from-orange-600 active:to-red-600 text-white font-bold shadow-lg hover:shadow-xl border-0',
    functionButton:
      'bg-white/5 hover:bg-white/15 active:bg-white/25 text-gray-300 border border-white/10 backdrop-blur-sm',
    memoryButton:
      'bg-purple-500/20 hover:bg-purple-500/30 active:bg-purple-500/40 text-purple-200 border border-purple-400/30 backdrop-blur-sm',
  },
  notification: 'bg-black text-white border border-white',
};
