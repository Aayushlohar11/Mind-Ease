declare module 'nodemailer' {
  export interface Transporter {
    sendMail(mailOptions: any): Promise<any>
  }
  export function createTransport(options: any): Transporter
}
