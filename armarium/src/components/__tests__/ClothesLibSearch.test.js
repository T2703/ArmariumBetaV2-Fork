import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import AddClothesPage from '../clothing/ClothesLibSearch';
import { getFirestore, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Mocks
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(() => 'mocked-timestamp'),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
}));

jest.mock('../Navbar', () => () => <div>Navbar</div>);

beforeEach(() => {
  jest.clearAllMocks();
  global.alert = jest.fn();

  getAuth.mockReturnValue({
    currentUser: { uid: 'mockUserId' },
  });

  getFirestore.mockReturnValue({});

  collection.mockImplementation((db, path) => path);

  getDocs.mockImplementation((path) => {
    if (path === 'DefaultItemCollection') {
      return Promise.resolve({
        docs: [{ id: 'tops' }],
      });
    }
    if (path === 'DefaultItemCollection/tops/Items') {
      return Promise.resolve({
        docs: [
          {
            id: 'item1',
            data: () => ({
              title: 'Blue Shirt',
              url: 'http://img.url/blue.jpg',
              color: 'blue',
              tags: ['cotton', 'summer'],
            }),
          },
          {
            id: 'item2',
            data: () => ({
              title: 'Black Pants',
              url: 'http://img.url/black.jpg',
              color: 'black',
              tags: ['winter'],
            }),
          },
        ],
      });
    }
    return Promise.resolve({ docs: [] });
  });

  addDoc.mockResolvedValue({});
});

describe('AddClothesPage', () => {
  test('renders items and allows selection', async () => {
    await act(async () => {
      render(<AddClothesPage />);
    });

    expect(await screen.findByText('Blue Shirt')).toBeInTheDocument();
    expect(screen.getByText('Black Pants')).toBeInTheDocument();

    const card = screen.getByText('Blue Shirt').closest('.card');
    fireEvent.click(card);
    expect(card).toHaveClass('selected');
  });

  test('adds selected items on button click', async () => {
    await act(async () => {
      render(<AddClothesPage />);
    });

    const card = screen.getByText('Blue Shirt').closest('.card');
    fireEvent.click(card);
    fireEvent.click(screen.getByText('Add Selected Items'));

    await waitFor(() => expect(addDoc).toHaveBeenCalledTimes(1));
    expect(addDoc).toHaveBeenCalledWith(
      expect.stringContaining('Users/mockUserId/ItemsCollection/top/items'),
      expect.objectContaining({
        title: 'Blue Shirt',
        url: 'http://img.url/blue.jpg',
        color: 'blue',
        tags: ['cotton', 'summer'],
        createdAt: 'mocked-timestamp',
      })
    );
    expect(alert).toHaveBeenCalledWith('Items successfully added to your wardrobe.');
  });

  test('shows alert when no items are selected', async () => {
    await act(async () => {
      render(<AddClothesPage />);
    });

    fireEvent.click(screen.getByText('Add Selected Items'));

    await waitFor(() => {
      expect(alert).toHaveBeenCalledWith('No items selected.');
    });
  });

  test('shows alert if user is not authenticated', async () => {
    getAuth.mockReturnValueOnce({ currentUser: null });

    await act(async () => {
      render(<AddClothesPage />);
    });

    const card = screen.getByText('Blue Shirt').closest('.card');
    fireEvent.click(card);
    fireEvent.click(screen.getByText('Add Selected Items'));

    await waitFor(() => {
      expect(alert).toHaveBeenCalledWith('You must be logged in to add items.');
    });
  });
});
