const React = require('react');

module.exports = {
  motion: {
    button: React.forwardRef((props, ref) => {
      const { whileHover, whileTap, ...rest } = props;
      return React.createElement('button', { ...rest, ref });
    }),
    div: React.forwardRef((props, ref) => {
      const { whileHover, whileTap, ...rest } = props;
      return React.createElement('div', { ...rest, ref });
    })
  }
};