import { ProgressHandler } from '../src/services/progress-handler';

describe('ProgressHandler', () => {
  // Suppress console output during tests
  const originalConsoleLog = console.log;
  
  beforeAll(() => {
    console.log = () => {};
  });

  afterAll(() => {
    console.log = originalConsoleLog;
  });

  describe('constructor', () => {
    it('should create progress handler with total', () => {
      const progress = new ProgressHandler({ total: 10 });
      
      expect(progress).toBeDefined();
      expect(progress.getCompleted()).toBe(0);
      
      progress.stop();
    });

    it('should create progress handler with custom format', () => {
      const customFormat = 'Custom |{bar}| {value}/{total}';
      const progress = new ProgressHandler({ 
        total: 20, 
        format: customFormat 
      });

      expect(progress).toBeDefined();
      expect(progress.getCompleted()).toBe(0);
      
      progress.stop();
    });
  });

  describe('increment', () => {
    it('should increment progress by one', () => {
      const progress = new ProgressHandler({ total: 10 });
      
      progress.increment();
      
      expect(progress.getCompleted()).toBe(1);
      
      progress.stop();
    });

    it('should increment multiple times correctly', () => {
      const progress = new ProgressHandler({ total: 10 });
      
      progress.increment();
      progress.increment();
      progress.increment();
      
      expect(progress.getCompleted()).toBe(3);
      
      progress.stop();
    });
  });

  describe('update', () => {
    it('should update progress to specific value', () => {
      const progress = new ProgressHandler({ total: 100 });
      
      progress.update(50);
      
      expect(progress.getCompleted()).toBe(50);
      
      progress.stop();
    });

    it('should update progress multiple times', () => {
      const progress = new ProgressHandler({ total: 100 });
      
      progress.update(25);
      expect(progress.getCompleted()).toBe(25);
      
      progress.update(50);
      expect(progress.getCompleted()).toBe(50);
      
      progress.update(75);
      expect(progress.getCompleted()).toBe(75);
      
      progress.stop();
    });
  });

  describe('stop', () => {
    it('should stop the progress bar', () => {
      const progress = new ProgressHandler({ total: 10 });
      
      expect(() => progress.stop()).not.toThrow();
    });

    it('should be safe to call stop multiple times', () => {
      const progress = new ProgressHandler({ total: 10 });
      
      expect(() => {
        progress.stop();
        progress.stop();
      }).not.toThrow();
    });
  });

  describe('getCompleted', () => {
    it('should return 0 initially', () => {
      const progress = new ProgressHandler({ total: 10 });
      
      expect(progress.getCompleted()).toBe(0);
      
      progress.stop();
    });

    it('should return correct count after increments', () => {
      const progress = new ProgressHandler({ total: 10 });
      
      progress.increment();
      expect(progress.getCompleted()).toBe(1);
      
      progress.increment();
      expect(progress.getCompleted()).toBe(2);
      
      progress.increment();
      expect(progress.getCompleted()).toBe(3);
      
      progress.stop();
    });

    it('should return correct value after update', () => {
      const progress = new ProgressHandler({ total: 100 });
      
      progress.update(50);
      expect(progress.getCompleted()).toBe(50);
      
      progress.update(75);
      expect(progress.getCompleted()).toBe(75);
      
      progress.stop();
    });

    it('should track mixed increment and update calls', () => {
      const progress = new ProgressHandler({ total: 100 });
      
      progress.increment();
      progress.increment();
      expect(progress.getCompleted()).toBe(2);
      
      progress.update(10);
      expect(progress.getCompleted()).toBe(10);
      
      progress.increment();
      expect(progress.getCompleted()).toBe(11);
      
      progress.stop();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete workflow', () => {
      const progress = new ProgressHandler({ total: 5 });
      
      for (let i = 0; i < 5; i++) {
        progress.increment();
      }
      
      expect(progress.getCompleted()).toBe(5);
      
      progress.stop();
    });

    it('should handle early termination', () => {
      const progress = new ProgressHandler({ total: 10 });
      
      progress.increment();
      progress.increment();
      progress.increment();
      
      expect(progress.getCompleted()).toBe(3);
      
      progress.stop();
    });

    it('should handle zero progress', () => {
      const progress = new ProgressHandler({ total: 10 });
      
      expect(progress.getCompleted()).toBe(0);
      
      progress.stop();
    });
  });
});
