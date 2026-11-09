import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('MAIL_HOST');
    const port = Number(this.configService.get<string>('MAIL_PORT') ?? 587);
    const user = this.configService.get<string>('MAIL_USER');
    const password = this.configService.get<string>('MAIL_PASSWORD');

    if (!host || !user || !password || !Number.isFinite(port)) {
      throw new Error('Email SMTP configuration is missing or invalid');
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass: password,
      },
    });
  }

  // Send company admin login credentials
  async sendCompanyAdminCredentials(
    name: string,
    email: string,
    temporaryPassword: string,
    companyName: string,
  ): Promise<void> {
    const from = this.configService.get<string>('MAIL_FROM');

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ??
      'http://localhost:3001';

    if (!from) {
      throw new Error('MAIL_FROM is not configured');
    }

    try {
      await this.transporter.sendMail({
        from,
        to: email,
        subject: 'Your Company Admin account',

        text: [
          `Hello ${name},`,
          '',
          `Your Company Admin account for ${companyName} has been created.`,
          `Login email: ${email}`,
          `Temporary password: ${temporaryPassword}`,
          '',
          `Login here: ${frontendUrl}/login`,
          '',
          'You must change your temporary password after your first login.',
          'Do not share these credentials with anyone.',
        ].join('\n'),

        html: `
          <p>Hello ${this.escapeHtml(name)},</p>

          <p>
            Your Company Admin account for
            <strong>${this.escapeHtml(companyName)}</strong>
            has been created.
          </p>

          <p>
            <strong>Login email:</strong>
            ${this.escapeHtml(email)}
          </p>

          <p>
            <strong>Temporary password:</strong>
            <code>${this.escapeHtml(temporaryPassword)}</code>
          </p>

          <p>
            <a href="${this.escapeHtml(frontendUrl)}/login">
              Log in to your account
            </a>
          </p>

          <p>
            You must change your temporary password after your first login.
            Do not share these credentials with anyone.
          </p>
        `,
      });
    } catch {
      throw new InternalServerErrorException(
        'The account could not be emailed. Use the secure fallback process to deliver credentials.',
      );
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(
  name: string,
  email: string,
  resetToken: string,
): Promise<void> {
  const from = this.configService.get<string>('MAIL_FROM');
  const frontendUrl =
    this.configService.get<string>('FRONTEND_URL') ??
    'http://localhost:3001';

  if (!from) {
    throw new Error('MAIL_FROM is not configured');
  }

  const resetUrl =
    `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

  try {
    await this.transporter.sendMail({
      from,
      to: email,
      subject: 'Reset Your CareerHub Password',
      text: [
        `Hello ${name},`,
        '',
        'We received a request to reset your CareerHub password.',
        '',
        `Reset your password using this link: ${resetUrl}`,
        '',
        'This link expires in 30 minutes.',
        'If you did not request this reset, you can ignore this email.',
      ].join('\n'),
      html: `
        <p>Hello ${this.escapeHtml(name)},</p>
        <p>We received a request to reset your CareerHub password.</p>
        <p>
          <a href="${this.escapeHtml(resetUrl)}">
            Reset your password
          </a>
        </p>
        <p>This link expires in 30 minutes.</p>
        <p>If you did not request this reset, you can ignore this email.</p>
      `,
    });
  } catch {
    throw new InternalServerErrorException(
      'Password reset email could not be sent.',
    );
  }
}

  // Escape HTML special characters
  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => {
      const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      };

      return entities[character];
    });
  }
}
