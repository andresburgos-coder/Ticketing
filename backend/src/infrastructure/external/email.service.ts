import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { Ticket } from '../../domain/entities/ticket.entity';
import * as https from 'https';

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface SendTicketEmailParams {
  buyerEmail: string;
  buyerName?: string;
  tickets: Ticket[];
  eventName: string;
  eventDate: string;
  eventLocation: string;
  eventVenueName?: string;
  eventStartTime?: string;
  eventEndTime?: string;
  eventImage?: string;
  attachments?: EmailAttachment[];
}

/**
 * EmailService
 * Servicio para envío de correos electrónicos con plantillas personalizadas
 * Configurado para usar Gmail SMTP
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter!: nodemailer.Transporter;
  private templatesPath: string;

  constructor(private readonly configService: ConfigService) {
    this.templatesPath = path.join(__dirname, '../../templates/email');
    this.initializeTransporter();
    this.registerHandlebarsHelpers();
  }

  /**
   * Inicializa el transportador de nodemailer con configuración de Gmail
   */
  private initializeTransporter(): void {
    const smtpConfig = {
      service: 'gmail', // Usar servicio predefinido de Gmail
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
    };

    console.log('📧 [EmailService] Inicializando transporter con configuración:');
    console.log('- Service: gmail');
    console.log('- User:', smtpConfig.auth.user);
    console.log('- Pass:', smtpConfig.auth.pass ? '***configurada***' : 'NO CONFIGURADA');

    this.transporter = nodemailer.createTransport(smtpConfig);

    // Verificar conexión al inicializar
    this.verifyConnection();
  }

  /**
   * Verifica la conexión SMTP
   */
  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.log('✅ Conexión SMTP verificada correctamente');
    } catch (error) {
      this.logger.error('❌ Error al verificar conexión SMTP:', error);
    }
  }

  /**
   * Genera un código QR usando un servicio externo
   */
  private async generateQRCode(data: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
      
      https.get(qrUrl, (response) => {
        const chunks: Buffer[] = [];
        
        response.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        });
        
        response.on('error', (error) => {
          this.logger.error('Error generando QR code:', error);
          reject(error);
        });
      }).on('error', (error) => {
        this.logger.error('Error en petición QR:', error);
        reject(error);
      });
    });
  }

  /**
   * Genera un PDF profesional con el diseño del ticket del frontend
   */
  private async generateTicketPDF(ticket: Ticket, eventName: string, eventDate: string, eventLocation: string): Promise<Buffer> {
    try {
      // Generar QR code para incluir en el PDF (solo el qrToken)
      const qrBuffer = await this.generateQRCode(ticket.qrToken);
      const qrBase64 = qrBuffer.toString('base64');

      // Crear un PDF más profesional con diseño similar al frontend
      const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 595 842]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
/F2 6 0 R
/F3 7 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 2000
>>
stream
q
% Fondo con gradiente azul (simulado con rectángulos)
0.2 0.3 0.8 rg
0 700 595 142 re
f
0.15 0.25 0.7 rg
0 650 595 50 re
f

% Título principal en blanco
BT
/F3 28 Tf
1 1 1 rg
50 750 Td
(ENTRADA DIGITAL) Tj
ET

% Información del evento
BT
/F2 18 Tf
0 0 0 rg
50 600 Td
(${eventName}) Tj
ET

% Fecha y hora
BT
/F1 14 Tf
0.3 0.3 0.3 rg
50 570 Td
(DATE & TIME) Tj
ET

BT
/F2 16 Tf
0 0 0 rg
50 545 Td
(${new Date(eventDate).toLocaleDateString('es-ES', { 
  weekday: 'short', 
  day: 'numeric', 
  month: 'short', 
  year: 'numeric' 
})}) Tj
ET

% Ubicación
BT
/F1 14 Tf
0.3 0.3 0.3 rg
50 510 Td
(LOCATION) Tj
ET

BT
/F2 16 Tf
0 0 0 rg
50 485 Td
(${eventLocation}) Tj
ET

% Línea separadora
0.8 0.8 0.8 rg
50 460 495 1 re
f

% Información del ticket
BT
/F1 14 Tf
0.3 0.3 0.3 rg
50 430 Td
(ORDER #) Tj
ET

BT
/F2 16 Tf
0 0 0 rg
50 405 Td
(${ticket.code}) Tj
ET

% Precio
BT
/F1 14 Tf
0.3 0.3 0.3 rg
300 430 Td
(PRECIO) Tj
ET

BT
/F2 16 Tf
0 0 0 rg
300 405 Td
(${ticket.price.amount.toLocaleString('es-ES')} ${ticket.price.currency}) Tj
ET

% Sección QR (lado derecho)
BT
/F1 12 Tf
0.3 0.3 0.3 rg
400 580 Td
(ESCANEAR PARA INGRESAR) Tj
ET

% Placeholder para QR (rectángulo)
0.9 0.9 0.9 rg
420 450 120 120 re
f
0.5 0.5 0.5 RG
420 450 120 120 re
S

% Código QR como texto (ya que no podemos insertar imagen fácilmente)
BT
/F1 10 Tf
0.3 0.3 0.3 rg
440 400 Td
(QR: ${ticket.qrToken.substring(0, 8)}...) Tj
ET

% Estado del ticket
0.8 1 0.8 rg
420 350 100 25 re
f
BT
/F2 12 Tf
0.2 0.6 0.2 rg
435 357 Td
(✓ CONFIRMED) Tj
ET

% Información importante (fondo azul claro)
0.9 0.95 1 rg
50 250 495 120 re
f

BT
/F2 16 Tf
0.2 0.4 0.8 rg
60 340 Td
(INFORMACIÓN IMPORTANTE) Tj
ET

BT
/F1 12 Tf
0.3 0.3 0.3 rg
60 315 Td
(Por favor, presenta este ticket en la entrada para su validación.) Tj
0 -15 Td
(Este ticket es válido para un ingreso único.) Tj
0 -15 Td
(Tipo de entrada: ${ticket.type}) Tj
0 -15 Td
(Fecha de compra: ${ticket.purchaseDate.toLocaleDateString('es-ES')}) Tj
ET

% Footer con información de contacto
BT
/F1 10 Tf
0.5 0.5 0.5 rg
50 200 Td
(${this.configService.get<string>('COMPANY_NAME', 'TicketSales')}) Tj
0 -15 Td
(Soporte: ${this.configService.get<string>('SUPPORT_EMAIL', 'soporte@ticketsales.com')}) Tj
0 -15 Td
(Web: ${this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200')}) Tj
ET

% Código de barras simulado en la parte inferior
0.2 0.2 0.2 rg
50 100 2 40 re f
55 100 1 40 re f
58 100 3 40 re f
65 100 1 40 re f
70 100 2 40 re f
75 100 1 40 re f
80 100 3 40 re f
87 100 1 40 re f
92 100 2 40 re f

BT
/F1 8 Tf
0.3 0.3 0.3 rg
50 85 Td
(${ticket.code}) Tj
ET

Q
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

6 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica-Bold
>>
endobj

7 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica-BoldOblique
>>
endobj

xref
0 8
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000136 00000 n 
0000000271 00000 n 
0000002323 00000 n 
0000002390 00000 n 
0000002461 00000 n 
trailer
<<
/Size 8
/Root 1 0 R
>>
startxref
2537
%%EOF`;
      
      return Buffer.from(pdfContent, 'utf8');
    } catch (error) {
      this.logger.error('Error generando PDF profesional:', error);
      // Fallback a PDF simple si hay error
      return this.generateSimplePDF(ticket, eventName, eventDate, eventLocation);
    }
  }

  /**
   * Genera un PDF simple como fallback
   */
  private generateSimplePDF(ticket: Ticket, eventName: string, eventDate: string, eventLocation: string): Buffer {
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 400
>>
stream
BT
/F1 24 Tf
50 750 Td
(ENTRADA DIGITAL) Tj
0 -50 Td
/F1 16 Tf
(Evento: ${eventName}) Tj
0 -30 Td
(Fecha: ${eventDate}) Tj
0 -30 Td
(Ubicacion: ${eventLocation}) Tj
0 -50 Td
/F1 20 Tf
(Codigo: ${ticket.code}) Tj
0 -30 Td
(Tipo: ${ticket.type}) Tj
0 -30 Td
(Precio: ${ticket.price.amount} ${ticket.price.currency}) Tj
0 -50 Td
/F1 12 Tf
(QR Token: ${ticket.qrToken}) Tj
0 -30 Td
(Presenta este codigo en la entrada) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000136 00000 n 
0000000271 00000 n 
0000000723 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
801
%%EOF`;
    
    return Buffer.from(pdfContent, 'utf8');
  }

  /**
   * Registra helpers personalizados para Handlebars
   */
  private registerHandlebarsHelpers(): void {
    // Helper para formatear fechas
    handlebars.registerHelper('formatDate', (date: string) => {
      return new Date(date).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    });

    // Helper para formatear hora
    handlebars.registerHelper('formatTime', (time: string) => {
      if (!time) return '';
      return new Date(`2000-01-01T${time}`).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
    });

    // Helper para formatear precio
    handlebars.registerHelper('formatPrice', (amount: number, currency: string) => {
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: currency || 'EUR',
      }).format(amount);
    });

    // Helper para generar QR URL
    handlebars.registerHelper('qrCodeUrl', (qrToken: string) => {
      const baseUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200');
      return `${baseUrl}/qr/${qrToken}`;
    });

    // Helper condicional
    handlebars.registerHelper('ifEquals', function(this: any, arg1: any, arg2: any, options: any) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });
  }

  /**
   * Carga y compila una plantilla de email
   */
  private async loadTemplate(templateName: string): Promise<handlebars.TemplateDelegate> {
    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.hbs`);
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      return handlebars.compile(templateContent);
    } catch (error) {
      this.logger.error(`Error al cargar plantilla ${templateName}:`, error);
      throw new Error(`No se pudo cargar la plantilla de email: ${templateName}`);
    }
  }

  /**
   * Envía email de confirmación de compra con entradas
   */
  async sendTicketConfirmationEmail(params: SendTicketEmailParams): Promise<boolean> {
    try {
      this.logger.log(`📧 Enviando email de confirmación a: ${params.buyerEmail}`);

      // Cargar plantilla
      const template = await this.loadTemplate('ticket-confirmation');

      // Preparar datos para la plantilla (sin generar QR base64)
      const ticketsWithQR = params.tickets.map(ticket => ({
        id: ticket.id,
        code: ticket.code,
        type: ticket.type,
        price: ticket.price.amount,
        currency: ticket.price.currency,
        qrToken: ticket.qrToken,
        purchaseDate: ticket.purchaseDate.toISOString(),
      }));

      // Preparar datos para la plantilla
      const templateData = {
        buyerName: params.buyerName || 'Estimado/a cliente',
        buyerEmail: params.buyerEmail,
        eventName: params.eventName,
        eventDate: params.eventDate,
        eventLocation: params.eventLocation,
        eventVenueName: params.eventVenueName,
        eventStartTime: params.eventStartTime,
        eventEndTime: params.eventEndTime,
        eventImage: params.eventImage,
        tickets: ticketsWithQR,
        totalTickets: params.tickets.length,
        totalAmount: params.tickets.reduce((sum, ticket) => sum + ticket.price.amount, 0),
        currency: params.tickets[0]?.price.currency || 'EUR',
        purchaseDate: new Date().toISOString(),
        supportEmail: this.configService.get<string>('SUPPORT_EMAIL', 'soporte@ticketsales.com'),
        companyName: this.configService.get<string>('COMPANY_NAME', 'TicketSales'),
        websiteUrl: this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200'),
      };

      // Generar HTML del email
      const htmlContent = template(templateData);

      // Generar PDFs para cada ticket (temporalmente deshabilitado para arreglar el error)
      const pdfAttachments: EmailAttachment[] = [];
      // TODO: Re-habilitar PDFs una vez arreglado el error de tipos
      /*
      for (const ticket of params.tickets) {
        try {
          const pdfBuffer = await this.generateTicketPDF(
            ticket,
            params.eventName,
            params.eventDate,
            params.eventLocation
          );
          
          pdfAttachments.push({
            filename: `ticket-${ticket.code}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          });
        } catch (error) {
          this.logger.error(`Error generando PDF para ticket ${ticket.code}:`, error);
        }
      }
      */

      // Configurar opciones del email
      const mailOptions: nodemailer.SendMailOptions = {
        from: {
          name: this.configService.get<string>('FROM_NAME', 'TicketSales'),
          address: this.configService.get<string>('FROM_EMAIL') || this.configService.get<string>('SMTP_USER') || 'noreply@ticketsales.com',
        },
        to: params.buyerEmail,
        subject: `🎫 Confirmación de compra - ${params.eventName}`,
        html: htmlContent,
        attachments: [
          ...(params.attachments || []),
          // PDFs temporalmente deshabilitados para arreglar error de compilación
          // ...pdfAttachments,
        ],
      };

      // Enviar email
      const result = await this.transporter.sendMail(mailOptions);
      
      this.logger.log(`✅ Email enviado exitosamente a ${params.buyerEmail}. MessageId: ${result.messageId}`);
      // this.logger.log(`📎 Adjuntos incluidos: ${pdfAttachments.length} PDFs de tickets`);
      return true;

    } catch (error) {
      this.logger.error(`❌ Error al enviar email a ${params.buyerEmail}:`, error);
      return false;
    }
  }

  /**
   * Envía email de recordatorio del evento
   */
  async sendEventReminderEmail(params: SendTicketEmailParams): Promise<boolean> {
    try {
      this.logger.log(`📧 Enviando recordatorio de evento a: ${params.buyerEmail}`);

      const template = await this.loadTemplate('event-reminder');
      
      const templateData = {
        buyerName: params.buyerName || 'Estimado/a cliente',
        eventName: params.eventName,
        eventDate: params.eventDate,
        eventLocation: params.eventLocation,
        eventVenueName: params.eventVenueName,
        eventStartTime: params.eventStartTime,
        eventEndTime: params.eventEndTime,
        tickets: params.tickets.map(ticket => ({
          code: ticket.code,
          type: ticket.type,
          qrToken: ticket.qrToken,
        })),
        totalTickets: params.tickets.length,
        supportEmail: this.configService.get<string>('SUPPORT_EMAIL', 'soporte@ticketsales.com'),
        companyName: this.configService.get<string>('COMPANY_NAME', 'TicketSales'),
        websiteUrl: this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200'),
      };

      const htmlContent = template(templateData);

      const mailOptions: nodemailer.SendMailOptions = {
        from: {
          name: this.configService.get<string>('FROM_NAME', 'TicketSales'),
          address: this.configService.get<string>('FROM_EMAIL') || this.configService.get<string>('SMTP_USER') || 'noreply@ticketsales.com',
        },
        to: params.buyerEmail,
        subject: `🔔 Recordatorio: ${params.eventName} - ¡No olvides tus entradas!`,
        html: htmlContent,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      this.logger.log(`✅ Recordatorio enviado exitosamente a ${params.buyerEmail}. MessageId: ${result.messageId}`);
      return true;

    } catch (error) {
      this.logger.error(`❌ Error al enviar recordatorio a ${params.buyerEmail}:`, error);
      return false;
    }
  }

  /**
   * Método genérico para enviar emails con plantilla personalizada
   */
  async sendTemplateEmail(
    to: string,
    subject: string,
    templateName: string,
    templateData: any,
    attachments?: EmailAttachment[]
  ): Promise<boolean> {
    try {
      const template = await this.loadTemplate(templateName);
      const htmlContent = template(templateData);

      const mailOptions: nodemailer.SendMailOptions = {
        from: {
          name: this.configService.get<string>('FROM_NAME', 'TicketSales'),
          address: this.configService.get<string>('FROM_EMAIL') || this.configService.get<string>('SMTP_USER') || 'noreply@ticketsales.com',
        },
        to,
        subject,
        html: htmlContent,
        attachments: attachments || [],
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Email personalizado enviado a ${to}. MessageId: ${result.messageId}`);
      return true;

    } catch (error) {
      this.logger.error(`❌ Error al enviar email personalizado a ${to}:`, error);
      return false;
    }
  }
}