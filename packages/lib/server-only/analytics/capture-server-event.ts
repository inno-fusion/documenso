type CaptureServerEventOptions = {
  event: string;

  /**
   * The authenticated user this event belongs to, if any.
   *
   * Used as the distinct ID so server events line up with client-side
   * identified users. Anonymous events (e.g. embed signer sessions) get a
   * random distinct ID instead.
   */
  userId?: number;
  organisationId?: string;
  teamId?: number;
  properties?: Record<string, unknown>;
};

/** 0xDocHub does not send document or user analytics to external services. */
export const captureServerEvent = (options: CaptureServerEventOptions): void => {
  void options;
};
