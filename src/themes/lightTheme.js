export const lightTheme = {
  id: 'light',
  name: 'Light Mode',
  desktop: 'bg-gradient-to-br from-[#a78bfa] to-[#c084fc]',
  taskbar: 'bg-white/30 border-t border-[#d1d5db]',
  window: {
    bg: 'bg-white',
    border: 'border-[#d1d5db]',
    header: 'bg-white border-b border-[#d1d5db]',
    text: 'text-[#111827]',
    content: 'text-[#111827] bg-white',
    scrollbar: 'custom-scrollbar-light',
  },
  startMenu: 'bg-white border border-gray-300',
  glass: 'bg-white/10 backdrop-blur-sm border border-white/20',
  text: {
    primary: 'text-[#111827]',
    secondary: 'text-[#374151]',
    window: 'text-[#111827]',
    startMenu: 'text-[#111827]',
  },
  app: {
    bg: 'bg-[#ffffff]',
    text: 'text-[#111827]',
    input: 'bg-[#ffffff] border-[#d1d5db] text-[#111827] placeholder-gray-500',
    button: 'bg-[#f9fafb] hover:bg-[#c4b5fd] text-[#111827]',
    table: 'bg-[#ffffff] border-[#e5e7eb]',
    tableHeader: 'bg-[#f9fafb] text-[#111827]',
    tableCell: 'bg-[#ffffff] text-[#111827] border-[#e5e7eb]',
    toolbar: 'bg-[#f9fafb] border-b border-[#d1d5db]',
    toolbarButton: 'text-[#374151] hover:text-[#111827] hover:bg-[#e5e7eb]',
    paper_bg: 'bg-white',
    badge: 'bg-gray-200 text-gray-800',
    button_subtle_hover: 'hover:bg-gray-200',
    text_subtle: 'text-gray-500',
    dropdown_bg: 'bg-white/95 backdrop-blur-md border border-gray-200',
    dropdown_item_hover: 'hover:bg-blue-500 hover:text-white',
    toolbar_button_active: 'bg-blue-200 text-blue-800',
  },
  calculator: {
    bg: 'bg-gradient-to-br from-white to-gray-50',
    display:
      'bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-2xl',
    displayText: 'text-gray-900',
    displaySubtext: 'text-gray-600',
    numberButton:
      'bg-white/70 hover:bg-white/90 active:bg-gray-100 text-gray-900 border border-gray-200/50 backdrop-blur-sm shadow-lg hover:shadow-xl',
    operatorButton:
      'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold shadow-lg hover:shadow-xl border-0',
    equalsButton:
      'bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold shadow-lg hover:shadow-xl border-0',
    functionButton:
      'bg-gray-100/70 hover:bg-gray-200/70 active:bg-gray-300/70 text-gray-700 border border-gray-200/50 backdrop-blur-sm',
    memoryButton:
      'bg-purple-100/70 hover:bg-purple-200/70 active:bg-purple-300/70 text-purple-700 border border-purple-200/50 backdrop-blur-sm',
  },
  notification: 'bg-white text-[#111827] border border-gray-300',
};
