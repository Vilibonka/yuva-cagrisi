import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter!: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    this.initTransporter();
  }

  private async initTransporter() {
    try {
      // Create a test account dynamically using Ethereal
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass, // generated ethereal password
        },
      });
      
      this.logger.log('Nodemailer test (Ethereal) transporter initialized.');
    } catch (error) {
      this.logger.error('Failed to initialize nodemailer transporter', error);
    }
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<string | null> {
    if (!this.transporter) {
      this.logger.error('Transporter not initialized. Cannot send email.');
      return null;
    }

    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;

    try {
      const info = await this.transporter.sendMail({
        from: '"Bir Yuva Bir Dost" <noreply@biryuvabirdost.com>',
        to,
        subject: 'Şifre Sıfırlama Talebi',
        text: `Şifrenizi sıfırlamak için lütfen bu bağlantıya tıklayın: ${resetUrl}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f97316;">Şifre Sıfırlama Talebi</h2>
            <p>Merhaba,</p>
            <p>Hesabınızın şifresini sıfırlamak için bir talep aldık. Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Şifremi Sıfırla</a>
            </div>
            <p>Eğer butona tıklayamıyorsanız, şu bağlantıyı kopyalayıp tarayıcınıza yapıştırın:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p style="color: #666; font-size: 12px; margin-top: 40px;">Bu talebi siz yapmadıysanız lütfen bu e-postayı dikkate almayın.</p>
          </div>
        `,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      this.logger.log(`Password reset email sent to ${to}. Message ID: ${info.messageId}`);
      this.logger.log(`Preview URL: ${previewUrl}`);
      return previewUrl ? String(previewUrl) : null;
    } catch (error) {
      this.logger.error('Error sending password reset email', error);
      throw error;
    }
  }
}
