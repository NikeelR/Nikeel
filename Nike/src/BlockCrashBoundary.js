import { Component } from '@wordpress/element';
import { useBlockProps } from '@wordpress/block-editor';

export class BlockCrashBoundary extends Component {
  constructor() {
    super(...arguments);

    this.state = {
      hasError: false,
    };
  }

  componentDidCatch() {
    this.setState({
      hasError: true,
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export function Block({ children, isHtml, ...props }) {
  return (
    <div {...useBlockProps(props, { __unstableIsHtml: isHtml })}>
      {children}
    </div>
  );
}