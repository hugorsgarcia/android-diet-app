import { useFastingStore } from '../fastingStore';

beforeEach(() => {
  useFastingStore.setState({
    isFasting: false,
    currentPlan: null,
    startTime: null,
    endTime: null,
    history: [],
  });
  jest.restoreAllMocks();
});

describe('useFastingStore', () => {
  it('should initialize with isFasting=false', () => {
    expect(useFastingStore.getState().isFasting).toBe(false);
  });

  it('should start fasting with 16:8 plan', () => {
    useFastingStore.getState().startFasting('16:8');
    const s = useFastingStore.getState();
    expect(s.isFasting).toBe(true);
    expect(s.currentPlan).toBe('16:8');
  });

  it('should set endTime 16h after startTime for 16:8', () => {
    const now = new Date('2026-03-24T20:00:00Z');
    jest.spyOn(Date, 'now').mockReturnValue(now.getTime());
    useFastingStore.getState().startFasting('16:8');
    const s = useFastingStore.getState();
    const diff = (new Date(s.endTime!).getTime() - new Date(s.startTime!).getTime()) / 3600000;
    expect(diff).toBe(16);
  });

  it('should set endTime 14h for 14:10', () => {
    const now = new Date('2026-03-24T20:00:00Z');
    jest.spyOn(Date, 'now').mockReturnValue(now.getTime());
    useFastingStore.getState().startFasting('14:10');
    const s = useFastingStore.getState();
    const diff = (new Date(s.endTime!).getTime() - new Date(s.startTime!).getTime()) / 3600000;
    expect(diff).toBe(14);
  });

  it('should not restart if already fasting', () => {
    const now = new Date('2026-03-24T20:00:00Z');
    jest.spyOn(Date, 'now').mockReturnValue(now.getTime());
    useFastingStore.getState().startFasting('16:8');
    const t1 = useFastingStore.getState().startTime;
    useFastingStore.getState().startFasting('14:10');
    expect(useFastingStore.getState().startTime).toBe(t1);
  });

  it('should stop fasting and add to history', () => {
    useFastingStore.getState().startFasting('16:8');
    useFastingStore.getState().stopFasting();
    const s = useFastingStore.getState();
    expect(s.isFasting).toBe(false);
    expect(s.history).toHaveLength(1);
    expect(s.history[0].plan).toBe('16:8');
  });

  it('should calculate remaining ms', () => {
    const now = new Date('2026-03-24T20:00:00Z');
    jest.spyOn(Date, 'now').mockReturnValue(now.getTime());
    useFastingStore.getState().startFasting('16:8');
    // Avança 2 horas
    jest.spyOn(Date, 'now').mockReturnValue(now.getTime() + 2 * 3600000);
    expect(useFastingStore.getState().getRemainingMs()).toBe(14 * 3600000);
  });

  it('should restore from Firestore', () => {
    useFastingStore.getState().setFromFirestore({
      isFasting: true,
      currentPlan: '12:12',
      startTime: '2026-03-24T08:00:00Z',
      endTime: '2026-03-24T20:00:00Z',
      history: [{ plan: '16:8', startTime: 'x', endTime: 'y', completed: true }],
    });
    expect(useFastingStore.getState().isFasting).toBe(true);
    expect(useFastingStore.getState().history).toHaveLength(1);
  });
});
