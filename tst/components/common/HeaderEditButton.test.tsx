import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HeaderEditButton } from '@components/common/HeaderEditButton';

describe('HeaderEditButton', () => {
  it('should render default label (Edit)', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(<HeaderEditButton onPress={mockOnPress} />);

    expect(getByText('Edit')).toBeTruthy();
  });

  it('should render custom label when provided', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <HeaderEditButton onPress={mockOnPress} label="Modify" />
    );

    expect(getByText('Modify')).toBeTruthy();
  });

  it('should call onPress when button is pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(<HeaderEditButton onPress={mockOnPress} />);

    fireEvent.press(getByText('Edit'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('should call onPress multiple times when pressed multiple times', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(<HeaderEditButton onPress={mockOnPress} />);

    const button = getByText('Edit');
    fireEvent.press(button);
    fireEvent.press(button);

    expect(mockOnPress).toHaveBeenCalledTimes(2);
  });
});
