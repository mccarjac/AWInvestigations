import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HeaderAddButton } from '@components/common/HeaderAddButton';

describe('HeaderAddButton', () => {
  it('should render default label (+)', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(<HeaderAddButton onPress={mockOnPress} />);

    expect(getByText('+')).toBeTruthy();
  });

  it('should render custom label when provided', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <HeaderAddButton onPress={mockOnPress} label="Add New" />
    );

    expect(getByText('Add New')).toBeTruthy();
  });

  it('should call onPress when button is pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(<HeaderAddButton onPress={mockOnPress} />);

    fireEvent.press(getByText('+'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('should call onPress multiple times when pressed multiple times', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(<HeaderAddButton onPress={mockOnPress} />);

    const button = getByText('+');
    fireEvent.press(button);
    fireEvent.press(button);
    fireEvent.press(button);

    expect(mockOnPress).toHaveBeenCalledTimes(3);
  });
});
