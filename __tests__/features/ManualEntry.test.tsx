import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { TransactionForm } from '@/features/ledger/TransactionForm';

test('save disabled until amount + category + subcategory present', async () => {
  const onSave = jest.fn();
  await render(
    <TransactionForm
      categories={[{ id: 'c1', name: 'Food', icon: '🍽️', isDefault: true }]}
      subcategoriesFor={() => [{ id: 's1', categoryId: 'c1', name: 'Dining', isDefault: true }]}
      onSave={onSave}
    />,
  );

  // Gate holds when no amount
  await fireEvent.press(screen.getByTestId('save-btn'));
  expect(onSave).not.toHaveBeenCalled();

  // Fill amount
  await fireEvent.changeText(screen.getByTestId('amount-input'), '123.45');
  await fireEvent.press(screen.getByTestId('type-debit'));
  await fireEvent.press(screen.getByTestId('cat-c1'));
  await screen.findByTestId('sub-s1');
  await fireEvent.press(screen.getByTestId('sub-s1'));

  // Now save should work
  await fireEvent.press(screen.getByTestId('save-btn'));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ amount: 12345, type: 'debit', categoryId: 'c1', subcategoryId: 's1' }));
}, 15000);
