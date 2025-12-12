import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from '@components/common/Card';

describe('Card', () => {
  it('should render children correctly', () => {
    const { getByText } = render(
      <Card>
        <Text>Test Content</Text>
      </Card>
    );

    expect(getByText('Test Content')).toBeTruthy();
  });

  it('should apply present style when present prop is true', () => {
    const { getByTestId } = render(
      <Card present={true}>
        <Text testID="card-content">Present Character</Text>
      </Card>
    );

    expect(getByTestId('card-content')).toBeTruthy();
  });

  it('should not apply present style when present prop is false', () => {
    const { getByTestId } = render(
      <Card present={false}>
        <Text testID="card-content">Not Present</Text>
      </Card>
    );

    expect(getByTestId('card-content')).toBeTruthy();
  });

  it('should apply custom style when provided', () => {
    const customStyle = { backgroundColor: 'red' };
    const { getByText } = render(
      <Card style={customStyle}>
        <Text>Styled Card</Text>
      </Card>
    );

    expect(getByText('Styled Card')).toBeTruthy();
  });

  it('should apply custom content style when provided', () => {
    const customContentStyle = { padding: 20 };
    const { getByText } = render(
      <Card contentStyle={customContentStyle}>
        <Text>Content Styled Card</Text>
      </Card>
    );

    expect(getByText('Content Styled Card')).toBeTruthy();
  });

  it('should default present to false when not provided', () => {
    const { getByText } = render(
      <Card>
        <Text>Default Card</Text>
      </Card>
    );

    expect(getByText('Default Card')).toBeTruthy();
  });
});
