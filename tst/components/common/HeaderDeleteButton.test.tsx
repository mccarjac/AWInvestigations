import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HeaderDeleteButton } from '@components/common/HeaderDeleteButton';

describe('HeaderDeleteButton', () => {
  it('should render default label (Delete)', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(<HeaderDeleteButton onPress={mockOnPress} />);

    expect(getByText('Delete')).toBeTruthy();
  });

  it('should render custom label when provided', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <HeaderDeleteButton onPress={mockOnPress} label="Remove" />
    );

    expect(getByText('Remove')).toBeTruthy();
  });

  it('should call onPress when button is pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(<HeaderDeleteButton onPress={mockOnPress} />);

    fireEvent.press(getByText('Delete'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('should call onPress multiple times when pressed multiple times', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(<HeaderDeleteButton onPress={mockOnPress} />);

    const button = getByText('Delete');
    fireEvent.press(button);
    fireEvent.press(button);

    expect(mockOnPress).toHaveBeenCalledTimes(2);
  });
});
