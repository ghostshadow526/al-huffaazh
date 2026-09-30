export interface SchoolClass {
  id: string;
  name: string;
  category: 'Kindergarten' | 'Nursery' | 'Basic (Primary)' | 'Junior Secondary' | 'Senior Secondary';
}

export const SCHOOL_CLASSES: SchoolClass[] = [
  // Kindergarten
  { id: 'kg-1', name: 'KG 1', category: 'Kindergarten' },
  { id: 'kg-2-a', name: 'KG 2 A', category: 'Kindergarten' },
  { id: 'kg-2-b', name: 'KG 2 B', category: 'Kindergarten' },

  // Nursery
  { id: 'nur-1-a', name: 'Nursery 1 A', category: 'Nursery' },
  { id: 'nur-1-b', name: 'Nursery 1 B', category: 'Nursery' },
  { id: 'nur-1-c', name: 'Nursery 1 C', category: 'Nursery' },
  { id: 'nur-2-a', name: 'Nursery 2 A', category: 'Nursery' },
  { id: 'nur-2-b', name: 'Nursery 2 B', category: 'Nursery' },
  { id: 'nur-2-c', name: 'Nursery 2 C', category: 'Nursery' },
  { id: 'nur-3-a', name: 'Nursery 3 A', category: 'Nursery' },
  { id: 'nur-3-b', name: 'Nursery 3 B', category: 'Nursery' },
  { id: 'nur-3-c', name: 'Nursery 3 C', category: 'Nursery' },

  // Basic (Primary)
  { id: 'basic-1-a', name: 'Basic 1 A', category: 'Basic (Primary)' },
  { id: 'basic-1-b', name: 'Basic 1 B', category: 'Basic (Primary)' },
  { id: 'basic-1-c', name: 'Basic 1 C', category: 'Basic (Primary)' },
  { id: 'basic-2-a', name: 'Basic 2 A', category: 'Basic (Primary)' },
  { id: 'basic-2-b', name: 'Basic 2 B', category: 'Basic (Primary)' },
  { id: 'basic-2-c', name: 'Basic 2 C', category: 'Basic (Primary)' },
  { id: 'basic-3-a', name: 'Basic 3 A', category: 'Basic (Primary)' },
  { id: 'basic-3-b', name: 'Basic 3 B', category: 'Basic (Primary)' },
  { id: 'basic-4-a', name: 'Basic 4 A', category: 'Basic (Primary)' },
  { id: 'basic-4-b', name: 'Basic 4 B', category: 'Basic (Primary)' },
  { id: 'basic-5', name: 'Basic 5', category: 'Basic (Primary)' },

  // Junior Secondary
  { id: 'jss-1-a', name: 'JSS 1 A', category: 'Junior Secondary' },
  { id: 'jss-1-b', name: 'JSS 1 B', category: 'Junior Secondary' },
  { id: 'jss-2-a', name: 'JSS 2 A', category: 'Junior Secondary' },
  { id: 'jss-2-b', name: 'JSS 2 B', category: 'Junior Secondary' },
  { id: 'jss-3-a', name: 'JSS 3 A', category: 'Junior Secondary' },
  { id: 'jss-3-b', name: 'JSS 3 B', category: 'Junior Secondary' },
  { id: 'jss-3', name: 'JSS 3 (Single Class)', category: 'Junior Secondary' },

  // Senior Secondary
  { id: 'ss-1-a', name: 'SS 1 A', category: 'Senior Secondary' },
  { id: 'ss-1-b', name: 'SS 1 B', category: 'Senior Secondary' },
  { id: 'ss-2-a', name: 'SS 2 A', category: 'Senior Secondary' },
  { id: 'ss-2-b', name: 'SS 2 B', category: 'Senior Secondary' },
  { id: 'ss-3-a', name: 'SS 3 A', category: 'Senior Secondary' },
  { id: 'ss-3-b', name: 'SS 3 B', category: 'Senior Secondary' },
];

export const CLASS_CATEGORIES: SchoolClass['category'][] = [
  'Kindergarten',
  'Nursery',
  'Basic (Primary)',
  'Junior Secondary',
  'Senior Secondary',
];
