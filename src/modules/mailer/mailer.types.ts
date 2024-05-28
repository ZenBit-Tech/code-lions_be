export interface SendMailArgs {
  receiverEmail: string;
  subject: string;
  templateName: string;
  context: Record<string, unknown>;
}
