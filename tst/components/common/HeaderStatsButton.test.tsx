import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HeaderStatsButton } from '@components/common/HeaderStatsButton';

describe('HeaderStatsButton', () => {
  it('should render default label (%)', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(<HeaderStatsButton onPress={mockOnPress} />);

    expect(getByText('%')).toBeTruthy();
  });

  it('should render custom label when provided', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <HeaderStatsButton onPress={mockOnPress} label="Stats" />
    );

    expect(getByText('Stats')).toBeTruthy();
  });

  it('should call onPress when button is pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(<HeaderStatsButton onPress={mockOnPress} />);

    fireEvent.press(getByText('%'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('should call onPress multiple times when pressed multiple times', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(<HeaderStatsButton onPress={mockOnPress} />);

    const button = getByText('%');
    fireEvent.press(button);
    fireEvent.press(button);
    fireEvent.press(button);

    expect(mockOnPress).toHaveBeenCalledTimes(3);
  });
});
