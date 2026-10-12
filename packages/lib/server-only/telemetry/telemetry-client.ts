/** 0xDocHub self-hosted telemetry is disabled independently of environment keys. */
export class TelemetryClient {
  public static async start(): Promise<void> {}

  public static async stop(): Promise<void> {}
}
