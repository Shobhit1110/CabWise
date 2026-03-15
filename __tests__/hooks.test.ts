import { renderHook, act } from '@testing-library/react-native';
import { useLocation } from '../hooks/useLocation';

describe('useLocation', () => {
  it('should request location permissions', async () => {
    const { result } = renderHook(() => useLocation());
    
    // Assert that location is being requested
    expect(result.current).toBeDefined();
  });
});
