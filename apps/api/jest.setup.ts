// Global Jest setup for @learning-system/api

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_1234567890123456';
process.env.GEMINI_API_KEY = 'test_gemini_api_key';

jest.mock('./src/lib/redis', () => ({
  __esModule: true,
  default: {
    isOpen: false,
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setEx: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(-1),
    on: jest.fn(),
  },
  isConnected: false,
}));
