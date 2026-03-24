import { useShoppingStore } from '../shoppingStore';

beforeEach(() => {
  useShoppingStore.setState({ items: [] });
});

describe('useShoppingStore', () => {
  it('should initialize with empty items', () => {
    expect(useShoppingStore.getState().items).toEqual([]);
  });

  it('should populate items from diet meals', () => {
    useShoppingStore.getState().setFromDiet([
      { horario: '07:00', nome: 'Café', alimentos: ['Ovo', 'Pão'] },
      { horario: '12:00', nome: 'Almoço', alimentos: ['Frango', 'Arroz'] },
    ]);
    expect(useShoppingStore.getState().items).toHaveLength(4);
  });

  it('should deduplicate foods across meals', () => {
    useShoppingStore.getState().setFromDiet([
      { horario: '07:00', nome: 'Café', alimentos: ['Ovo', 'Pão'] },
      { horario: '12:00', nome: 'Almoço', alimentos: ['Ovo', 'Arroz'] },
    ]);
    expect(useShoppingStore.getState().items).toHaveLength(3);
  });

  it('should toggle checked state', () => {
    useShoppingStore.getState().setFromDiet([
      { horario: '07:00', nome: 'Café', alimentos: ['Ovo'] },
    ]);
    const id = useShoppingStore.getState().items[0].id;
    useShoppingStore.getState().toggleItem(id);
    expect(useShoppingStore.getState().items[0].checked).toBe(true);
    useShoppingStore.getState().toggleItem(id);
    expect(useShoppingStore.getState().items[0].checked).toBe(false);
  });

  it('should report progress correctly', () => {
    useShoppingStore.getState().setFromDiet([
      { horario: '07:00', nome: 'Café', alimentos: ['Ovo', 'Pão'] },
    ]);
    const id = useShoppingStore.getState().items[0].id;
    useShoppingStore.getState().toggleItem(id);
    const { checked, total } = useShoppingStore.getState().getProgress();
    expect(checked).toBe(1);
    expect(total).toBe(2);
  });

  it('should clear all items', () => {
    useShoppingStore.getState().setFromDiet([
      { horario: '07:00', nome: 'Café', alimentos: ['Ovo', 'Pão'] },
    ]);
    useShoppingStore.getState().clearAll();
    expect(useShoppingStore.getState().items).toEqual([]);
  });
});
