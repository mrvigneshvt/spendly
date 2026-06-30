// Importing this module forces Jest/Babel to transform CategoriesScreen.tsx.
// It is a guard against syntax/compile regressions in that file (a missing ')'
// previously shipped because no test compiled it).
import { CategoriesScreen } from '@/features/categories/CategoriesScreen';

test('CategoriesScreen module compiles and exports a component', () => {
  expect(typeof CategoriesScreen).toBe('function');
});
