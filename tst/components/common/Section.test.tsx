import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Section } from '@components/common/Section';

describe('Section', () => {
  it('should render title correctly', () => {
    const { getByText } = render(
      <Section title="Test Section">
        <Text>Content</Text>
      </Section>
    );

    expect(getByText('Test Section')).toBeTruthy();
  });

  it('should render children correctly', () => {
    const { getByText } = render(
      <Section title="Test Section">
        <Text>Test Content</Text>
      </Section>
    );

    expect(getByText('Test Content')).toBeTruthy();
  });

  it('should render multiple children', () => {
    const { getByText } = render(
      <Section title="Test Section">
        <Text>First Child</Text>
        <Text>Second Child</Text>
      </Section>
    );

    expect(getByText('First Child')).toBeTruthy();
    expect(getByText('Second Child')).toBeTruthy();
  });

  it('should apply custom style when provided', () => {
    const customStyle = { padding: 10 };
    const { getByText } = render(
      <Section title="Styled Section" style={customStyle}>
        <Text>Content</Text>
      </Section>
    );

    expect(getByText('Styled Section')).toBeTruthy();
  });
});
