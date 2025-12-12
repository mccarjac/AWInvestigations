import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { CollapsibleSection } from '@components/common/CollapsibleSection';

describe('CollapsibleSection', () => {
  it('should render title correctly', () => {
    const { getByText } = render(
      <CollapsibleSection title="Test Section">
        <Text>Content</Text>
      </CollapsibleSection>
    );

    expect(getByText('Test Section')).toBeTruthy();
  });

  it('should render children when not collapsed', () => {
    const { getByText } = render(
      <CollapsibleSection title="Test Section" defaultCollapsed={false}>
        <Text>Test Content</Text>
      </CollapsibleSection>
    );

    expect(getByText('Test Content')).toBeTruthy();
  });

  it('should not render children when defaultCollapsed is true', () => {
    const { queryByText, getByText } = render(
      <CollapsibleSection title="Test Section" defaultCollapsed={true}>
        <Text>Hidden Content</Text>
      </CollapsibleSection>
    );

    expect(getByText('Test Section')).toBeTruthy();
    expect(queryByText('Hidden Content')).toBeNull();
  });

  it('should toggle collapsed state when header is pressed', () => {
    const { getByText, queryByText } = render(
      <CollapsibleSection title="Test Section" defaultCollapsed={false}>
        <Text>Toggle Content</Text>
      </CollapsibleSection>
    );

    // Initially visible
    expect(getByText('Toggle Content')).toBeTruthy();

    // Click to collapse
    fireEvent.press(getByText('Test Section'));
    expect(queryByText('Toggle Content')).toBeNull();

    // Click to expand
    fireEvent.press(getByText('Test Section'));
    expect(getByText('Toggle Content')).toBeTruthy();
  });

  it('should show down arrow when expanded', () => {
    const { getByText } = render(
      <CollapsibleSection title="Test Section" defaultCollapsed={false}>
        <Text>Content</Text>
      </CollapsibleSection>
    );

    expect(getByText('▼')).toBeTruthy();
  });

  it('should show right arrow when collapsed', () => {
    const { getByText } = render(
      <CollapsibleSection title="Test Section" defaultCollapsed={true}>
        <Text>Content</Text>
      </CollapsibleSection>
    );

    expect(getByText('▶')).toBeTruthy();
  });

  it('should apply custom style when provided', () => {
    const customStyle = { marginTop: 20 };
    const { getByText } = render(
      <CollapsibleSection title="Styled Section" style={customStyle}>
        <Text>Content</Text>
      </CollapsibleSection>
    );

    expect(getByText('Styled Section')).toBeTruthy();
  });

  it('should default to expanded when defaultCollapsed is not provided', () => {
    const { getByText } = render(
      <CollapsibleSection title="Default Section">
        <Text>Default Content</Text>
      </CollapsibleSection>
    );

    expect(getByText('Default Content')).toBeTruthy();
    expect(getByText('▼')).toBeTruthy();
  });
});
