import type { PinoLogger } from 'nestjs-pino';
import { Resend } from 'resend';
import { ResendEmailAdapter } from './resend-email.adapter';

jest.mock('resend', () => ({
  Resend: jest.fn(),
}));

describe('ResendEmailAdapter', () => {
  let adapter: ResendEmailAdapter;
  let logger: jest.Mocked<Pick<PinoLogger, 'setContext' | 'info' | 'error'>>;
  let sendMock: jest.Mock;

  const emailPayload = {
    to: 'test@example.com',
    subject: 'Test subject',
    html: '<p>Hello</p>',
  };

  beforeEach(() => {
    sendMock = jest.fn().mockResolvedValue({ data: { id: 'resend-id-1' }, error: null });

    (Resend as unknown as jest.Mock).mockImplementation(() => ({
      emails: {
        send: sendMock,
      },
    }));

    logger = {
      setContext: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    };

    adapter = new ResendEmailAdapter(logger as PinoLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should set logger context in constructor', () => {
    expect(logger.setContext).toHaveBeenCalledWith(ResendEmailAdapter.name);
  });

  it('should send email through Resend', async () => {
    await expect(
      adapter.send(emailPayload, { apiKey: 'resend-key' }, 'no-reply@example.com'),
    ).resolves.toBeUndefined();

    expect(Resend).toHaveBeenCalledWith('resend-key');
    expect(sendMock).toHaveBeenCalledWith({
      from: 'no-reply@example.com',
      to: emailPayload.to,
      subject: emailPayload.subject,
      html: emailPayload.html,
    });

    expect(logger.info).toHaveBeenCalledWith(
      { id: 'resend-id-1' },
      'Email sent successfully through Resend',
    );
  });

  it('should reuse client when api key has not changed', async () => {
    await adapter.send(emailPayload, { apiKey: 'resend-key' }, 'no-reply@example.com');
    await adapter.send(emailPayload, { apiKey: 'resend-key' }, 'no-reply@example.com');

    expect(Resend).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledTimes(2);
  });

  it('should recreate client when api key changes', async () => {
    await adapter.send(emailPayload, { apiKey: 'resend-key-1' }, 'no-reply@example.com');
    await adapter.send(emailPayload, { apiKey: 'resend-key-2' }, 'no-reply@example.com');

    expect(Resend).toHaveBeenCalledTimes(2);
  });

  it('should throw when resend returns API error', async () => {
    sendMock.mockResolvedValue({
      data: null,
      error: { message: 'Rejected by provider' },
    });

    await expect(
      adapter.send(emailPayload, { apiKey: 'resend-key' }, 'no-reply@example.com'),
    ).rejects.toThrow('Email delivery failed: Rejected by provider');

    expect(logger.error).toHaveBeenCalledWith(
      { error: { message: 'Rejected by provider' } },
      'Failed to send email through Resend',
    );
  });

  it('should log and rethrow unexpected errors', async () => {
    const error = new Error('network down');
    sendMock.mockRejectedValue(error);

    await expect(
      adapter.send(emailPayload, { apiKey: 'resend-key' }, 'no-reply@example.com'),
    ).rejects.toThrow(error);

    expect(logger.error).toHaveBeenCalledWith(error, 'Unexpected error while sending email');
  });
});
