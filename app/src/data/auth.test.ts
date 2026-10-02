import { supabase } from '../../utils/supabase';
import { registerWithEmail, signInWithEmail } from './auth';

jest.mock('../../utils/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
    },
  },
}));

const signUp = jest.mocked(supabase.auth.signUp);
const signInWithPassword = jest.mocked(supabase.auth.signInWithPassword);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('registerWithEmail', () => {
  it('registers with trimmed email and persists the display name as auth metadata', async () => {
    signUp.mockResolvedValue({
      data: { user: { id: 'u1' } as never, session: { access_token: 'token' } as never },
      error: null,
    });

    await expect(registerWithEmail(' player@example.com ', 'password123', ' Linz Player ')).resolves.toBe(true);
    expect(signUp).toHaveBeenCalledWith({
      email: 'player@example.com',
      password: 'password123',
      options: { data: { display_name: 'Linz Player' } },
    });
  });

  it('reports when email confirmation is required before a session is issued', async () => {
    signUp.mockResolvedValue({
      data: { user: { id: 'u1' } as never, session: null },
      error: null,
    });
    await expect(registerWithEmail('player@example.com', 'password123', 'Linz Player')).resolves.toBe(false);
  });

  it('propagates Supabase registration errors', async () => {
    signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: new Error('Email already registered') as never,
    });
    await expect(registerWithEmail('player@example.com', 'password123', 'Linz Player'))
      .rejects.toThrow('Email already registered');
  });
});

describe('signInWithEmail', () => {
  it('signs in with the trimmed email and password', async () => {
    signInWithPassword.mockResolvedValue({ data: { user: {} as never, session: {} as never }, error: null });
    await expect(signInWithEmail(' player@example.com ', 'password123')).resolves.toBeUndefined();
    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'player@example.com', password: 'password123' });
  });

  it('propagates Supabase sign-in errors', async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: new Error('Invalid login credentials') as never,
    });
    await expect(signInWithEmail('player@example.com', 'wrong-password'))
      .rejects.toThrow('Invalid login credentials');
  });
});
