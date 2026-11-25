import fileHandler, {
  getSafeMimeType,
  parseRange,
} from '@/pages/api/files/[id]';
import filesHandler, { isValidMimeType } from '@/pages/api/files/index';
import File from '@/models/File';

jest.mock('@/lib/mongodb', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn().mockResolvedValue({ _id: 'user-1' }),
}));
jest.mock('@/models/File', () => {
  const File = jest.fn();
  File.findOne = jest.fn();
  return { __esModule: true, default: File };
});

function createResponse() {
  const res = {
    headers: {},
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    setHeader: jest.fn((name, value) => {
      res.headers[name.toLowerCase()] = value;
    }),
  };
  return res;
}

const FILE_ID = '6b0682d5ed108c432cf4685d';
const audioBytes = Buffer.from('0123456789');
const audioDataUrl = `data:audio/mpeg;base64,${audioBytes.toString('base64')}`;

describe('getSafeMimeType', () => {
  it('allows audio and raster images inline', () => {
    expect(getSafeMimeType('audio/mpeg')).toBe('audio/mpeg');
    expect(getSafeMimeType('audio/ogg; codecs=opus')).toBe('audio/ogg');
    expect(getSafeMimeType('image/png')).toBe('image/png');
  });

  it('downgrades executable types to plain text', () => {
    for (const type of [
      'text/html',
      'image/svg+xml',
      'application/javascript',
      'application/xhtml+xml',
      '',
      undefined,
    ]) {
      expect(getSafeMimeType(type)).toBe('text/plain; charset=utf-8');
    }
  });
});

describe('parseRange', () => {
  it('parses open, closed and suffix ranges', () => {
    expect(parseRange('bytes=0-', 10)).toEqual({ start: 0, end: 9 });
    expect(parseRange('bytes=2-5', 10)).toEqual({ start: 2, end: 5 });
    expect(parseRange('bytes=-3', 10)).toEqual({ start: 7, end: 9 });
    expect(parseRange('bytes=4-999', 10)).toEqual({ start: 4, end: 9 });
  });

  it('rejects unsatisfiable or malformed ranges', () => {
    expect(parseRange('bytes=10-', 10)).toBeNull();
    expect(parseRange('bytes=5-2', 10)).toBeNull();
    expect(parseRange('bytes=-', 10)).toBeNull();
    expect(parseRange('items=0-1', 10)).toBeNull();
  });
});

describe('GET /api/files/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('streams stored audio with its real type', async () => {
    File.findOne.mockResolvedValue({ content: audioDataUrl });
    const res = createResponse();
    await fileHandler(
      { method: 'GET', query: { id: FILE_ID }, headers: {} },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.headers['content-type']).toBe('audio/mpeg');
    expect(res.headers['accept-ranges']).toBe('bytes');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.send.mock.calls[0][0].equals(audioBytes)).toBe(true);
  });

  it('only looks up files the user owns or collaborates on', async () => {
    File.findOne.mockResolvedValue(null);
    const res = createResponse();
    await fileHandler(
      { method: 'GET', query: { id: FILE_ID }, headers: {} },
      res,
    );

    expect(File.findOne).toHaveBeenCalledWith({
      _id: FILE_ID,
      $or: [{ owner: 'user-1' }, { 'collaborators.user': 'user-1' }],
    });
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('answers Range requests with 206 so seeking works', async () => {
    File.findOne.mockResolvedValue({ content: audioDataUrl });
    const res = createResponse();
    await fileHandler(
      {
        method: 'GET',
        query: { id: FILE_ID },
        headers: { range: 'bytes=2-5' },
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(206);
    expect(res.headers['content-range']).toBe('bytes 2-5/10');
    expect(res.send.mock.calls[0][0].toString()).toBe('2345');
  });

  it('returns 416 for unsatisfiable ranges', async () => {
    File.findOne.mockResolvedValue({ content: audioDataUrl });
    const res = createResponse();
    await fileHandler(
      {
        method: 'GET',
        query: { id: FILE_ID },
        headers: { range: 'bytes=50-' },
      },
      res,
    );
    expect(res.status).toHaveBeenCalledWith(416);
  });

  it('never serves stored HTML as HTML (stored XSS)', async () => {
    const html = Buffer.from('<script>alert(1)</script>').toString('base64');
    File.findOne.mockResolvedValue({
      content: `data:text/html;base64,${html}`,
    });
    const res = createResponse();
    await fileHandler(
      { method: 'GET', query: { id: FILE_ID }, headers: {} },
      res,
    );

    expect(res.headers['content-type']).toBe('text/plain; charset=utf-8');
    expect(res.headers['content-disposition']).toBe('attachment');
    expect(res.headers['content-security-policy']).toContain('sandbox');
  });

  it('ignores a spoofed mimeType on plain-text files', async () => {
    File.findOne.mockResolvedValue({
      content: '<img src=x onerror=alert(1)>',
      mimeType: 'text/html',
    });
    const res = createResponse();
    await fileHandler(
      { method: 'GET', query: { id: FILE_ID }, headers: {} },
      res,
    );
    expect(res.headers['content-type']).toBe('text/plain; charset=utf-8');
  });

  it('returns 401 instead of crashing when not signed in', async () => {
    const { verifyToken } = jest.requireMock('@/lib/auth');
    verifyToken.mockRejectedValueOnce(new Error('No token provided'));
    const res = createResponse();
    await fileHandler(
      { method: 'GET', query: { id: FILE_ID }, headers: {} },
      res,
    );
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 404 for malformed ids without querying MongoDB', async () => {
    const res = createResponse();
    await fileHandler(
      { method: 'GET', query: { id: '{"$ne":null}' }, headers: {} },
      res,
    );
    expect(res.status).toHaveBeenCalledWith(404);
    expect(File.findOne).not.toHaveBeenCalled();
  });

  it('rejects non-string ids', async () => {
    const res = createResponse();
    await fileHandler(
      { method: 'GET', query: { id: ['a', 'b'] }, headers: {} },
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(File.findOne).not.toHaveBeenCalled();
  });
});

describe('POST /api/files mimeType validation', () => {
  it('accepts normal mime types', () => {
    expect(isValidMimeType('audio/mpeg')).toBe(true);
    expect(isValidMimeType('audio/x-m4a')).toBe(true);
  });

  it('rejects header injection and non-strings', () => {
    expect(isValidMimeType('audio/mpeg\r\nSet-Cookie: x=1')).toBe(false);
    expect(isValidMimeType('text/html; charset=utf-8')).toBe(false);
    expect(isValidMimeType({ $ne: null })).toBe(false);
    expect(isValidMimeType('a'.repeat(200) + '/b')).toBe(false);
  });

  it('returns 400 for an invalid mimeType', async () => {
    const res = createResponse();
    await filesHandler(
      {
        method: 'POST',
        query: {},
        headers: {},
        body: { name: 'x.mp3', content: 'x', mimeType: '<script>' },
      },
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
