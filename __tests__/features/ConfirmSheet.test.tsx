import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ConfirmSheet } from '@/features/pending/ConfirmSheet';

const tx = { id: 't1', amount: 5000, type: 'debit', date: 1, payee: 'SWIGGY' } as any;

test('confirm button disabled until category+subcategory selected', async () => {
  const onConfirm = jest.fn();
  await render(
    <ConfirmSheet
      tx={tx}
      categories={[{ id: 'c1', name: 'Food', icon: '🍽️', isDefault: true }]}
      subcategoriesFor={() => [{ id: 's1', categoryId: 'c1', name: 'Dining', isDefault: true }]}
      onConfirm={onConfirm}
      onDiscard={() => {}}
    />,
  );

  // Gate holds — confirm not called when disabled
  await fireEvent.press(screen.getByTestId('confirm-btn'));
  expect(onConfirm).not.toHaveBeenCalled();

  // Select category
  await fireEvent.press(screen.getByTestId('cat-c1'));

  // After selecting category, subcategory should render
  const subBtn = await screen.findByTestId('sub-s1');
  await fireEvent.press(subBtn);

  // Now confirm should work
  await fireEvent.press(screen.getByTestId('confirm-btn'));
  expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 'c1', subcategoryId: 's1' }));
}, 15000);
