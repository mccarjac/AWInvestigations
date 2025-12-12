import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { BaseListScreen } from '@/components';

interface TestItem {
  id: string;
  name: string;
}

const mockItems: TestItem[] = [
  { id: '1', name: 'Item 1' },
  { id: '2', name: 'Item 2' },
  { id: '3', name: 'Item 3' },
];

describe('BaseListScreen', () => {
  const mockRenderItem = (item: TestItem) => <Text>{item.name}</Text>;
  const mockKeyExtractor = (item: TestItem) => item.id;

  it('should render list items', () => {
    const { getByText } = render(
      <BaseListScreen
        data={mockItems}
        renderItem={mockRenderItem}
        keyExtractor={mockKeyExtractor}
      />
    );

    expect(getByText('Item 1')).toBeTruthy();
    expect(getByText('Item 2')).toBeTruthy();
    expect(getByText('Item 3')).toBeTruthy();
  });

  it('should display empty state when data is empty', () => {
    const { getByText } = render(
      <BaseListScreen
        data={[]}
        renderItem={mockRenderItem}
        keyExtractor={mockKeyExtractor}
        emptyStateTitle="No items"
        emptyStateSubtitle="Add some items to get started"
      />
    );

    expect(getByText('No items')).toBeTruthy();
    expect(getByText('Add some items to get started')).toBeTruthy();
  });

  it('should display default empty state message', () => {
    const { getByText } = render(
      <BaseListScreen
        data={[]}
        renderItem={mockRenderItem}
        keyExtractor={mockKeyExtractor}
      />
    );

    expect(getByText('No items found')).toBeTruthy();
  });

  it('should render search input when showSearch is true', () => {
    const mockOnSearchChange = jest.fn();
    const { getByPlaceholderText } = render(
      <BaseListScreen
        data={mockItems}
        renderItem={mockRenderItem}
        keyExtractor={mockKeyExtractor}
        showSearch={true}
        onSearchChange={mockOnSearchChange}
        searchPlaceholder="Search items..."
      />
    );

    expect(getByPlaceholderText('Search items...')).toBeTruthy();
  });

  it('should not render search input when showSearch is false', () => {
    const { queryByPlaceholderText } = render(
      <BaseListScreen
        data={mockItems}
        renderItem={mockRenderItem}
        keyExtractor={mockKeyExtractor}
        showSearch={false}
        searchPlaceholder="Search..."
      />
    );

    expect(queryByPlaceholderText('Search...')).toBeNull();
  });

  it('should call onSearchChange when search text changes', () => {
    const mockOnSearchChange = jest.fn();
    const { getByPlaceholderText } = render(
      <BaseListScreen
        data={mockItems}
        renderItem={mockRenderItem}
        keyExtractor={mockKeyExtractor}
        onSearchChange={mockOnSearchChange}
        searchPlaceholder="Search..."
      />
    );

    const searchInput = getByPlaceholderText('Search...');
    fireEvent.changeText(searchInput, 'test query');

    expect(mockOnSearchChange).toHaveBeenCalledWith('test query');
  });

  it('should show clear button when search query is not empty', () => {
    const mockOnSearchChange = jest.fn();
    const { getByText } = render(
      <BaseListScreen
        data={mockItems}
        renderItem={mockRenderItem}
        keyExtractor={mockKeyExtractor}
        onSearchChange={mockOnSearchChange}
        searchQuery="test"
      />
    );

    expect(getByText('✕')).toBeTruthy();
  });

  it('should clear search when clear button is pressed', () => {
    const mockOnSearchChange = jest.fn();
    const { getByText } = render(
      <BaseListScreen
        data={mockItems}
        renderItem={mockRenderItem}
        keyExtractor={mockKeyExtractor}
        onSearchChange={mockOnSearchChange}
        searchQuery="test"
      />
    );

    fireEvent.press(getByText('✕'));
    expect(mockOnSearchChange).toHaveBeenCalledWith('');
  });

  it('should not show clear button when search query is empty', () => {
    const mockOnSearchChange = jest.fn();
    const { queryByText } = render(
      <BaseListScreen
        data={mockItems}
        renderItem={mockRenderItem}
        keyExtractor={mockKeyExtractor}
        onSearchChange={mockOnSearchChange}
        searchQuery=""
      />
    );

    expect(queryByText('✕')).toBeNull();
  });

  it('should render ListHeaderComponent when provided', () => {
    const headerComponent = <Text>List Header</Text>;
    const { getByText } = render(
      <BaseListScreen
        data={mockItems}
        renderItem={mockRenderItem}
        keyExtractor={mockKeyExtractor}
        ListHeaderComponent={headerComponent}
      />
    );

    expect(getByText('List Header')).toBeTruthy();
  });

  it('should use default search placeholder when not provided', () => {
    const mockOnSearchChange = jest.fn();
    const { getByPlaceholderText } = render(
      <BaseListScreen
        data={mockItems}
        renderItem={mockRenderItem}
        keyExtractor={mockKeyExtractor}
        onSearchChange={mockOnSearchChange}
      />
    );

    expect(getByPlaceholderText('Search...')).toBeTruthy();
  });
});
