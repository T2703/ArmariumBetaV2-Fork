import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditClothing from '../clothing/EditClothing';
import { useParams } from 'react-router-dom';
import { getDoc, updateDoc, deleteDoc, setDoc, doc } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';
import { auth } from '../backend/firebaseConfig';

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
}));
jest.mock('firebase/analytics', () => ({
  logEvent: jest.fn(),
}));
jest.mock('../backend/firebaseConfig', () => ({
  db: {},
  analytics: {},
  auth: {
    currentUser: { uid: 'testUserId' },
  },
}));
jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));
jest.mock('../Navbar', () => () => <div>Navbar</div>);

describe('EditClothing Component', () => {
  beforeEach(() => {
    useParams.mockReturnValue({ clothingId: 'item123', type: 'top' });
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        url: 'http://image.url/clothing.jpg',
        tags: ['summer', 'cotton'],
        title: 'Blue Shirt',
      }),
    });
    doc.mockImplementation((...args) => args.join('/'));
  });

  test('renders clothing data', async () => {
    render(<EditClothing />);
    await waitFor(() => {
      expect(screen.getByText('Current Tags:')).toBeInTheDocument();
    });
    expect(screen.getByAltText('Clothing')).toHaveAttribute('src', 'http://image.url/clothing.jpg');
    expect(screen.getByDisplayValue('summer, cotton')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Blue Shirt')).toBeInTheDocument();
  });

  test('updates tags on button click', async () => {
    render(<EditClothing />);
    await waitFor(() => screen.getByText('Current Tags:'));

    fireEvent.change(screen.getByPlaceholderText(/enter new tags/i), {
      target: { value: 'casual, new' },
    });

    fireEvent.click(screen.getByRole('button', { name: /update tags/i }));

    await waitFor(() => expect(updateDoc).toHaveBeenCalled());
    expect(logEvent).toHaveBeenCalledWith(expect.anything(), 'tags_updated', {
      clothing_id: 'item123',
      type: 'top',
      new_tags: ['casual', 'new'],
    });
  });

  test('updates title on button click', async () => {
    render(<EditClothing />);
    await waitFor(() => screen.getByText('Current Tags:'));

    fireEvent.change(screen.getByPlaceholderText(/enter a new title/i), {
      target: { value: 'White Shirt' },
    });

    fireEvent.click(screen.getByRole('button', { name: /update title/i }));

    await waitFor(() => expect(updateDoc).toHaveBeenCalled());
    expect(logEvent).toHaveBeenCalledWith(expect.anything(), 'title_updated', {
      clothing_id: 'item123',
      type: 'top',
      new_title: 'White Shirt',
    });
  });

  test('moves item to a new type', async () => {
    render(<EditClothing />);
    await waitFor(() => screen.getByText('Current Tags:'));

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'bottom' },
    });

    fireEvent.click(screen.getByRole('button', { name: /update type/i }));

    await waitFor(() => expect(setDoc).toHaveBeenCalled());
    expect(deleteDoc).toHaveBeenCalled();
    expect(logEvent).toHaveBeenCalledWith(expect.anything(), 'type_updated', {
      clothing_id: 'item123',
      old_type: 'top',
      new_type: 'bottom',
    });
  });
});
