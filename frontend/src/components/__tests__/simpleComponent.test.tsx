import React from 'react';
import { render, screen } from '@testing-library/react';

// Test simple pour vérifier que React et Testing Library fonctionnent
describe('Simple Component Tests', () => {
  it('should render a simple div', () => {
    const TestComponent = () => <div data-testid="test-div">Hello World</div>;
    
    render(<TestComponent />);
    
    expect(screen.getByTestId('test-div')).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should render a button component', () => {
    const ButtonComponent = ({ onClick, children }: { onClick: () => void; children: string }) => (
      <button onClick={onClick} data-testid="test-button">
        {children}
      </button>
    );
    
    const handleClick = () => {};
    
    render(<ButtonComponent onClick={handleClick}>Click me</ButtonComponent>);
    
    const button = screen.getByTestId('test-button');
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should render multiple elements', () => {
    const ListComponent = () => (
      <ul data-testid="test-list">
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
      </ul>
    );
    
    render(<ListComponent />);
    
    expect(screen.getByTestId('test-list')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });
});
