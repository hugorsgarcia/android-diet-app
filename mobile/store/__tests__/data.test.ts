import { useDataStore } from '../data';

beforeEach(() => {
  useDataStore.getState().resetData();
});

describe('useDataStore dietType', () => {
  it('should have dietType empty by default', () => {
    expect(useDataStore.getState().user.dietType).toBe('');
  });

  it('should set dietType via setPageTwo', () => {
    useDataStore.getState().setPageTwo({
      gender: 'masculino',
      level: 'ativo',
      objective: 'emagrecer',
      dietType: 'keto',
    });
    expect(useDataStore.getState().user.dietType).toBe('keto');
  });

  it('should reset dietType on resetData', () => {
    useDataStore.getState().setPageTwo({
      gender: 'masculino',
      level: 'ativo',
      objective: 'emagrecer',
      dietType: 'vegana',
    });
    useDataStore.getState().resetData();
    expect(useDataStore.getState().user.dietType).toBe('');
  });
});
