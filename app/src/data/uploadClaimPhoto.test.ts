import { uploadClaimPhoto } from './uploadClaimPhoto';

const mockUpload = jest.fn();
const mockGetPublicUrl = jest.fn();
const mockEq = jest.fn();
const mockUpdate = jest.fn(() => ({ eq: mockEq }));

jest.mock('../../utils/supabase', () => ({
  supabase: {
    storage: { from: () => ({ upload: mockUpload, getPublicUrl: mockGetPublicUrl }) },
    from: () => ({ update: mockUpdate }),
  },
}));

const bytes = new Uint8Array([0xff, 0xd8, 0xff]).buffer;

beforeEach(() => {
  jest.clearAllMocks();
  globalThis.fetch = jest.fn(async () => ({ ok: true, arrayBuffer: async () => bytes })) as unknown as typeof fetch;
  mockUpload.mockResolvedValue({ error: null });
  mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://x.supabase.co/storage/v1/object/public/photos/c1.jpg' } });
  mockEq.mockResolvedValue({ error: null });
});

describe('uploadClaimPhoto', () => {
  it('puts the JPEG at <claimId>.jpg and stores its public URL on the claim', async () => {
    await uploadClaimPhoto('c1', 'file:///tmp/shot.jpg');
    expect(globalThis.fetch).toHaveBeenCalledWith('file:///tmp/shot.jpg');
    expect(mockUpload).toHaveBeenCalledWith('c1.jpg', bytes, { contentType: 'image/jpeg', upsert: true });
    expect(mockUpdate).toHaveBeenCalledWith({ photo_url: 'https://x.supabase.co/storage/v1/object/public/photos/c1.jpg' });
    expect(mockEq).toHaveBeenCalledWith('id', 'c1');
  });
  it('rejects when the upload fails and never touches the claim', async () => {
    mockUpload.mockResolvedValue({ error: new Error('bucket missing') });
    await expect(uploadClaimPhoto('c1', 'file:///tmp/shot.jpg')).rejects.toThrow('bucket missing');
    expect(mockUpdate).not.toHaveBeenCalled();
  });
  it('rejects when the claim update fails', async () => {
    mockEq.mockResolvedValue({ error: new Error('row gone') });
    await expect(uploadClaimPhoto('c1', 'file:///tmp/shot.jpg')).rejects.toThrow('row gone');
  });
});
