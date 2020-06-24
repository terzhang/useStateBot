import React, { Component, ReactNode } from 'react';
import { renderHook } from '@testing-library/react-hooks';

interface State {
  didError: boolean;
}

export default function expectHookError(element: () => any) {
  // Noop error boundary for testing.
  class ErrorBoundary extends Component<{}, State> {
    constructor(props: any) {
      super(props);
      this.state = { didError: false };
    }
    componentDidCatch(_err: any) {
      this.setState({ didError: true });
    }
    render() {
      return this.state.didError ? null : this.props.children;
    }
  }

  // Record all errors.
  let topLevelErrors: any = [];
  function handleTopLevelError(event: any) {
    topLevelErrors.push(event.error);
    // Prevent logging
    event.preventDefault();
  }

  window.addEventListener('error', handleTopLevelError);
  try {
    let wrapper = ({ children }: { children?: ReactNode }) => (
      <ErrorBoundary>{children}</ErrorBoundary>
    );
    renderHook(
      () => {
        element();
      },
      { wrapper }
    );
  } finally {
    window.removeEventListener('error', handleTopLevelError);
  }

  expect(topLevelErrors.length).toBe(1);
  return topLevelErrors.length === 1 ? { error: topLevelErrors[0] } : null;
}
