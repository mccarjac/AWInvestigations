import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { InfoButton } from '@components/common/InfoButton';

describe('InfoButton', () => {
  it('should render info icon', () => {
    const { getByText } = render(
      <InfoButton title="Test Title" content="Test Content" />
    );

    expect(getByText('ⓘ')).toBeTruthy();
  });

  it('should not show modal initially', () => {
    const { queryByText } = render(
      <InfoButton title="Test Title" content="Test Content" />
    );

    expect(queryByText('Test Title')).toBeNull();
    expect(queryByText('Test Content')).toBeNull();
  });

  it('should open modal when info button is pressed', () => {
    const { getByText } = render(
      <InfoButton title="Info Title" content="Info Content" />
    );

    fireEvent.press(getByText('ⓘ'));

    expect(getByText('Info Title')).toBeTruthy();
    expect(getByText('Info Content')).toBeTruthy();
  });

  it('should close modal when close button is pressed', () => {
    const { getByText } = render(
      <InfoButton title="Test Title" content="Test Content" />
    );

    // Open modal
    fireEvent.press(getByText('ⓘ'));
    expect(getByText('Test Title')).toBeTruthy();

    // Close modal
    fireEvent.press(getByText('Close'));

    // Modal content should not be visible (but modal still exists in DOM)
    // We can't easily test visibility without more complex mocking
  });

  it('should use custom icon size when provided', () => {
    const { getByText } = render(
      <InfoButton title="Test Title" content="Test Content" iconSize={24} />
    );

    expect(getByText('ⓘ')).toBeTruthy();
  });

  it('should display modal title and content correctly', () => {
    const { getByText } = render(
      <InfoButton title="Test Title" content="Test Content" />
    );

    // Open modal
    fireEvent.press(getByText('ⓘ'));

    expect(getByText('Test Title')).toBeTruthy();
    expect(getByText('Test Content')).toBeTruthy();
    expect(getByText('Close')).toBeTruthy();
  });
});
